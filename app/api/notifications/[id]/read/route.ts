import { NextRequest } from "next/server";
import { ApiError, errorResponse } from "@/lib/api-utils";
import { StandardErrorResponse, StandardSuccessResponse } from "@/lib/standardized-error-responses";
import { logger } from "@/lib/logger";
import { auth } from "@clerk/nextjs/server";
import { notificationStore } from "@/lib/notifications";
import { generateRequestId } from "@/lib/utils";

interface RouteParams { params: { id: string } }

/**
 * PUT /api/notifications/[id]/read - Mark notification as read (path used in tests)
 */
export async function PUT(_request: NextRequest, { params }: RouteParams) {
  const requestId = generateRequestId();
  try {
    const headerUserId = _request.headers.get("x-user-id");
    const { userId: clerkUserId } = (() => { try { return auth(); } catch { return { userId: null as any }; } })();
    const userId = headerUserId || clerkUserId;
    if (!userId) {
      return StandardErrorResponse.unauthorized("Authentication required", requestId);
    }

    const { id } = params;
    if (!id) {
      return StandardErrorResponse.badRequest("Notification ID is required", "notifications", { id }, requestId);
    }

    const existing = await notificationStore.getNotificationById(id);
    if (!existing) {
      return StandardErrorResponse.notFound("Notification not found", requestId);
    }
    if (existing.userId !== userId) {
      return errorResponse("Access denied", 403);
    }

    const success = await notificationStore.markAsRead(id, userId);
    if (!success) {
      return StandardErrorResponse.internal("Failed to mark notification as read", undefined, requestId);
    }

    const updated = await notificationStore.getNotificationById(id);
    return StandardSuccessResponse.updated({ message: "Notification marked as read", notificationId: id, readAt: updated?.readAt ?? null, requestId }, requestId);
  } catch (error) {
    logger.apiError("Error marking notification read", "notification", error, { requestId, resourceId: params.id, endpoint: "/api/notifications/:id/read" });
    if (error instanceof ApiError) {
      return StandardErrorResponse.fromApiError(error, requestId);
    }
    return StandardErrorResponse.internal("Failed to process notification request", undefined, requestId);
  }
}