import { NextRequest } from "next/server";
import { ApiError } from "@/lib/api-utils";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { logger } from "@/lib/logger";
import { auth } from "@clerk/nextjs/server";
import { notificationStore, NotificationService } from "@/lib/notifications";
import { generateRequestId } from "@/lib/utils";

/**
 * GET /api/notifications - Get user notifications
 * Query params:
 * - limit: number of notifications to return (default: 50)
 * - offset: pagination offset (default: 0)
 * - unread: only unread notifications (default: false)
 * - type: filter by notification type
 */
export async function GET(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();

    if (!userId) {
      return StandardErrorResponse.unauthorized(
        "Authentication required to access notifications",
        requestId,
      );
    }

    const url = new URL(_request.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const unreadOnly = url.searchParams.get("unread") === "true";
    const type = url.searchParams.get("type") as any;

    // Validate pagination parameters
    if (limit < 1 || limit > 100) {
      return StandardErrorResponse.badRequest(
        "Limit must be between 1 and 100",
        "notifications",
        { limit },
        requestId,
      );
    }

    if (offset < 0) {
      return StandardErrorResponse.badRequest(
        "Offset must be non-negative",
        "notifications",
        { offset },
        requestId,
      );
    }

    logger.info("Fetching user notifications", "notifications", {
      requestId,
      userId,
      limit,
      offset,
      unreadOnly,
      type,
    });

    const notifications = await notificationStore.getUserNotifications(userId, {
      limit,
      offset,
      unreadOnly,
      type,
    });

    const unreadCount = await notificationStore.getUnreadCount(userId);
    const preferences = await notificationStore.getUserPreferences(userId);

    return StandardSuccessResponse.create({
      notifications,
      unreadCount,
      preferences,
      pagination: {
        limit,
        offset,
        hasMore: notifications.length === limit, // Simple check
      },
      requestId,
    });
  } catch (error) {
    logger.apiError(
      "Error processing notification request",
      "notification",
      error,
      {
        requestId,
        endpoint: "/api/notifications",
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
 * POST /api/notifications - Create a new notification
 * Body: Notification data
 */
export async function POST(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();

    if (!userId) {
      return StandardErrorResponse.unauthorized(
        "Authentication required to create notifications",
        requestId,
      );
    }

    const body = await _request.json();
    const {
      title,
      message,
      type = "info",
      priority = "medium",
      data,
      actionUrl,
      actionLabel,
      channels = {
        inApp: true,
        email: false,
        push: false,
      },
    } = body;

    // Validate required fields
    if (!title || !message) {
      return StandardErrorResponse.badRequest(
        "Title and message are required",
        "notifications",
        { title: !!title, message: !!message },
        requestId,
      );
    }

    logger.info("Creating new notification", "notifications", {
      requestId,
      userId,
      type,
      priority,
      channels,
    });

    const notification = await NotificationService.notify(userId, {
      title,
      message,
      type,
      priority,
      data,
      actionUrl,
      actionLabel,
      channels,
    });

    return StandardSuccessResponse.created({
      notification,
      requestId,
    });
  } catch (error) {
    logger.apiError(
      "Error processing notification request",
      "notification",
      error,
      {
        requestId,
        endpoint: "/api/notifications",
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
