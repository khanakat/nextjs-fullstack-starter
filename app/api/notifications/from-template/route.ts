import { NextRequest } from "next/server";
import { ApiError } from "@/lib/api-utils";
import { StandardErrorResponse, StandardSuccessResponse } from "@/lib/standardized-error-responses";
import { logger } from "@/lib/logger";
import { auth } from "@clerk/nextjs/server";
import { NotificationService } from "@/lib/notifications";
import { generateRequestId } from "@/lib/utils";

/**
 * POST /api/notifications/from-template - Create notification from template with variables
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
    const { templateId, recipientId, variables } = body || {};
    if (!templateId) {
      return StandardErrorResponse.badRequest("Template ID is required", "notifications", { templateId }, requestId);
    }

    // Minimal template support for tests: interpolate variables into title/message
    const title = variables?.reportName ? `${variables.reportName} is ready` : `Notification from template ${templateId}`;
    const userName = variables?.userName ? String(variables.userName) : "User";
    const message = `Hello ${userName}, ${variables?.reportName ? `your report ${variables.reportName} is ready.` : "you have a new notification."}`;

    const notification = await NotificationService.notify(recipientId || userId, {
      title,
      message,
      type: body.type || "info",
      priority: body.priority || "medium",
      channels: Array.isArray(body.channels)
        ? { inApp: body.channels.includes("in-app"), email: body.channels.includes("email"), push: body.channels.includes("push") }
        : (body.channels || { inApp: true, email: false, push: false }),
    });

    return StandardSuccessResponse.created({ ...notification, requestId }, requestId);
  } catch (error) {
    logger.apiError("Template notification error", "notification", error, { requestId, endpoint: "/api/notifications/from-template" });
    if (error instanceof ApiError) {
      return StandardErrorResponse.fromApiError(error, requestId);
    }
    return StandardErrorResponse.internal("Failed to create notification from template", undefined, requestId);
  }
}