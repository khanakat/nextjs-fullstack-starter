import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { QueueHelpers } from "@/lib/queue";
import { generateRequestId } from "@/lib/utils";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { handleZodError } from "@/lib/error-handlers";
import { hasPermission, type UserRole } from "@/lib/permissions";
import { db } from "@/lib/db";

// Validation schemas
const EmailJobSchema = z.object({
  type: z.literal("email"),
  payload: z.object({
    to: z.union([
      z.string().email(),
      z.object({
        email: z.string().email(),
        name: z.string().optional(),
      }),
    ]),
    from: z.object({
      email: z.string().email(),
      name: z.string().optional(),
    }).optional(),
    subject: z.string().min(1),
    html: z.string().optional(),
    text: z.string().optional(),
    template: z.string().optional(),
    templateData: z.record(z.any()).optional(),
    attachments: z.array(z.any()).optional(),
    priority: z.enum(["high", "normal", "low"]).default("normal"),
    tags: z.array(z.string()).optional(),
  }),
  options: z.object({
    priority: z.enum(["high", "normal", "low"]).default("normal"),
    delay: z.number().min(0).optional(),
  }).optional(),
});

const BulkEmailJobSchema = z.object({
  type: z.literal("bulk-email"),
  payload: z.object({
    emails: z.array(z.object({
      to: z.union([
        z.string().email(),
        z.object({
          email: z.string().email(),
          name: z.string().optional(),
        }),
      ]),
      subject: z.string().min(1),
      html: z.string().optional(),
      text: z.string().optional(),
      priority: z.enum(["high", "normal", "low"]).default("normal"),
    })),
    batchSize: z.number().min(1).max(100).default(10),
  }),
  options: z.object({
    priority: z.enum(["high", "normal", "low"]).default("normal"),
    delay: z.number().min(0).optional(),
  }).optional(),
});

const ExportJobSchema = z.object({
  type: z.literal("export"),
  payload: z.object({
    exportType: z.enum(["pdf", "csv", "excel"]),
    reportType: z.string().min(1),
    filters: z.record(z.any()).optional(),
    options: z.object({
      includeCharts: z.boolean().default(false),
      includeImages: z.boolean().default(false),
      format: z.enum(["A4", "Letter"]).default("A4"),
      orientation: z.enum(["portrait", "landscape"]).default("portrait"),
    }).optional(),
    notifyEmail: z.string().email().optional(),
    fileName: z.string().optional(),
  }),
  options: z.object({
    priority: z.enum(["high", "normal", "low"]).default("normal"),
    delay: z.number().min(0).optional(),
  }).optional(),
});

const NotificationJobSchema = z.object({
  type: z.literal("notification"),
  payload: z.object({
    type: z.enum(["email", "push", "sms"]),
    template: z.string().min(1),
    recipients: z.array(z.string().email()),
    data: z.record(z.any()),
    priority: z.enum(["high", "normal", "low"]).default("normal"),
    scheduleAt: z.string().optional(),
  }),
  options: z.object({
    priority: z.enum(["high", "normal", "low"]).default("normal"),
    delay: z.number().min(0).optional(),
  }).optional(),
});

const QueueJobSchema = z.discriminatedUnion("type", [
  EmailJobSchema,
  BulkEmailJobSchema,
  ExportJobSchema,
  NotificationJobSchema,
]);

/**
 * POST /api/queue - Add jobs to queue
 */
export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  let userId: string | null = null;
  let organizationId: string | null = null;

  try {
    // Authentication
    const { userId: authUserId } = auth();
    if (!authUserId) {
      return StandardErrorResponse.unauthorized(
        "Authentication required to add jobs to queue",
        requestId,
      );
    }
    userId = authUserId;

    // Get user's organization and check permissions
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: {
        organizationMemberships: {
          include: { organization: true },
        },
      },
    });

    if (!user?.organizationMemberships?.[0]) {
      return StandardErrorResponse.forbidden(
        "Organization membership required to add jobs to queue",
        requestId,
      );
    }

    organizationId = user.organizationMemberships[0].organizationId;

    // Check permissions
    const userWithRole = {
      id: user.id,
      email: user.email,
      role: user.organizationMemberships[0].role as UserRole,
      organizationId: user.organizationMemberships[0].organizationId,
    };

    if (!hasPermission(userWithRole, "create", "organizations")) {
      return StandardErrorResponse.forbidden(
        "Insufficient permissions to add jobs to queue",
        requestId,
      );
    }

    logger.info("Processing queue job request", "queue", {
      requestId,
      userId,
      organizationId,
    });

    // Parse and validate request body
    const body = await request.json();
    const validatedData = QueueJobSchema.parse(body);

    let jobResult;

    switch (validatedData.type) {
      case "email":
        jobResult = await QueueHelpers.sendEmail(
          validatedData.payload,
          {
            ...validatedData.options,
            userId: user.id,
            organizationId,
          }
        );
        break;

      case "bulk-email":
        jobResult = await QueueHelpers.sendBulkEmail(
          validatedData.payload,
          {
            ...validatedData.options,
            userId: user.id,
            organizationId,
          }
        );
        break;

      case "export":
        jobResult = await QueueHelpers.exportData(
          validatedData.payload,
          {
            ...validatedData.options,
            userId: user.id,
            organizationId,
          }
        );
        break;

      case "notification":
        jobResult = await QueueHelpers.sendNotification(
          validatedData.payload,
          {
            ...validatedData.options,
            userId: user.id,
            organizationId,
          }
        );
        break;

      default:
        return StandardErrorResponse.badRequest(
          "Invalid job type",
          requestId,
        );
    }

    // Check if job was successfully created
    if (!jobResult) {
      return StandardErrorResponse.internal(
        "Failed to create job",
        { code: "QUEUE_JOB_CREATION_FAILED" },
        requestId,
      );
    }

    logger.info("Queue job added successfully", "queue", {
      requestId,
      userId,
      organizationId,
      jobType: validatedData.type,
      jobId: jobResult.id,
    });

    return StandardSuccessResponse.create({
      message: "Job added to queue successfully",
      jobId: jobResult.id,
      jobType: validatedData.type,
      estimatedProcessingTime: getEstimatedProcessingTime(validatedData.type),
      requestId,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error, requestId);
    }

    logger.error("Error processing queue job request", "queue", {
      requestId,
      userId,
      organizationId,
      error: error instanceof Error ? error.message : error,
      endpoint: "/api/queue",
    });

    return StandardErrorResponse.internal(
      "Failed to process queue job request",
      process.env.NODE_ENV === "development"
        ? {
            originalError: error instanceof Error ? error.message : error,
          }
        : undefined,
      requestId,
    );
  }
}

