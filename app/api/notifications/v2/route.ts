import { NextRequest } from "next/server";
import { container } from "@/shared/infrastructure/di/container";
import { TYPES } from "@/shared/infrastructure/di/types";
import { NotificationsController } from "@/slices/notifications/presentation/controllers/notifications-controller";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { logger } from "@/lib/logger";
import { generateRequestId } from "@/lib/utils";

/**
 * GET /api/notifications/v2 - Get user notifications using DI
 */
export async function GET(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    logger.info("Processing notifications request with DI", "notifications", {
      requestId,
    });

    const controller = container.get<NotificationsController>(TYPES.NotificationsController);
    return await controller.getNotifications(request);
  } catch (error) {
    logger.apiError(
      "Error processing notification request with DI",
      "notification",
      error,
      {
        requestId,
        endpoint: "/api/notifications/v2",
      },
    );

    return StandardErrorResponse.internal(
      "Failed to process notification request",
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
 * POST /api/notifications/v2 - Create a new notification using DI
 */
export async function POST(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    logger.info("Creating notification with DI", "notifications", {
      requestId,
    });

    const controller = container.get<NotificationsController>(TYPES.NotificationsController);
    return await controller.sendNotification(request);
  } catch (error) {
    logger.apiError(
      "Error creating notification with DI",
      "notification",
      error,
      {
        requestId,
        endpoint: "/api/notifications/v2",
      },
    );

    return StandardErrorResponse.internal(
      "Failed to create notification",
      process.env.NODE_ENV === "development"
        ? {
            originalError: error instanceof Error ? error.message : error,
          }
        : undefined,
      requestId,
    );
  }
}