import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { emailService } from "@/lib/email/email-service";
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
const SendEmailRequestSchema = z.object({
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
  // Queue options
  useQueue: z.boolean().default(false),
  delay: z.number().min(0).optional(),
});

const BulkEmailRequestSchema = z.object({
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
  // Queue options
  useQueue: z.boolean().default(true), // Default to true for bulk emails
  delay: z.number().min(0).optional(),
});

/**
 * POST /api/email - Send single or bulk emails
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
        "Authentication required to send emails",
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
        "Organization membership required to send emails",
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
        "Insufficient permissions to send emails",
        requestId,
      );
    }

    logger.info("Processing email send request", "email", {
      requestId,
      userId,
      organizationId,
    });

    // Parse and validate request body
    const body = await _request.json();
    const isBulkEmail = Array.isArray(body.emails);
    
    if (isBulkEmail) {
      const validatedData = BulkEmailRequestSchema.parse(body);
      
      if (validatedData.useQueue) {
        // Send bulk emails via queue
        const jobResult = await QueueHelpers.sendBulkEmail(
          {
            emails: validatedData.emails,
            batchSize: validatedData.batchSize,
          },
          {
            priority: "normal",
            delay: validatedData.delay,
            userId: user.id,
            organizationId,
          }
        );

        if (!jobResult) {
          return StandardErrorResponse.create(
            "Failed to queue bulk email job",
            "QUEUE_ERROR",
            500,
            undefined,
            requestId
          );
        }

        logger.info("Bulk email job queued successfully", "email", {
          requestId,
          userId,
          organizationId,
          emailCount: validatedData.emails.length,
          jobId: jobResult.id,
        });

        return StandardSuccessResponse.create({
          message: "Bulk email job queued successfully",
          jobId: jobResult.id,
          emailCount: validatedData.emails.length,
          estimatedProcessingTime: "2-5 minutes",
          requestId,
        });
      } else {
        // Send bulk emails directly
        const results = [];
        for (const email of validatedData.emails) {
          const result = await emailService.sendEmail({
            to: typeof email.to === 'string' ? { email: email.to } : email.to,
            subject: email.subject,
            html: email.html,
            text: email.text,
            priority: email.priority,
          });
          results.push(result);
        }

        logger.info("Bulk email sent directly", "email", {
          requestId,
          userId,
          organizationId,
          emailCount: validatedData.emails.length,
        });

        return StandardSuccessResponse.create({
          message: "Bulk email sent successfully",
          results,
          emailCount: validatedData.emails.length,
          requestId,
        });
      }
    } else {
      const validatedData = SendEmailRequestSchema.parse(body);
      
      if (validatedData.useQueue) {
        // Send single email via queue
        const jobResult = await QueueHelpers.sendEmail(
          {
            to: validatedData.to,
            from: validatedData.from,
            subject: validatedData.subject,
            html: validatedData.html,
            text: validatedData.text,
            template: validatedData.template,
            templateData: validatedData.templateData,
            attachments: validatedData.attachments,
            priority: validatedData.priority,
            tags: validatedData.tags,
          },
          {
            priority: validatedData.priority,
            delay: validatedData.delay,
            userId: user.id,
            organizationId,
          }
        );

        if (!jobResult) {
          return StandardErrorResponse.create(
            "Failed to queue email job",
            "QUEUE_ERROR",
            500,
            undefined,
            requestId
          );
        }

        logger.info("Email job queued successfully", "email", {
          requestId,
          userId,
          organizationId,
          to: validatedData.to,
          jobId: jobResult.id,
        });

        return StandardSuccessResponse.create({
          message: "Email job queued successfully",
          jobId: jobResult.id,
          estimatedProcessingTime: "< 1 minute",
          requestId,
        });
      } else {
        // Send single email directly
        const result = await emailService.sendEmail({
          to: typeof validatedData.to === 'string' ? { email: validatedData.to } : validatedData.to,
          from: validatedData.from ? (typeof validatedData.from === 'string' ? { email: validatedData.from } : validatedData.from) : undefined,
          subject: validatedData.subject,
          html: validatedData.html,
          text: validatedData.text,
          template: validatedData.template,
          templateData: validatedData.templateData,
          attachments: validatedData.attachments,
          priority: validatedData.priority,
          tags: validatedData.tags,
        });

        logger.info("Email sent directly", "email", {
          requestId,
          userId,
          organizationId,
          to: validatedData.to,
        });

        return StandardSuccessResponse.create({
          message: "Email sent successfully",
          result,
          requestId,
        });
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error, requestId);
    }

    logger.error("Error processing email send request", "email", {
      requestId,
      userId,
      organizationId,
      error: error instanceof Error ? error.message : error,
      endpoint: "/api/email",
    });

    return StandardErrorResponse.internal(
      "Failed to process email send request",
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
 * GET /api/email - Get email sending statistics and history
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
        "Authentication required to access email statistics",
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
        "Organization membership required to access email statistics",
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
        "Insufficient permissions to access email statistics",
        requestId,
      );
    }

    const { searchParams } = new URL(_request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const type = searchParams.get("type");

    logger.info("Fetching email statistics", "email", {
      requestId,
      userId,
      organizationId,
      page,
      limit,
      type,
    });

    // Mock email statistics - in production, this would query actual email logs
    const mockStats = {
      totalSent: 1250,
      totalDelivered: 1198,
      totalBounced: 32,
      totalOpened: 856,
      totalClicked: 234,
      deliveryRate: 95.8,
      openRate: 71.4,
      clickRate: 19.5,
      recentEmails: [
        {
          id: "email_1",
          subject: "Welcome to our platform",
          recipient: "user@example.com",
          status: "delivered",
          sentAt: new Date().toISOString(),
          deliveredAt: new Date().toISOString(),
          openedAt: new Date().toISOString(),
        },
      ],
    };

    return StandardSuccessResponse.create({
      statistics: mockStats,
      pagination: {
        page,
        limit,
        total: mockStats.recentEmails.length,
        totalPages: Math.ceil(mockStats.recentEmails.length / limit),
      },
      requestId,
    });
  } catch (error) {
    logger.error("Error fetching email statistics", "email", {
      requestId,
      userId,
      organizationId,
      error: error instanceof Error ? error.message : error,
      endpoint: "/api/email",
    });

    return StandardErrorResponse.internal(
      "Failed to fetch email statistics",
      process.env.NODE_ENV === "development"
        ? {
            originalError: error instanceof Error ? error.message : error,
          }
        : undefined,
      requestId,
    );
  }
}