/**
 * GET /api/queue - Get queue statistics and job status
 */
export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  let userId: string | null = null;
  let organizationId: string | null = null;

  try {
    // Authentication
    const { userId: authUserId } = auth();
    if (!authUserId) {
      return StandardErrorResponse.unauthorized(
        "Authentication required to access queue statistics",
        requestId,
      );
    }
    userId = authUserId;

    // Get user's organization and check permissions
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: {
        organizationMemberships: {
          include: { organization: true },
        },
      },
    });

    if (!user?.organizationMemberships?.[0]) {
      return StandardErrorResponse.forbidden(
        "Organization membership required to access queue statistics",
        requestId,
      );
    }

    organizationId = user.organizationMemberships[0].organizationId;

    // Check permissions
    const userWithRole = {
      id: user.id,
      email: user.email,
      role: user.organizationMemberships[0].role as UserRole,
      organizationId: user.organizationMemberships[0].organizationId,
    };

    if (!hasPermission(userWithRole, "read", "organizations")) {
      return StandardErrorResponse.forbidden(
        "Insufficient permissions to access queue statistics",
        requestId,
      );
    }

    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get("stats") === "true";

    logger.info("Fetching queue information", "queue", {
      requestId,
      userId,
      organizationId,
      includeStats,
    });

    let stats = null;
    if (includeStats) {
      stats = await QueueHelpers.getStats();
    }

    return StandardSuccessResponse.create({
      message: "Queue information retrieved successfully",
      stats,
      availableJobTypes: ["email", "bulk-email", "export", "notification"],
      requestId,
    });

  } catch (error) {
    logger.error("Error fetching queue information", "queue", {
      requestId,
      userId,
      organizationId,
      error: error instanceof Error ? error.message : error,
      endpoint: "/api/queue",
    });

    return StandardErrorResponse.internal(
      "Failed to fetch queue information",
      process.env.NODE_ENV === "development"
        ? {
            originalError: error instanceof Error ? error.message : error,
          }
        : undefined,
      requestId,
    );
  }
}

/**
 * DELETE /api/queue - Clean old jobs or pause/resume queues
 */
export async function DELETE(request: NextRequest) {
  const requestId = generateRequestId();
  let userId: string | null = null;
  let organizationId: string | null = null;

  try {
    // Authentication
    const { userId: authUserId } = auth();
    if (!authUserId) {
      return StandardErrorResponse.unauthorized(
        "Authentication required to manage queues",
        requestId,
      );
    }
    userId = authUserId;

    // Get user's organization and check permissions
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: {
        organizationMemberships: {
          include: { organization: true },
        },
      },
    });

    if (!user?.organizationMemberships?.[0]) {
      return StandardErrorResponse.forbidden(
        "Organization membership required to manage queues",
        requestId,
      );
    }

    organizationId = user.organizationMemberships[0].organizationId;

    // Check permissions (admin only)
    const userWithRole = {
      id: user.id,
      email: user.email,
      role: user.organizationMemberships[0].role as UserRole,
      organizationId: user.organizationMemberships[0].organizationId,
    };

    if (!hasPermission(userWithRole, "delete", "organizations")) {
      return StandardErrorResponse.forbidden(
        "Admin permissions required to manage queues",
        requestId,
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const olderThan = parseInt(searchParams.get("olderThan") || "86400000"); // 24 hours default

    logger.info("Processing queue management request", "queue", {
      requestId,
      userId,
      organizationId,
      action,
      olderThan,
    });

    let result;
    switch (action) {
      case "clean":
        result = await QueueHelpers.cleanAll(olderThan);
        break;
      case "pause":
        result = await QueueHelpers.pauseAll();
        break;
      case "resume":
        result = await QueueHelpers.resumeAll();
        break;
      default:
        return StandardErrorResponse.badRequest(
          "Invalid action. Use 'clean', 'pause', or 'resume'",
          requestId,
        );
    }

    return StandardSuccessResponse.create({
      message: `Queue ${action} operation completed successfully`,
      result,
      requestId,
    });

  } catch (error) {
    logger.error("Error managing queues", "queue", {
      requestId,
      userId,
      organizationId,
      error: error instanceof Error ? error.message : error,
      endpoint: "/api/queue",
    });

    return StandardErrorResponse.internal(
      "Failed to manage queues",
      process.env.NODE_ENV === "development"
        ? {
            originalError: error instanceof Error ? error.message : error,
          }
        : undefined,
      requestId,
    );
  }
}

/**
 * Get estimated processing time for job type
 */
function getEstimatedProcessingTime(jobType: string): string {
  const estimates: Record<string, string> = {
    "email": "< 1 minute",
    "bulk-email": "2-5 minutes",
    "export": "3-10 minutes",
    "notification": "< 2 minutes",
  };

  return estimates[jobType] || "Unknown";
}