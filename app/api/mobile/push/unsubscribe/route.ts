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

const unsubscribeSchema = z
  .object({
    endpoint: z.string().url().optional(),
    subscriptionId: z.string().optional(),
    deviceId: z.string().optional(),
  })
  .refine((data) => data.endpoint || data.subscriptionId || data.deviceId, {
    message:
      "At least one of endpoint, subscriptionId, or deviceId must be provided",
  });

export async function POST(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    logger.info("Processing push unsubscribe request", "mobile", { requestId });

    // Authentication
    const { userId } = auth();
    if (!userId) {
      logger.warn("Unauthorized push unsubscribe attempt", "mobile", {
        requestId,
      });
      return StandardErrorResponse.unauthorized("Authentication required");
    }

    // Parse and validate request body
    let body;
    try {
      body = await _request.json();
    } catch (error) {
      logger.warn("Invalid JSON in push unsubscribe request", "mobile", {
        requestId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return StandardErrorResponse.badRequest("Invalid JSON in request body");
    }

    const validationResult = unsubscribeSchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn("Push unsubscribe validation failed", "mobile", {
        requestId,
        errors: validationResult.error.errors,
      });
      return handleZodError(validationResult.error);
    }

    const { endpoint, subscriptionId, deviceId } = validationResult.data;

    // Get user information
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!user) {
      logger.error("User not found for push unsubscribe", "mobile", {
        requestId,
        userId,
      });
      return StandardErrorResponse.notFound("User not found");
    }

    // Build where clause based on provided data
    const whereClause: any = {
      userId: user.id,
      isActive: true,
    };

    if (subscriptionId) {
      whereClause.id = subscriptionId;
    } else if (endpoint) {
      whereClause.endpoint = endpoint;
    } else if (deviceId) {
      whereClause.deviceId = deviceId;
    }

    // Find active subscriptions matching the criteria
    const activeSubscriptions = await prisma.pushSubscription.findMany({
      where: whereClause,
    });

    if (activeSubscriptions.length === 0) {
      logger.warn(
        "No active push subscriptions found for unsubscribe",
        "mobile",
        {
          requestId,
          userId: user.id,
          criteria: { endpoint, subscriptionId, deviceId },
        },
      );
      return StandardErrorResponse.notFound("No active subscriptions found");
    }

    // Update subscriptions to inactive
    const subscriptionIds = activeSubscriptions.map((sub) => sub.id);
    const updateResult = await prisma.pushSubscription.updateMany({
      where: {
        id: { in: subscriptionIds },
      },
      data: {
        isActive: false,
        unsubscribedAt: new Date(),
      },
    });

    logger.info("Push subscriptions unsubscribed successfully", "mobile", {
      requestId,
      userId: user.id,
      unsubscribedCount: updateResult.count,
      subscriptionIds,
    });

    return StandardSuccessResponse.ok({
      unsubscribed: updateResult.count,
      subscriptions: activeSubscriptions.map((sub) => ({
        id: sub.id,
        endpoint: sub.endpoint,
        deviceId: sub.deviceId,
      })),
    });
  } catch (error) {
    logger.error("Push unsubscribe failed", "mobile", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return StandardErrorResponse.internal("Failed to process push unsubscribe");
  }
}
