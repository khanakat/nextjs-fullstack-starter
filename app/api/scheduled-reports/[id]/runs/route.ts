import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ScheduledReportsService } from "@/lib/services/scheduled-reports-service";
import { 
  ScheduledReportError, 
  ScheduledReportNotFoundError 
} from "@/lib/types/scheduled-reports";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 },
      );
    }

    const options = {
      status: searchParams.get("status") as 'pending' | 'running' | 'completed' | 'failed' | undefined,
      limit: Math.min(parseInt(searchParams.get("limit") || "20"), 100),
      offset: Math.max(parseInt(searchParams.get("offset") || "0"), 0),
      sortBy: (searchParams.get("sortBy") as 'startedAt' | 'completedAt' | 'duration') || 'startedAt',
      sortOrder: (searchParams.get("sortOrder") as 'asc' | 'desc') || 'desc',
    };

    const result = await ScheduledReportsService.getScheduledReportRuns(
      params.id,
      session.user.id,
      organizationId,
      options,
    );

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ScheduledReportNotFoundError) {
      return NextResponse.json(
        { error: "Scheduled report not found" },
        { status: 404 }
      );
    }

    if (error instanceof ScheduledReportError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    console.error("Error fetching scheduled report runs:", error);
    return NextResponse.json(
      { error: "Failed to fetch scheduled report runs" },
      { status: 500 },
    );
  }
}
