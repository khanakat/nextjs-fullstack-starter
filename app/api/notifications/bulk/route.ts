import { NextRequest } from "next/server";
import { ApiError } from "@/lib/api-utils";
import { StandardErrorResponse, StandardSuccessResponse } from "@/lib/standardized-error-responses";
import { logger } from "@/lib/logger";
import { auth } from "@clerk/nextjs/server";
import { notificationStore, NotificationService } from "@/lib/notifications";
import { generateRequestId } from "@/lib/utils";

/**
 * POST /api/notifications/bulk - Create multiple notifications
 */
export async function POST(_request: NextRequest) {
  const requestId = generateRequestId();
  try {
    const headerUserId = _request.headers.get("x-user-id");
    const { userId: clerkUserId } = (() => { try { return auth(); } catch { return { userId: null as any }; } })();
    const userId = headerUserId || clerkUserId;
    if (!userId) {
      return StandardErrorResponse.unauthorized("Authentication required", requestId);
    }

    const body = await _request.json();
    const { notifications, recipients, scheduleFor } = body || {};

    if (!Array.isArray(notifications) || notifications.length === 0) {
      return StandardErrorResponse.badRequest("Notifications array is required", "notifications", { notifications }, requestId);
    }

    const deliverAt = scheduleFor ? new Date(scheduleFor) : undefined;

    let created = 0;
    let failed = 0;
    const targets = Array.isArray(recipients) && recipients.length > 0 ? recipients : [userId];

    for (const notif of notifications) {
      try {
        const channels = Array.isArray(notif.channels)
          ? {
              inApp: notif.channels.includes("in-app"),
              email: notif.channels.includes("email"),
              push: notif.channels.includes("push"),
            }
          : (notif.channels || { inApp: true, email: false, push: false });

        await Promise.all(
          targets.map((recipientId: string) =>
            NotificationService.notify(recipientId, {
              title: notif.title,
              message: notif.message,
              type: notif.type || "info",
              priority: notif.priority || "medium",
              channels,
              deliverAt,
            }),
          ),
        );
        created += targets.length;
      } catch {
        failed += targets.length;
      }
    }

    return StandardSuccessResponse.created({ created, failed, requestId }, requestId);
  } catch (error) {
    logger.apiError("Bulk notifications error", "notification", error, { requestId, endpoint: "/api/notifications/bulk" });
    if (error instanceof ApiError) {
      return StandardErrorResponse.fromApiError(error, requestId);
    }
    return StandardErrorResponse.internal("Failed to create bulk notifications", undefined, requestId);
  }
}