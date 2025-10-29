import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { UsageTrackingService } from "@/lib/services/usage-tracking";
import { logger } from "@/lib/logger";

const getUsageSchema = z.object({
  organizationId: z.string().optional(),
  days: z.coerce.number().min(1).max(365).optional().default(30),
});

/**
 * GET /api/usage - Get usage metrics
 */
export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = getUsageSchema.parse({
      organizationId: searchParams.get("organizationId") || orgId,
      days: searchParams.get("days"),
    });

    if (!params.organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 },
      );
    }

    // Get current usage metrics
    const usage = await UsageTrackingService.getUsageMetrics(
      params.organizationId,
    );

    // Get usage history if requested
    const history = await UsageTrackingService.getUsageHistory(
      params.organizationId,
      params.days,
    );

    logger.info("Usage metrics retrieved", "api", {
      userId,
      organizationId: params.organizationId,
      alertCount: usage.alerts.length,
    });

    return NextResponse.json({
      current: usage,
      history,
      success: true,
    });
  } catch (error) {
    logger.error("Failed to get usage metrics", "api", { error });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/usage/update - Manually trigger usage update
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { organizationId } = z
      .object({
        organizationId: z.string().optional(),
      })
      .parse(body);

    const targetOrgId = organizationId || orgId;

    if (!targetOrgId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 },
      );
    }

    // Trigger usage metrics update
    const usage = await UsageTrackingService.getUsageMetrics(targetOrgId);

    logger.info("Usage metrics updated manually", "api", {
      userId,
      organizationId: targetOrgId,
      alertCount: usage.alerts.length,
    });

    return NextResponse.json({
      usage,
      success: true,
      message: "Usage metrics updated successfully",
    });
  } catch (error) {
    logger.error("Failed to update usage metrics", "api", { error });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
