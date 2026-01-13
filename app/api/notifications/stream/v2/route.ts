import { NextRequest } from "next/server";
import { container } from "@/shared/infrastructure/di/container";
import { TYPES } from "@/shared/infrastructure/di/types";
import { NotificationsController } from "@/slices/notifications/presentation/controllers/notifications-controller";
import { logger } from "@/lib/logger";
import { generateRequestId } from "@/lib/utils";

// Force dynamic rendering for this route
export const dynamic = "force-dynamic";

/**
 * GET /api/notifications/stream/v2 - Server-Sent Events endpoint using DI
 * Provides real-time notification updates to connected clients
 */
export async function GET(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    logger.info("Creating SSE stream with DI", "notifications", {
      requestId,
    });

    const controller = container.get<NotificationsController>(TYPES.NotificationsController);
    return await controller.streamNotifications(request);
  } catch (error) {
    logger.apiError(
      "Error creating SSE stream with DI",
      "notification",
      error,
      {
        requestId,
        endpoint: "/api/notifications/stream/v2",
      },
    );

    // Return a simple error response for SSE
    const encoder = new TextEncoder();
    const errorData = JSON.stringify({
      type: "error",
      message: "Failed to establish notification stream",
      timestamp: new Date().toISOString(),
    });

    const errorStream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
        controller.close();
      },
    });

    return new Response(errorStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  }
}