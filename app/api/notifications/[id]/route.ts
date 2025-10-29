import { NextRequest } from "next/server";
import { ApiError } from "@/lib/api-utils";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { logger } from "@/lib/logger";
import { auth } from "@clerk/nextjs/server";
import { notificationStore } from "@/lib/notifications";
import { generateRequestId } from "@/lib/utils";

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * PATCH /api/notifications/[id] - Mark notification as read
 */
export async function PATCH(_request: NextRequest, { params }: RouteParams) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();

    if (!userId) {
      return StandardErrorResponse.unauthorized(
        "Authentication required to update notifications",
        requestId,
      );
    }

    const { id } = params;

    if (!id) {
      return StandardErrorResponse.badRequest(
        "Notification ID is required",
        "notifications",
        { id },
        requestId,
      );
    }

    logger.info("Marking notification as read", "notifications", {
      requestId,
      userId,
      notificationId: id,
    });

    const success = await notificationStore.markAsRead(id, userId);

    if (!success) {
      return StandardErrorResponse.notFound(
        "Notification not found or access denied",
        requestId,
      );
    }

    return StandardSuccessResponse.updated({
      message: "Notification marked as read",
      notificationId: id,
      requestId,
    });
  } catch (error) {
    logger.apiError(
      "Error processing notification request",
      "notification",
      error,
      {
        requestId,
        resourceId: params.id,
        endpoint: "/api/notifications/:id",
      },
    );

    if (error instanceof ApiError) {
      return StandardErrorResponse.fromApiError(error, requestId);
    }

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
 * DELETE /api/notifications/[id] - Delete notification
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();

    if (!userId) {
      return StandardErrorResponse.unauthorized(
        "Authentication required to delete notifications",
        requestId,
      );
    }

    const { id } = params;

    if (!id) {
      return StandardErrorResponse.badRequest(
        "Notification ID is required",
        "notifications",
        { id },
        requestId,
      );
    }

    logger.info("Deleting notification", "notifications", {
      requestId,
      userId,
      notificationId: id,
    });

    const success = await notificationStore.deleteNotification(id, userId);

    if (!success) {
      return StandardErrorResponse.notFound(
        "Notification not found or access denied",
        requestId,
      );
    }

    return StandardSuccessResponse.deleted(requestId, {
      message: "Notification deleted",
      notificationId: id,
    });
  } catch (error) {
    logger.apiError(
      "Error processing notification request",
      "notification",
      error,
      {
        requestId,
        resourceId: params.id,
        endpoint: "/api/notifications/:id",
      },
    );

    if (error instanceof ApiError) {
      return StandardErrorResponse.fromApiError(error, requestId);
    }

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
