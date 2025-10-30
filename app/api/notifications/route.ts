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

// Demo data for when user is not authenticated
const DEMO_NOTIFICATIONS = [
  {
    id: "notif_demo_1",
    userId: "demo-user",
    title: "Welcome to the Dashboard",
    message: "Your account has been successfully set up. Start exploring the features!",
    type: "success" as const,
    priority: "medium" as const,
    data: {},
    actionUrl: "/dashboard",
    actionLabel: "View Dashboard",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    channels: {
      inApp: true,
      email: false,
      push: false,
    },
  },
  {
    id: "notif_demo_2",
    userId: "demo-user",
    title: "System Maintenance Scheduled",
    message: "We'll be performing maintenance on Sunday at 2 AM UTC. Expected downtime: 30 minutes.",
    type: "info" as const,
    priority: "low" as const,
    data: {},
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    readAt: new Date(Date.now() - 1000 * 60 * 60 * 1), // 1 hour ago
    channels: {
      inApp: true,
      email: true,
      push: false,
    },
  },
  {
    id: "notif_demo_3",
    userId: "demo-user",
    title: "New Feature Available",
    message: "Check out our new analytics dashboard with advanced reporting capabilities.",
    type: "info" as const,
    priority: "medium" as const,
    data: {},
    actionUrl: "/analytics",
    actionLabel: "Explore Analytics",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    channels: {
      inApp: true,
      email: false,
      push: true,
    },
  },
];

const DEMO_PREFERENCES = {
  userId: "demo-user",
  channels: {
    inApp: true,
    email: true,
    push: false,
    sms: false,
  },
  categories: {
    security: true,
    updates: true,
    marketing: false,
    system: true,
    billing: true,
  },
  frequency: "immediate" as const,
  quietHours: {
    enabled: false,
    start: "22:00",
    end: "08:00",
    timezone: "UTC",
  },
};

// Helper function to safely get user ID from auth
async function safeGetUserId(): Promise<string | null> {
  try {
    const { userId } = auth();
    return userId;
  } catch (error) {
    // Auth failed (likely Clerk not configured), return null for demo mode
    logger.info("Auth failed, using demo mode", "notifications", { error: error instanceof Error ? error.message : error });
    return null;
  }
}

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
    const userId = await safeGetUserId();

    // Demo mode support - return demo data when no user is authenticated
    if (!userId) {
      const url = new URL(_request.url);
      const limit = parseInt(url.searchParams.get("limit") || "50");
      const offset = parseInt(url.searchParams.get("offset") || "0");
      const unreadOnly = url.searchParams.get("unread") === "true";
      const type = url.searchParams.get("type") as any;

      // Filter demo notifications based on query params
      let filteredNotifications = [...DEMO_NOTIFICATIONS];
      
      if (unreadOnly) {
        filteredNotifications = filteredNotifications.filter(n => !n.read);
      }
      
      if (type) {
        filteredNotifications = filteredNotifications.filter(n => n.type === type);
      }

      // Apply pagination
      const paginatedNotifications = filteredNotifications.slice(offset, offset + limit);
      const unreadCount = DEMO_NOTIFICATIONS.filter(n => !n.read).length;

      logger.info("Returning demo notifications", "notifications", {
        requestId,
        userId: "demo-user",
        limit,
        offset,
        unreadOnly,
        type,
        count: paginatedNotifications.length,
      });

      return StandardSuccessResponse.create({
        notifications: paginatedNotifications,
        unreadCount,
        preferences: DEMO_PREFERENCES,
        pagination: {
          limit,
          offset,
          hasMore: paginatedNotifications.length === limit,
        },
        requestId,
      });
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
    const userId = await safeGetUserId();

    // Demo mode - don't create notifications, just return success
    if (!userId) {
      logger.info("Demo mode: notification creation simulated", "notifications", {
        requestId,
        userId: "demo-user",
      });

      return StandardSuccessResponse.create({
        message: "Notification created successfully (demo mode)",
        notification: {
          id: `demo_${Date.now()}`,
          userId: "demo-user",
          title: "Demo Notification",
          message: "This is a demo notification",
          type: "info",
          priority: "medium",
          read: false,
          createdAt: new Date(),
          channels: {
            inApp: true,
            email: false,
            push: false,
          },
        },
        requestId,
      });
    }

    const body = await _request.json();

    // Validate required fields
    if (!body.title || !body.message) {
      return StandardErrorResponse.badRequest(
        "Title and message are required",
        "notifications",
        { body },
        requestId,
      );
    }

    logger.info("Creating notification", "notifications", {
      requestId,
      userId,
      title: body.title,
      type: body.type,
    });

    const notification = await NotificationService.notify(userId, {
      title: body.title,
      message: body.message,
      type: body.type || "info",
      priority: body.priority || "medium",
      data: body.data || {},
      actionUrl: body.actionUrl,
      actionLabel: body.actionLabel,
      channels: body.channels || {
        inApp: true,
        email: false,
        push: false,
      },
      deliverAt: body.deliverAt ? new Date(body.deliverAt) : undefined,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    });

    return StandardSuccessResponse.create({
      notification,
      requestId,
    });
  } catch (error) {
    logger.apiError(
      "Error creating notification",
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
