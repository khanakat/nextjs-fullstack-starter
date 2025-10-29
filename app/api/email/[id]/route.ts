import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { generateRequestId } from "@/lib/utils";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { handleZodError } from "@/lib/error-handlers";
import { hasPermission, type UserRole } from "@/lib/permissions";
import { db } from "@/lib/db";

// Validation schemas
const EmailIdSchema = z.object({
  id: z.string().min(1, "Email ID is required"),
});

const UpdateEmailStatusSchema = z.object({
  status: z.enum([
    "draft",
    "scheduled",
    "sending",
    "sent",
    "failed",
    "cancelled",
  ]),
  scheduledAt: z.string().datetime().optional(),
  cancelReason: z.string().optional(),
});

/**
 * GET /api/email/[id] - Get specific email details
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();
  let userId: string | null = null;
  let organizationId: string | null = null;

  try {
    // Validate email ID parameter
    const { id: emailId } = EmailIdSchema.parse(params);

    // Authentication
    const { userId: authUserId } = auth();
    if (!authUserId) {
      return StandardErrorResponse.unauthorized(
        "Authentication required to access email details",
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
        "Organization membership required to access email details",
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
        "Insufficient permissions to access email details",
        requestId,
      );
    }

    logger.info("Fetching email details", "email", {
      requestId,
      userId,
      organizationId,
      emailId,
    });

    // Mock email data - in production, fetch from database
    const mockEmail = {
      id: emailId,
      subject: "Welcome to Our Platform",
      html: "<h1>Welcome!</h1><p>Thank you for joining us.</p>",
      text: "Welcome! Thank you for joining us.",
      status: "sent",
      type: "transactional",
      templateId: "template_welcome",
      recipients: [
        {
          email: "user@example.com",
          status: "delivered",
          deliveredAt: new Date().toISOString(),
          openedAt: new Date().toISOString(),
          clickedAt: null,
          bounced: false,
          complained: false,
        },
      ],
      statistics: {
        sent: 1,
        delivered: 1,
        opened: 1,
        clicked: 0,
        bounced: 0,
        complained: 0,
        unsubscribed: 0,
        deliveryRate: 100,
        openRate: 100,
        clickRate: 0,
      },
      organizationId,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      sentAt: new Date().toISOString(),
      metadata: {
        campaign: "welcome_series",
        source: "api",
      },
    };

    // Check if email belongs to user's organization
    if (mockEmail.organizationId !== organizationId) {
      return StandardErrorResponse.notFound("Email not found", requestId);
    }

    return StandardSuccessResponse.create({
      email: mockEmail,
      requestId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error, requestId);
    }

    logger.error("Error fetching email details", "email", {
      requestId,
      userId,
      organizationId,
      emailId: params.id,
      error: error instanceof Error ? error.message : error,
      endpoint: `/api/email/${params.id}`,
    });

    return StandardErrorResponse.internal(
      "Failed to fetch email details",
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
 * PATCH /api/email/[id] - Update email status or details
 */
export async function PATCH(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();
  let userId: string | null = null;
  let organizationId: string | null = null;

  try {
    // Validate email ID parameter
    const { id: emailId } = EmailIdSchema.parse(params);

    // Authentication
    const { userId: authUserId } = auth();
    if (!authUserId) {
      return StandardErrorResponse.unauthorized(
        "Authentication required to update email",
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
        "Organization membership required to update email",
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

    if (!hasPermission(userWithRole, "update", "organizations")) {
      return StandardErrorResponse.forbidden(
        "Insufficient permissions to update email",
        requestId,
      );
    }

    logger.info("Updating email", "email", {
      requestId,
      userId,
      organizationId,
      emailId,
    });

    // Parse and validate request body
    const body = await _request.json();
    const validatedData = UpdateEmailStatusSchema.parse(body);

    // Mock email lookup - in production, fetch from database
    const existingEmail = {
      id: emailId,
      status: "scheduled",
      organizationId,
      createdBy: userId,
    };

    // Check if email belongs to user's organization
    if (existingEmail.organizationId !== organizationId) {
      return StandardErrorResponse.notFound("Email not found", requestId);
    }

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      draft: ["scheduled", "sending", "cancelled"],
      scheduled: ["sending", "cancelled"],
      sending: ["sent", "failed"],
      sent: [],
      failed: ["scheduled"],
      cancelled: ["scheduled"],
    };

    if (
      !validTransitions[existingEmail.status]?.includes(validatedData.status)
    ) {
      return StandardErrorResponse.badRequest(
        `Cannot transition from ${existingEmail.status} to ${validatedData.status}`,
        requestId,
      );
    }

    // Update email (mock implementation)
    const updatedEmail = {
      ...existingEmail,
      status: validatedData.status,
      scheduledAt: validatedData.scheduledAt,
      cancelReason: validatedData.cancelReason,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
    };

    logger.info("Email updated successfully", "email", {
      requestId,
      userId,
      organizationId,
      emailId,
      oldStatus: existingEmail.status,
      newStatus: validatedData.status,
    });

    return StandardSuccessResponse.create({
      message: "Email updated successfully",
      email: updatedEmail,
      requestId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error, requestId);
    }

    logger.error("Error updating email", "email", {
      requestId,
      userId,
      organizationId,
      emailId: params.id,
      error: error instanceof Error ? error.message : error,
      endpoint: `/api/email/${params.id}`,
    });

    return StandardErrorResponse.internal(
      "Failed to update email",
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
 * DELETE /api/email/[id] - Delete email (only drafts and cancelled emails)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();
  let userId: string | null = null;
  let organizationId: string | null = null;

  try {
    // Validate email ID parameter
    const { id: emailId } = EmailIdSchema.parse(params);

    // Authentication
    const { userId: authUserId } = auth();
    if (!authUserId) {
      return StandardErrorResponse.unauthorized(
        "Authentication required to delete email",
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
        "Organization membership required to delete email",
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

    if (!hasPermission(userWithRole, "delete", "organizations")) {
      return StandardErrorResponse.forbidden(
        "Insufficient permissions to delete email",
        requestId,
      );
    }

    logger.info("Deleting email", "email", {
      requestId,
      userId,
      organizationId,
      emailId,
    });

    // Mock email lookup - in production, fetch from database
    const existingEmail = {
      id: emailId,
      status: "draft",
      organizationId,
      createdBy: userId,
    };

    // Check if email belongs to user's organization
    if (existingEmail.organizationId !== organizationId) {
      return StandardErrorResponse.notFound("Email not found", requestId);
    }

    // Only allow deletion of drafts and cancelled emails
    if (!["draft", "cancelled"].includes(existingEmail.status)) {
      return StandardErrorResponse.badRequest(
        "Only draft and cancelled emails can be deleted",
        requestId,
      );
    }

    // Delete email (mock implementation)
    logger.info("Email deleted successfully", "email", {
      requestId,
      userId,
      organizationId,
      emailId,
      status: existingEmail.status,
    });

    return StandardSuccessResponse.create({
      message: "Email deleted successfully",
      requestId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error, requestId);
    }

    logger.error("Error deleting email", "email", {
      requestId,
      userId,
      organizationId,
      emailId: params.id,
      error: error instanceof Error ? error.message : error,
      endpoint: `/api/email/${params.id}`,
    });

    return StandardErrorResponse.internal(
      "Failed to delete email",
      process.env.NODE_ENV === "development"
        ? {
            originalError: error instanceof Error ? error.message : error,
          }
        : undefined,
      requestId,
    );
  }
}
