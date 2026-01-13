import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ScheduledReportsService } from "@/lib/services/scheduled-reports-service";
import { ScheduledReportNotFoundError, ScheduledReportError } from "@/lib/types/scheduled-reports";

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/scheduled-reports/[id]/runs
 * Returns runs for a scheduled report (tests mock ScheduledReportsService).
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId") || request.headers.get("x-organization-id") || undefined;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: "Organization ID is required" },
        { status: 400 },
      );
    }

    const limit = Number(searchParams.get("limit") ?? "20");
    const offset = Number(searchParams.get("offset") ?? "0");
    const statusFilter = searchParams.get("status") as
      | "pending"
      | "running"
      | "completed"
      | "failed"
      | undefined;
    const sortBy =
      (searchParams.get("sortBy") as "startedAt" | "completedAt" | "duration") ||
      "startedAt";
    const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc";

    if (!Number.isFinite(limit) || limit <= 0 || limit > 100) {
      return NextResponse.json(
        { success: false, error: "Invalid limit parameter" },
        { status: 400 },
      );
    }

    if (!Number.isFinite(offset) || offset < 0) {
      return NextResponse.json(
        { success: false, error: "Invalid offset parameter" },
        { status: 400 },
      );
    }

    const runsResult = await ScheduledReportsService.getScheduledReportRuns(
      params.id,
      userId,
      organizationId,
      { limit, offset, status: statusFilter, sortBy, sortOrder } as any,
    );

    const total = runsResult?.total ?? runsResult?.runs?.length ?? 0;
    const pagination = {
      page: Math.floor(offset / limit) + 1,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };

    return NextResponse.json({
      success: true,
      data: {
        runs: runsResult?.runs ?? [],
        pagination,
      },
      message: "Scheduled report runs retrieved successfully",
    });
  } catch (error) {
    if (error instanceof ScheduledReportNotFoundError) {
      return NextResponse.json(
        { success: false, error: error.message || "Scheduled report not found" },
        { status: 404 },
      );
    }

    if (error instanceof ScheduledReportError) {
      return NextResponse.json(
        { success: false, error: error.message, code: (error as any).code },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
