import { NextRequest } from "next/server";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { logger } from "@/lib/logger";
import { generateRequestId } from "@/lib/utils";
import { handleZodError } from "@/lib/error-handlers";
import { auth } from "@clerk/nextjs/server";
import { db as prisma } from "@/lib/db";
import { z } from "zod";

const preferencesSchema = z.object({
  pushEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  taskAssignments: z.boolean().optional(),
  workflowUpdates: z.boolean().optional(),
  systemAlerts: z.boolean().optional(),
  reminders: z.boolean().optional(),
  marketing: z.boolean().optional(),
  quietHoursEnabled: z.boolean().optional(),
  quietHoursStart: z.string().optional(),
  quietHoursEnd: z.string().optional(),
  quietHoursTimezone: z.string().optional(),
  deliveryMethod: z.enum(["push", "email", "sms", "all"]).optional(),
  frequency: z.enum(["immediate", "hourly", "daily", "weekly"]).optional(),
  batchNotifications: z.boolean().optional(),
  mobileEnabled: z.boolean().optional(),
  desktopEnabled: z.boolean().optional(),
});

export async function GET(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    logger.info("Processing notification preferences request", "mobile", {
      requestId,
    });

    // Authentication
    const { userId } = auth();
    if (!userId) {
      logger.warn("Unauthorized notification preferences request", "mobile", {
        requestId,
      });
      return StandardErrorResponse.unauthorized("Authentication required");
    }

    // Get user information
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!user) {
      logger.error("User not found for notification preferences", "mobile", {
        requestId,
        userId,
      });
      return StandardErrorResponse.notFound("User not found");
    }

    // Get user's notification preferences
    let preferences = await prisma.notificationPreferences.findUnique({
      where: { userId: user.id },
    });

    // If no preferences exist, create default ones
    if (!preferences) {
      preferences = await prisma.notificationPreferences.create({
        data: {
          userId: user.id,
          // Default values are set in the schema
        },
      });

      logger.info("Created default notification preferences", "mobile", {
        requestId,
        userId: user.id,
      });
    }

    logger.info("Notification preferences retrieved successfully", "mobile", {
      requestId,
      userId: user.id,
    });

    return StandardSuccessResponse.ok({
      preferences: {
        pushEnabled: preferences.pushEnabled,
        emailEnabled: preferences.emailEnabled,
        smsEnabled: preferences.smsEnabled,
        taskAssignments: preferences.taskAssignments,
        workflowUpdates: preferences.workflowUpdates,
        systemAlerts: preferences.systemAlerts,
        reminders: preferences.reminders,
        marketing: preferences.marketing,
        quietHoursEnabled: preferences.quietHoursEnabled,
        quietHoursStart: preferences.quietHoursStart,
        quietHoursEnd: preferences.quietHoursEnd,
        quietHoursTimezone: preferences.quietHoursTimezone,
        deliveryMethod: preferences.deliveryMethod,
        frequency: preferences.frequency,
        batchNotifications: preferences.batchNotifications,
        mobileEnabled: preferences.mobileEnabled,
        desktopEnabled: preferences.desktopEnabled,
      },
    });
  } catch (error) {
    logger.error("Failed to retrieve notification preferences", "mobile", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return StandardErrorResponse.internal(
      "Failed to retrieve notification preferences",
    );
  }
}

export async function POST(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    logger.info("Processing notification preferences update", "mobile", {
      requestId,
    });

    // Authentication
    const { userId } = auth();
    if (!userId) {
      logger.warn("Unauthorized notification preferences update", "mobile", {
        requestId,
      });
      return StandardErrorResponse.unauthorized("Authentication required");
    }

    // Parse and validate request body
    let body;
    try {
      body = await _request.json();
    } catch (error) {
      logger.warn(
        "Invalid JSON in notification preferences request",
        "mobile",
        {
          requestId,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      );
      return StandardErrorResponse.badRequest("Invalid JSON in request body");
    }

    const validationResult = preferencesSchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn("Notification preferences validation failed", "mobile", {
        requestId,
        errors: validationResult.error.errors,
      });
      return handleZodError(validationResult.error);
    }

    const preferencesData = validationResult.data;

    // Get user information
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!user) {
      logger.error(
        "User not found for notification preferences update",
        "mobile",
        { requestId, userId },
      );
      return StandardErrorResponse.notFound("User not found");
    }

    // Update or create preferences
    const preferences = await prisma.notificationPreferences.upsert({
      where: { userId: user.id },
      update: preferencesData,
      create: {
        userId: user.id,
        ...preferencesData,
      },
    });

    logger.info("Notification preferences updated successfully", "mobile", {
      requestId,
      userId: user.id,
      updatedFields: Object.keys(preferencesData),
    });

    return StandardSuccessResponse.ok({
      preferences: {
        pushEnabled: preferences.pushEnabled,
        emailEnabled: preferences.emailEnabled,
        smsEnabled: preferences.smsEnabled,
        taskAssignments: preferences.taskAssignments,
        workflowUpdates: preferences.workflowUpdates,
        systemAlerts: preferences.systemAlerts,
        reminders: preferences.reminders,
        marketing: preferences.marketing,
        quietHoursEnabled: preferences.quietHoursEnabled,
        quietHoursStart: preferences.quietHoursStart,
        quietHoursEnd: preferences.quietHoursEnd,
        quietHoursTimezone: preferences.quietHoursTimezone,
        deliveryMethod: preferences.deliveryMethod,
        frequency: preferences.frequency,
        batchNotifications: preferences.batchNotifications,
        mobileEnabled: preferences.mobileEnabled,
        desktopEnabled: preferences.desktopEnabled,
      },
    });
  } catch (error) {
    logger.error("Failed to update notification preferences", "mobile", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return StandardErrorResponse.internal(
      "Failed to update notification preferences",
    );
  }
}
