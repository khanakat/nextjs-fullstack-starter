import { NextRequest } from "next/server";
import { ApiError } from "@/lib/api-utils";
import { StandardErrorResponse, StandardSuccessResponse } from "@/lib/standardized-error-responses";
import { logger } from "@/lib/logger";
import { auth } from "@clerk/nextjs/server";
import { NotificationService } from "@/lib/notifications";
import { generateRequestId } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    const headerUserId = request.headers.get("x-user-id");
    const { userId: clerkUserId } = (() => { try { return auth(); } catch { return { userId: null as any }; } })();
    const userId = headerUserId || clerkUserId;
    if (!userId) {
      return StandardErrorResponse.unauthorized("Authentication required", requestId);
    }

    const body = await request.json();
    const scheduledFor = new Date(body.scheduleFor);
    const notification = await NotificationService.notify(body.recipientId || userId, {
      title: body.title,
      message: body.message,
      type: body.type || "info",
      priority: body.priority || "medium",
      channels: body.channels || { inApp: true, email: false, push: false },
      deliverAt: scheduledFor,
    });

    return StandardSuccessResponse.created({
      id: notification.id,
      status: "scheduled",
      scheduledFor: scheduledFor.toISOString(),
    }, requestId);
  } catch (error) {
    logger.apiError("Schedule notification error", "notification", error, { requestId });
    if (error instanceof ApiError) {
      return StandardErrorResponse.fromApiError(error, requestId);
    }
    return StandardErrorResponse.internal("Failed to schedule notification", undefined, requestId);
  }
}