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
const EmailTestRequestSchema = z.object({
  type: z.enum([
    "welcome",
    "password-reset",
    "email-verification",
    "notification",
    "custom",
  ]),
  data: z
    .object({
      title: z.string().optional(),
      message: z.string().optional(),
      subject: z.string().optional(),
      html: z.string().optional(),
      text: z.string().optional(),
      actionUrl: z.string().url().optional(),
      actionText: z.string().optional(),
    })
    .optional(),
});

export async function POST(_request: NextRequest) {
  const requestId = generateRequestId();
  let userId: string | null = null;
  let organizationId: string | null = null;

  try {
    // Authentication
    const { userId: authUserId } = auth();
    if (!authUserId) {
      return StandardErrorResponse.unauthorized(
        "Authentication required to test email functionality",
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
        "Organization membership required to test email functionality",
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
        "Insufficient permissions to test email functionality",
        requestId,
      );
    }

    logger.info("Testing email functionality", "email", {
      requestId,
      userId,
      organizationId,
      userEmail: user.email,
    });

    // Parse and validate request body
    const body = await _request.json();
    const validatedData = EmailTestRequestSchema.parse(body);
    const { type, data } = validatedData;

    const userEmail = user.email;
    const userName = user.name || "User";

    logger.info("Sending test email", "email", {
      requestId,
      userId,
      organizationId,
      emailType: type,
      recipientEmail: userEmail,
    });

    let result;

    switch (type) {
      case "welcome":
        result = await EmailService.sendWelcomeEmail(userEmail, userName);
        break;

      case "password-reset":
        // In a real app, you'd generate a secure token
        const resetToken = "demo-reset-token-" + Date.now();
        result = await EmailService.sendPasswordResetEmail(
          userEmail,
          userName,
          resetToken,
        );
        break;

      case "email-verification":
        // In a real app, you'd generate a secure token
        const verificationToken = "demo-verification-token-" + Date.now();
        result = await EmailService.sendEmailVerification(
          userEmail,
          userName,
          verificationToken,
        );
        break;

      case "notification":
        result = await EmailService.sendNotification(
          userEmail,
          data?.title || "Test Notification",
          {
            html: `<h1>${data?.title || "Test Notification"}</h1><p>${data?.message || "This is a test notification from your app."}</p>`,
            text: `${data?.title || "Test Notification"}\n\n${data?.message || "This is a test notification from your app."}`
          }
        );
        break;

      case "custom":
        result = await EmailService.sendCustomEmail(
          userEmail,
          data?.subject || "Test Email",
          data?.html || "<h1>Test Email</h1><p>This is a test email.</p>",
          data?.text,
        );
        break;

      default:
        return StandardErrorResponse.badRequest(
          "Invalid email type provided",
          "email",
          {
            validTypes: [
              "welcome",
              "password-reset",
              "email-verification",
              "notification",
              "custom",
            ],
          },
          requestId,
        );
    }

    logger.info("Test email sent successfully", "email", {
      requestId,
      userId,
      organizationId,
      emailType: type,
      emailId: result?.data?.id,
    });

    return StandardSuccessResponse.create({
      message: "Test email sent successfully",
      emailType: type,
      emailId: result?.data?.id,
      requestId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error, requestId);
    }

    logger.error("Error processing email test request", "email", {
      requestId,
      userId,
      organizationId,
      error: error instanceof Error ? error.message : error,
      endpoint: "/api/email/test",
    });

    return StandardErrorResponse.internal(
      "Failed to process email test request",
      process.env.NODE_ENV === "development"
        ? {
            originalError: error instanceof Error ? error.message : error,
          }
        : undefined,
      requestId,
    );
  }
}
