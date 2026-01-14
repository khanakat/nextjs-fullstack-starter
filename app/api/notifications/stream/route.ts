import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { DIContainer } from "@/shared/infrastructure/di/container";
import { NotificationsController } from "@/slices/notifications/presentation/controllers/notifications-controller";
import { TYPES } from "@/shared/infrastructure/di/types";

// Force dynamic rendering for this route
export const dynamic = "force-dynamic";

/**
 * GET /api/notifications/stream - Server-Sent Events endpoint
 * Provides real-time notification updates to connected clients
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = auth();
    const userId = authResult.userId;

    if (!userId) {
      return new Response(
        'data: {"type":"error","message":"Unauthorized"}\n\n',
        {
          status: 401,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        }
      );
    }

    const controller = DIContainer.get<NotificationsController>(TYPES.NotificationsController);
    return controller.createStream(request);
  } catch (error) {
    console.error('Failed to create SSE stream:', error);
    return new Response(
      'data: {"type":"error","message":"Failed to establish notification stream"}\n\n',
      {
        status: 500,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      }
    );
  }
}
