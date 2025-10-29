import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/ping
 * Simple ping endpoint for network testing
 */
export async function GET(_request: NextRequest) {
  return NextResponse.json({
    message: "pong",
    timestamp: Date.now(),
    success: true,
  });
}

/**
 * HEAD /api/ping
 * HEAD request for latency testing
 */
export async function HEAD(_request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
