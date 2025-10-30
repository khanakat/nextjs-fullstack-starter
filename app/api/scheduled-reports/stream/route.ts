import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generalRateLimiter, createRateLimitResponse } from "@/lib/utils/rate-limiter";

// Store active connections with metadata
const connections = new Map<string, {
  controller: ReadableStreamDefaultController;
  userId: string;
  organizationId: string;
  connectedAt: number;
}>();

// Handle CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, Cache-Control",
      "Access-Control-Max-Age": "86400",
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    // Support demo mode - if no session, use demo data
    const userId = session?.user?.id || "demo-user";
    const orgId = organizationId || "demo-org";

    // Rate limiting for SSE connections
    const rateLimitKey = `sse-${userId}-${orgId}`;
    const isDemo = userId === "demo-user";
    if (!generalRateLimiter.isAllowed(rateLimitKey, isDemo)) {
      const resetTime = generalRateLimiter.getResetTime(rateLimitKey);
      return new Response(
        JSON.stringify({ 
          error: "Too Many Requests",
          message: "SSE connection rate limit exceeded. Please try again later.",
          resetTime: new Date(resetTime).toISOString()
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": Math.ceil((resetTime - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    if (!organizationId) {
      return new Response(
        JSON.stringify({ error: "Organization ID is required" }), 
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Clean up old connections for this user/org (prevent connection leaks)
    const existingConnections = Array.from(connections.entries()).filter(
      ([id, conn]) => conn.userId === userId && conn.organizationId === orgId
    );
    
    // Close old connections if there are too many (max 3 per user/org)
    if (existingConnections.length >= 3) {
      existingConnections.slice(0, -2).forEach(([id, conn]) => {
        try {
          conn.controller.close();
        } catch (error) {
          // Connection already closed
        }
        connections.delete(id);
      });
    }

    // Create SSE stream
    const stream = new ReadableStream({
      start(controller) {
        const connectionId = `${userId}-${orgId}-${Date.now()}`;
        connections.set(connectionId, {
          controller,
          userId,
          organizationId: orgId,
          connectedAt: Date.now()
        });

        // Send initial connection message
        try {
          controller.enqueue(`data: ${JSON.stringify({
            type: "connected",
            timestamp: new Date().toISOString(),
            connectionId
          })}\n\n`);
        } catch (error) {
          console.error("Failed to send initial SSE message:", error);
          connections.delete(connectionId);
          return;
        }

        // Send periodic heartbeat to keep connection alive
        const heartbeat = setInterval(() => {
          const connection = connections.get(connectionId);
          if (!connection) {
            clearInterval(heartbeat);
            return;
          }
          
          try {
            connection.controller.enqueue(`data: ${JSON.stringify({
              type: "heartbeat",
              timestamp: new Date().toISOString()
            })}\n\n`);
          } catch (error) {
            console.error("SSE heartbeat failed:", error);
            clearInterval(heartbeat);
            connections.delete(connectionId);
          }
        }, 30000); // 30 seconds

        // Clean up on close
        const cleanup = () => {
          clearInterval(heartbeat);
          connections.delete(connectionId);
          try {
            controller.close();
          } catch (error) {
            // Connection already closed
          }
        };

        request.signal.addEventListener("abort", cleanup);
        
        // Also clean up on error
        controller.error = (error: any) => {
          console.error("SSE controller error:", error);
          cleanup();
        };

        // Send demo events for testing
        if (userId === "demo-user") {
          setTimeout(() => {
            try {
              controller.enqueue(`data: ${JSON.stringify({
                type: "execution_started",
                data: {
                  id: "demo-run-1",
                  scheduledReportId: "demo-report-1",
                  status: "running",
                  startedAt: new Date().toISOString()
                },
                timestamp: new Date().toISOString()
              })}\n\n`);
            } catch (error) {
              // Connection closed
            }
          }, 5000);

          setTimeout(() => {
            try {
              controller.enqueue(`data: ${JSON.stringify({
                type: "execution_completed",
                data: {
                  id: "demo-run-1",
                  scheduledReportId: "demo-report-1",
                  status: "completed",
                  startedAt: new Date(Date.now() - 10000).toISOString(),
                  completedAt: new Date().toISOString(),
                  duration: 10000
                },
                timestamp: new Date().toISOString()
              })}\n\n`);
            } catch (error) {
              // Connection closed
            }
          }, 15000);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, Cache-Control",
        "Access-Control-Expose-Headers": "Content-Type",
        "X-Accel-Buffering": "no", // Disable nginx buffering
      },
    });
  } catch (error) {
    console.error("SSE Stream Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

// Helper function to broadcast events to all connected clients
export function broadcastEvent(organizationId: string, event: any) {
  const eventData = `data: ${JSON.stringify({
    ...event,
    timestamp: new Date().toISOString()
  })}\n\n`;

  const connectionsToRemove: string[] = [];

  connections.forEach((connection, connectionId) => {
    if (connection.organizationId === organizationId) {
      try {
        connection.controller.enqueue(eventData);
      } catch (error) {
        console.error("Failed to broadcast SSE event:", error);
        // Connection closed, mark for removal
        connectionsToRemove.push(connectionId);
      }
    }
  });

  // Clean up failed connections
  connectionsToRemove.forEach(id => connections.delete(id));
}

// Periodic cleanup of stale connections (older than 1 hour)
setInterval(() => {
  const now = Date.now();
  const staleConnections: string[] = [];
  
  connections.forEach((connection, connectionId) => {
    if (now - connection.connectedAt > 60 * 60 * 1000) { // 1 hour
      staleConnections.push(connectionId);
    }
  });
  
  staleConnections.forEach(id => {
    const connection = connections.get(id);
    if (connection) {
      try {
        connection.controller.close();
      } catch (error) {
        // Connection already closed
      }
      connections.delete(id);
    }
  });
  
  if (staleConnections.length > 0) {
    console.log(`Cleaned up ${staleConnections.length} stale SSE connections`);
  }
}, 10 * 60 * 1000); // Run every 10 minutes