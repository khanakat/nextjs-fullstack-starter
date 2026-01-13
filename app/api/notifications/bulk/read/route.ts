import { NextRequest } from "next/server";
import { ApiError } from "@/lib/api-utils";
import { StandardErrorResponse, StandardSuccessResponse } from "@/lib/standardized-error-responses";
import { logger } from "@/lib/logger";
import { auth } from "@clerk/nextjs/server";
import { notificationStore } from "@/lib/notifications";
import { generateRequestId } from "@/lib/utils";

/**
 * PUT /api/notifications/bulk/read - Mark multiple notifications as read
 */
export async function PUT(_request: NextRequest) {
  const requestId = generateRequestId();
  try {
    const headerUserId = _request.headers.get("x-user-id");
    const { userId: clerkUserId } = (() => { try { return auth(); } catch { return { userId: null as any }; } })();
    const userId = headerUserId || clerkUserId;
    if (!userId) {
      return StandardErrorResponse.unauthorized("Authentication required", requestId);
    }

    const body = await _request.json();
    const ids: string[] = body?.notificationIds || [];
    if (!Array.isArray(ids) || ids.length === 0) {
      return StandardErrorResponse.badRequest("Notification IDs array is required", "notifications", { notificationIds: ids }, requestId);
    }

    const updated = await notificationStore.markManyAsRead(ids, userId);
    return StandardSuccessResponse.updated({ updated, requestId }, requestId);
  } catch (error) {
    logger.apiError("Bulk mark as read error", "notification", error, { requestId, endpoint: "/api/notifications/bulk/read" });
    if (error instanceof ApiError) {
      return StandardErrorResponse.fromApiError(error, requestId);
    }
    return StandardErrorResponse.internal("Failed to mark notifications as read", undefined, requestId);
  }
}