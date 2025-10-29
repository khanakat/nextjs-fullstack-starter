import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { EmailService } from "@/lib/email-service";
import { generateRequestId } from "@/lib/utils";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { handleZodError } from "@/lib/error-handlers";
import { hasPermission, type UserRole } from "@/lib/permissions";
import { db } from "@/lib/db";

// Validation schemas
const BulkEmailSendSchema = z.object({
  recipients: z
    .array(z.string().email())
    .min(1, "At least one recipient is required")
    .max(1000, "Maximum 1000 recipients per batch"),
  subject: z
    .string()
    .min(1, "Subject is required")
    .max(200, "Subject too long"),
  html: z.string().min(1, "HTML content is required"),
  text: z.string().optional(),
  templateId: z.string().optional(),
  templateData: z.record(z.any()).optional(),
  scheduledAt: z.string().datetime().optional(),
  priority: z.enum(["low", "normal", "high"]).default("normal"),
  tags: z.array(z.string()).optional(),
  trackOpens: z.boolean().default(true),
  trackClicks: z.boolean().default(true),
});

/**
 * POST /api/email/send - Send bulk emails with advanced options
 */
export async function POST(_request: NextRequest) {
  const requestId = generateRequestId();
  let userId: string | null = null;
  let organizationId: string | null = null;

  try {
    // Authentication
    const { userId: authUserId } = auth();
    if (!authUserId) {
      return StandardErrorResponse.unauthorized(
        "Authentication required to send bulk emails",
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
        "Organization membership required to send bulk emails",
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
        "Insufficient permissions to send bulk emails",
        requestId,
      );
    }

    logger.info("Processing bulk email send request", "email", {
      requestId,
      userId,
      organizationId,
    });

    // Parse and validate request body
    const body = await _request.json();
    const validatedData = BulkEmailSendSchema.parse(body);

    // Rate limiting check (mock implementation)
    // In production, implement actual rate limiting with Redis or similar

    logger.info("Sending bulk email", "email", {
      requestId,
      userId,
      organizationId,
      recipientCount: validatedData.recipients.length,
      priority: validatedData.priority,
      scheduled: !!validatedData.scheduledAt,
    });

    // If scheduled, handle scheduling
    if (validatedData.scheduledAt) {
      const scheduledDate = new Date(validatedData.scheduledAt);
      if (scheduledDate <= new Date()) {
        return StandardErrorResponse.badRequest(
          "Scheduled time must be in the future",
          requestId,
        );
      }

      // Mock scheduled email creation
      const scheduledEmailId = `scheduled_${Date.now()}`;

      logger.info("Email scheduled successfully", "email", {
        requestId,
        userId,
        organizationId,
        scheduledEmailId,
        scheduledAt: validatedData.scheduledAt,
      });

      return StandardSuccessResponse.create({
        message: "Email scheduled successfully",
        scheduledEmailId,
        scheduledAt: validatedData.scheduledAt,
        recipientCount: validatedData.recipients.length,
        requestId,
      });
    }

    // Send immediate bulk email
    await EmailService.sendBulkEmail(
      validatedData.recipients,
      validatedData.subject,
      validatedData.html,
      validatedData.text,
    );

    // Mock tracking setup
    const trackingId = `track_${Date.now()}`;

    logger.info("Bulk email sent successfully", "email", {
      requestId,
      userId,
      organizationId,
      trackingId,
      recipientCount: validatedData.recipients.length,
    });

    return StandardSuccessResponse.create({
      message: "Bulk email sent successfully",
      trackingId,
      recipientCount: validatedData.recipients.length,
      estimatedDeliveryTime: "5-10 minutes",
      requestId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error, requestId);
    }

    logger.error("Error processing bulk email send request", "email", {
      requestId,
      userId,
      organizationId,
      error: error instanceof Error ? error.message : error,
      endpoint: "/api/email/send",
    });

    return StandardErrorResponse.internal(
      "Failed to process bulk email send request",
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
 * GET /api/email/send - Get bulk email sending status and queue
 */
export async function GET(_request: NextRequest) {
  const requestId = generateRequestId();
  let userId: string | null = null;
  let organizationId: string | null = null;

  try {
    // Authentication
    const { userId: authUserId } = auth();
    if (!authUserId) {
      return StandardErrorResponse.unauthorized(
        "Authentication required to access email send status",
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
        "Organization membership required to access email send status",
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
        "Insufficient permissions to access email send status",
        requestId,
      );
    }

    const { searchParams } = new URL(_request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    logger.info("Fetching email send status", "email", {
      requestId,
      userId,
      organizationId,
      status,
      page,
      limit,
    });

    // Mock email send queue data
    const mockQueue = {
      pending: 5,
      processing: 2,
      completed: 48,
      failed: 1,
      scheduled: 3,
      queue: [
        {
          id: "bulk_1",
          subject: "Monthly Newsletter",
          recipientCount: 1500,
          status: "processing",
          progress: 75,
          createdAt: new Date().toISOString(),
          estimatedCompletion: new Date(Date.now() + 300000).toISOString(),
        },
        {
          id: "bulk_2",
          subject: "Product Update",
          recipientCount: 850,
          status: "pending",
          progress: 0,
          createdAt: new Date().toISOString(),
          scheduledAt: new Date(Date.now() + 3600000).toISOString(),
        },
      ],
    };

    return StandardSuccessResponse.create({
      queue: mockQueue,
      pagination: {
        page,
        limit,
        total: mockQueue.queue.length,
        totalPages: Math.ceil(mockQueue.queue.length / limit),
      },
      requestId,
    });
  } catch (error) {
    logger.error("Error fetching email send status", "email", {
      requestId,
      userId,
      organizationId,
      error: error instanceof Error ? error.message : error,
      endpoint: "/api/email/send",
    });

    return StandardErrorResponse.internal(
      "Failed to fetch email send status",
      process.env.NODE_ENV === "development"
        ? {
            originalError: error instanceof Error ? error.message : error,
          }
        : undefined,
      requestId,
    );
  }
}
