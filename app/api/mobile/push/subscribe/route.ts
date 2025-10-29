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

const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
  deviceId: z.string().optional(),
  deviceType: z.string().optional(),
  browserName: z.string().optional(),
  browserVersion: z.string().optional(),
  platform: z.string().optional(),
  userAgent: z.string().optional(),
});

export async function POST(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    logger.info("Processing push subscription request", "mobile", {
      requestId,
    });

    // Authentication
    const { userId } = auth();
    if (!userId) {
      logger.warn("Unauthorized push subscription attempt", "mobile", {
        requestId,
      });
      return StandardErrorResponse.unauthorized("Authentication required");
    }

    // Parse and validate request body
    let body;
    try {
      body = await _request.json();
    } catch (error) {
      logger.warn("Invalid JSON in push subscription request", "mobile", {
        requestId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return StandardErrorResponse.badRequest("Invalid JSON in request body");
    }

    const validationResult = pushSubscriptionSchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn("Push subscription validation failed", "mobile", {
        requestId,
        errors: validationResult.error.errors,
      });
      return handleZodError(validationResult.error);
    }

    const {
      endpoint,
      keys,
      deviceId,
      deviceType,
      browserName,
      browserVersion,
      platform,
      userAgent,
    } = validationResult.data;

    // Get user information
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        organizationMemberships: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user) {
      logger.error("User not found for push subscription", "mobile", {
        requestId,
        userId,
      });
      return StandardErrorResponse.notFound("User not found");
    }

    // Check for existing subscription with same endpoint
    const existingSubscription = await prisma.pushSubscription.findUnique({
      where: { endpoint },
    });

    let subscription;

    if (existingSubscription) {
      // Update existing subscription
      subscription = await prisma.pushSubscription.update({
        where: { endpoint },
        data: {
          userId: user.id,
          organizationId: user.organizationMemberships[0]?.organizationId,
          p256dh: keys.p256dh,
          auth: keys.auth,
          deviceId,
          deviceType,
          browserName,
          browserVersion,
          platform,
          userAgent,
          isActive: true,
          subscribedAt: new Date(),
          unsubscribedAt: null,
        },
      });

      logger.info("Push subscription updated successfully", "mobile", {
        requestId,
        subscriptionId: subscription.id,
        userId: user.id,
        endpoint: subscription.endpoint,
      });
    } else {
      // Create new subscription
      subscription = await prisma.pushSubscription.create({
        data: {
          userId: user.id,
          organizationId: user.organizationMemberships[0]?.organizationId,
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          deviceId,
          deviceType,
          browserName,
          browserVersion,
          platform,
          userAgent,
          isActive: true,
        },
      });

      logger.info("Push subscription created successfully", "mobile", {
        requestId,
        subscriptionId: subscription.id,
        userId: user.id,
        endpoint: subscription.endpoint,
      });
    }

    return StandardSuccessResponse.created({
      subscription: {
        id: subscription.id,
        endpoint: subscription.endpoint,
        isActive: subscription.isActive,
        subscribedAt: subscription.subscribedAt,
      },
    });
  } catch (error) {
    logger.error("Push subscription failed", "mobile", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return StandardErrorResponse.internal(
      "Failed to process push subscription",
    );
  }
}
