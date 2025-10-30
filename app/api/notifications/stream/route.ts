import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { notificationStore } from "@/lib/notifications";
import { logger } from "@/lib/logger";

// Force dynamic rendering for this route
export const dynamic = "force-dynamic";

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
 * GET /api/notifications/stream - Server-Sent Events endpoint
 * Provides real-time notification updates to connected clients
 */
export async function GET(_request: NextRequest) {
  try {
    const userId = await safeGetUserId();

    // Demo mode support - provide a demo SSE stream
    if (!userId) {
      logger.info("Creating demo SSE stream", "notifications", {
        userId: "demo-user",
      });

      // Create a readable stream for demo SSE
      const encoder = new TextEncoder();

      const stream = new ReadableStream({
        start(controller) {
          // Send initial connection confirmation
          const data = JSON.stringify({
            type: "connection",
            message: "Connected to demo notification stream",
            timestamp: new Date().toISOString(),
          });

          controller.enqueue(encoder.encode(`data: ${data}\n\n`));

          // Send periodic heartbeat to keep connection alive
          const heartbeat = setInterval(() => {
            try {
              const heartbeatData = JSON.stringify({
                type: "heartbeat",
                timestamp: new Date().toISOString(),
              });

              controller.enqueue(encoder.encode(`data: ${heartbeatData}\n\n`));
            } catch (error) {
              logger.error("Error sending demo heartbeat", "notifications", error);
              clearInterval(heartbeat);
            }
          }, 30000); // 30 seconds

          // Send a demo notification after 5 seconds
          const demoNotificationTimeout = setTimeout(() => {
            try {
              const demoNotificationData = JSON.stringify({
                type: "notification:created",
                data: {
                  id: `notif_demo_${Date.now()}`,
                  userId: "demo-user",
                  title: "Demo Notification",
                  message: "This is a demo real-time notification!",
                  type: "info",
                  priority: "medium",
                  read: false,
                  createdAt: new Date().toISOString(),
                  channels: {
                    inApp: true,
                    email: false,
                    push: false,
                  },
                },
                timestamp: new Date().toISOString(),
              });

              controller.enqueue(encoder.encode(`data: ${demoNotificationData}\n\n`));
            } catch (error) {
              logger.error("Error sending demo notification", "notifications", error);
            }
          }, 5000);

          // Cleanup on stream close
          _request.signal.addEventListener("abort", () => {
            clearInterval(heartbeat);
            clearTimeout(demoNotificationTimeout);
            try {
              controller.close();
            } catch (error) {
              // Stream might already be closed
            }
          });
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    logger.info("Creating SSE stream for user", "notifications", {
      userId,
    });

    const encoder = new TextEncoder();

    // Create a readable stream for SSE
    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection confirmation
        const data = JSON.stringify({
          type: "connection",
          message: "Connected to notification stream",
          userId,
          timestamp: new Date().toISOString(),
        });

        controller.enqueue(encoder.encode(`data: ${data}\n\n`));

        // Subscribe to notification events for this user
        const unsubscribe = notificationStore.subscribe(userId, (event) => {
          try {
            const eventData = JSON.stringify({
              type: event.type,
              data: event.data,
              timestamp: new Date().toISOString(),
            });

            controller.enqueue(encoder.encode(`data: ${eventData}\n\n`));
          } catch (error) {
            logger.error("Error sending notification event", "notifications", error);
          }
        });

        // Send periodic heartbeat to keep connection alive
        const heartbeat = setInterval(() => {
          try {
            const heartbeatData = JSON.stringify({
              type: "heartbeat",
              timestamp: new Date().toISOString(),
            });

            controller.enqueue(encoder.encode(`data: ${heartbeatData}\n\n`));
          } catch (error) {
            logger.error("Error sending heartbeat", "notifications", error);
            clearInterval(heartbeat);
          }
        }, 30000); // 30 seconds

        // Cleanup on stream close
        _request.signal.addEventListener("abort", () => {
          unsubscribe();
          clearInterval(heartbeat);
          try {
            controller.close();
          } catch (error) {
            // Stream might already be closed
          }
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    logger.error("Error creating SSE stream", "notifications", error);

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
      status: 500,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }
}
