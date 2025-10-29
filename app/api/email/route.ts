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
const SendEmailRequestSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  subject: z.string().min(1, "Subject is required"),
  html: z.string().min(1, "HTML content is required"),
  text: z.string().optional(),
  type: z
    .enum(["transactional", "marketing", "notification"])
    .default("transactional"),
});

const BulkEmailRequestSchema = z.object({
  recipients: z
    .array(z.string().email())
    .min(1, "At least one recipient is required"),
  subject: z.string().min(1, "Subject is required"),
  html: z.string().min(1, "HTML content is required"),
  text: z.string().optional(),
  type: z
    .enum(["newsletter", "announcement", "marketing"])
    .default("newsletter"),
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

    // Determine if it's a bulk email request
    const isBulkEmail = body.recipients && Array.isArray(body.recipients);

    let result;

    if (isBulkEmail) {
      const validatedData = BulkEmailRequestSchema.parse(body);

      logger.info("Sending bulk email", "email", {
        requestId,
        userId,
        organizationId,
        recipientCount: validatedData.recipients.length,
        emailType: validatedData.type,
      });

      result = await EmailService.sendBulkEmail(
        validatedData.recipients,
        validatedData.subject,
        validatedData.html,
        validatedData.text,
      );
    } else {
      const validatedData = SendEmailRequestSchema.parse(body);

      logger.info("Sending single email", "email", {
        requestId,
        userId,
        organizationId,
        recipientCount: Array.isArray(validatedData.to)
          ? validatedData.to.length
          : 1,
        emailType: validatedData.type,
      });

      result = await EmailService.sendCustomEmail(
        validatedData.to,
        validatedData.subject,
        validatedData.html,
        validatedData.text,
      );
    }

    logger.info("Email sent successfully", "email", {
      requestId,
      userId,
      organizationId,
      emailId: result?.data?.id || result?.[0]?.data?.id,
    });

    return StandardSuccessResponse.create({
      message: isBulkEmail
        ? "Bulk email sent successfully"
        : "Email sent successfully",
      emailId: result?.data?.id || result?.[0]?.data?.id,
      requestId,
    });
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
