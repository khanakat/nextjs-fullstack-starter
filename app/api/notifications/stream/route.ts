import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { notificationStore } from "@/lib/notifications";

// Force dynamic rendering for this route
export const dynamic = "force-dynamic";

/**
 * GET /api/notifications/stream - Server-Sent Events endpoint
 * Provides real-time notification updates to connected clients
 */
export async function GET(_request: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new Response("Authentication required", { status: 401 });
    }

    // Create a readable stream for SSE
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection confirmation
        const data = JSON.stringify({
          type: "connection",
          message: "Connected to notification stream",
          timestamp: new Date().toISOString(),
        });

        controller.enqueue(encoder.encode(`data: ${data}\n\n`));

        // Subscribe to real-time events for this user
        const unsubscribe = notificationStore.subscribe(userId, (event) => {
          try {
            const sseData = JSON.stringify({
              type: event.type,
              data: event.data,
              timestamp: event.timestamp.toISOString(),
            });

            controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
          } catch (error) {
            console.error("Error sending SSE data:", error);
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
            console.error("Error sending heartbeat:", error);
            clearInterval(heartbeat);
            unsubscribe();
          }
        }, 30000); // 30 seconds

        // Cleanup on stream close
        _request.signal.addEventListener("abort", () => {
          clearInterval(heartbeat);
          unsubscribe();
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
    console.error("Error creating SSE stream:", error);
    return new Response("Failed to create notification stream", {
      status: 500,
    });
  }
}
