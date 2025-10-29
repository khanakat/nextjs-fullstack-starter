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
import webpush from "web-push";

// Configure VAPID keys for web push
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:your-email@example.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}

const notificationPayloadSchema = z.object({
  title: z.string(),
  body: z.string(),
  icon: z.string().optional(),
  badge: z.string().optional(),
  image: z.string().optional(),
  tag: z.string().optional(),
  data: z.any().optional(),
  actions: z
    .array(
      z.object({
        action: z.string(),
        title: z.string(),
        icon: z.string().optional(),
      }),
    )
    .optional(),
  requireInteraction: z.boolean().optional(),
  silent: z.boolean().optional(),
  timestamp: z.number().optional(),
  vibrate: z.array(z.number()).optional(),
});

const pushOptionsSchema = z.object({
  userId: z.string().optional(),
  organizationId: z.string().optional(),
  targetUsers: z.array(z.string()).optional(),
  targetRoles: z.array(z.string()).optional(),
  schedule: z.string().datetime().optional(),
  ttl: z.number().optional(),
  urgency: z.enum(["very-low", "low", "normal", "high"]).optional(),
  topic: z.string().optional(),
});

const sendNotificationSchema = z.object({
  payload: notificationPayloadSchema,
  options: pushOptionsSchema.optional(),
});

export async function POST(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();

    if (!userId) {
      logger.warn("Unauthorized push notification send attempt", requestId);
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        requestId,
      );
    }

    const body = await _request.json();
    const validatedData = sendNotificationSchema.parse(body);
    const { payload, options = {} } = validatedData;

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organizationMemberships: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user) {
      logger.error("User not found for push notification", {
        requestId,
        userId,
      });
      return StandardErrorResponse.notFound("User not found", requestId);
    }

    const organizationId =
      options.organizationId || user.organizationMemberships[0]?.organizationId;

    if (!organizationId) {
      logger.error("No organization found for push notification", {
        requestId,
        userId,
      });
      return StandardErrorResponse.badRequest(
        "Organization required",
        requestId,
      );
    }

    // Determine target users
    let targetUserIds: string[] = [];

    if (options.targetUsers) {
      targetUserIds = options.targetUsers;
    } else if (options.targetRoles) {
      // Get users with specified roles in the organization
      const roleUsers = await prisma.organizationMember.findMany({
        where: {
          organizationId,
          role: {
            in: options.targetRoles,
          },
        },
        select: {
          userId: true,
        },
      });
      targetUserIds = roleUsers.map((membership) => membership.userId);
    } else if (options.userId) {
      targetUserIds = [options.userId];
    } else {
      // Send to all organization members
      const orgMembers = await prisma.organizationMember.findMany({
        where: { organizationId },
        select: { userId: true },
      });
      targetUserIds = orgMembers.map((membership) => membership.userId);
    }

    if (targetUserIds.length === 0) {
      logger.warn("No target users found for push notification", requestId);
      return StandardErrorResponse.badRequest(
        "No target users found",
        requestId,
      );
    }

    // Get push subscriptions for target users
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId: {
          in: targetUserIds,
        },
        isActive: true,
      },
    });

    if (subscriptions.length === 0) {
      logger.warn("No active push subscriptions found", requestId);
      return StandardSuccessResponse.ok(
        {
          message: "No active subscriptions found",
          sent: 0,
          failed: 0,
        },
        requestId,
      );
    }

    // Create notification record
    const notification = await prisma.notification.create({
      data: {
        id: generateNotificationId(),
        title: payload.title,
        message: payload.body,
        type: "push",

        userId,
      },
    });

    let sentCount = 0;
    let failedCount = 0;
    const failedSubscriptions: string[] = [];

    // Send push notifications
    for (const subscription of subscriptions) {
      try {
        const pushPayload = JSON.stringify({
          ...payload,
          notificationId: notification.id,
          timestamp: Date.now(),
        });

        const pushOptions: webpush.RequestOptions = {
          TTL: options.ttl || 86400, // 24 hours default
          urgency: options.urgency || "normal",
        };

        if (options.topic) {
          pushOptions.topic = options.topic;
        }

        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          pushPayload,
          pushOptions,
        );

        sentCount++;

        // Update subscription last used
        await prisma.pushSubscription.update({
          where: { id: subscription.id },
          data: { lastUsed: new Date() },
        });
      } catch (error) {
        failedCount++;
        failedSubscriptions.push(subscription.id);

        logger.error("Failed to send push notification", {
          requestId,
          subscriptionId: subscription.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });

        // If subscription is invalid, mark as inactive
        if (
          error instanceof Error &&
          (error.message.includes("410") ||
            error.message.includes("invalid") ||
            error.message.includes("expired"))
        ) {
          await prisma.pushSubscription.update({
            where: { id: subscription.id },
            data: { isActive: false },
          });
        }
      }
    }

    // Update notification status
    await prisma.notification.update({
      where: { id: notification.id },
      data: {
        read: failedCount === 0,
      },
    });

    logger.info("Push notification batch completed", requestId);

    return StandardSuccessResponse.ok(
      {
        notificationId: notification.id,
        sent: sentCount,
        failed: failedCount,
        total: subscriptions.length,
        message: `Notification sent to ${sentCount} devices`,
      },
      requestId,
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error, requestId);
    }

    logger.error("Error sending push notification", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return StandardErrorResponse.internal(
      "Failed to send push notification",
      undefined,
      requestId,
    );
  }
}

function generateNotificationId(): string {
  return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
