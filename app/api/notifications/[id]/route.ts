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
 * GET /api/notifications/[id] - Get single notification
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const requestId = generateRequestId();

  try {
    // Support header auth used in tests
    const headerUserId = _request.headers.get("x-user-id");
    const { userId: clerkUserId } = (() => {
      try { return auth(); } catch { return { userId: null as any }; }
    })();
    const userId = headerUserId || clerkUserId;

    if (!userId) {
      return StandardErrorResponse.unauthorized(
        "Authentication required",
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

    const notification = await notificationStore.getNotificationById(id);
    if (!notification || notification.userId !== userId) {
      return StandardErrorResponse.notFound(
        "Notification not found or access denied",
        requestId,
      );
    }

    return StandardSuccessResponse.ok({
      ...notification,
      recipientId: notification.userId,
      readAt: notification.readAt ?? null,
    }, requestId);
  } catch (error) {
    logger.apiError(
      "Error fetching notification",
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
    return StandardErrorResponse.internal("Failed to fetch notification", undefined, requestId);
  }
}

/**
 * PATCH /api/notifications/[id] - Mark notification as read
 */
export async function PATCH(_request: NextRequest, { params }: RouteParams) {
  const requestId = generateRequestId();

  try {
    // Support header auth used in tests
    const headerUserId = _request.headers.get("x-user-id");
    const { userId: clerkUserId } = (() => {
      try { return auth(); } catch { return { userId: null as any }; }
    })();
    const userId = headerUserId || clerkUserId;

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

    const existing = await notificationStore.getNotificationById(id);
    if (!existing) {
      return StandardErrorResponse.notFound("Notification not found", requestId);
    }
    if (existing.userId !== userId) {
      return StandardErrorResponse.forbidden("Access denied", requestId);
    }

    const success = await notificationStore.markAsRead(id, userId);
    if (!success) {
      return StandardErrorResponse.internal("Failed to mark notification as read", undefined, requestId);
    }

    const updated = await notificationStore.getNotificationById(id);
    return StandardSuccessResponse.updated({
      message: "Notification marked as read",
      notificationId: id,
      readAt: updated?.readAt ?? null,
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
    const headerUserId = _request.headers.get("x-user-id");
    const { userId: clerkUserId } = (() => {
      try { return auth(); } catch { return { userId: null as any }; }
    })();
    const userId = headerUserId || clerkUserId;

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
