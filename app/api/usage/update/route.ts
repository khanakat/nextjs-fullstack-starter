import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { UsageTrackingService } from "@/lib/services/usage-tracking";
import { queueService } from "@/lib/services/queue";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const updateUsageSchema = z.object({
  organizationId: z.string().optional(),
  force: z.boolean().default(false),
  scheduleJob: z.boolean().default(true),
});

// ============================================================================
// POST - Manual Usage Update
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const { organizationId, force, scheduleJob } =
      updateUsageSchema.parse(body);

    // Use user's organization if not specified
    const targetOrgId = organizationId || (session.user as any).organizationId;

    if (!targetOrgId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 },
      );
    }

    // Check if user has permission to update usage for this organization
    if (
      organizationId &&
      organizationId !== (session.user as any).organizationId
    ) {
      // Only allow if user is admin/super admin
      if (
        !(session.user as any).roles?.includes("admin") &&
        !(session.user as any).roles?.includes("super_admin")
      ) {
        return NextResponse.json(
          { error: "Insufficient permissions" },
          { status: 403 },
        );
      }
    }

    let usage;
    let jobId;

    if (scheduleJob) {
      // Schedule usage update job for better performance
      jobId = await queueService.addJob(
        "usage-update",
        {
          organizationId: targetOrgId,
          force,
          triggeredBy: session.user.id,
          triggeredAt: new Date().toISOString(),
        },
        {
          priority: force ? 1 : 5, // Higher priority for forced updates
          delay: 0, // Execute immediately
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 2000,
          },
        },
      );

      // Return job information
      return NextResponse.json({
        success: true,
        message: "Usage update job scheduled successfully",
        jobId,
        organizationId: targetOrgId,
      });
    } else {
      // Execute update immediately (synchronous)
      usage = await UsageTrackingService.getUsageMetrics(targetOrgId);

      return NextResponse.json({
        success: true,
        message: "Usage updated successfully",
        usage,
        organizationId: targetOrgId,
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Error updating usage:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: error.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ============================================================================
// PUT - Bulk Usage Update (Admin only)
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin permissions
    if (
      !(session.user as any).roles?.includes("admin") &&
      !(session.user as any).roles?.includes("super_admin")
    ) {
      return NextResponse.json(
        { error: "Admin permissions required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { force = false, scheduleJob = true } = body;

    let jobId;

    if (scheduleJob) {
      // Schedule bulk usage update job
      jobId = await queueService.addJob(
        "usage-update",
        {
          organizationId: null, // null means all organizations
          force,
          triggeredBy: session.user.id,
          triggeredAt: new Date().toISOString(),
          bulkUpdate: true,
        },
        {
          priority: force ? 1 : 10, // Lower priority for bulk updates
          delay: 0,
          attempts: 5,
          backoff: {
            type: "exponential",
            delay: 5000,
          },
        },
      );

      return NextResponse.json({
        success: true,
        message: "Bulk usage update job scheduled successfully",
        jobId,
        type: "bulk_update",
      });
    } else {
      // Execute bulk update immediately (not recommended for large datasets)
      await UsageTrackingService.updateAllUsageMetrics();

      return NextResponse.json({
        success: true,
        message: "Bulk usage update completed successfully",
        type: "bulk_update",
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Error in bulk usage update:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
