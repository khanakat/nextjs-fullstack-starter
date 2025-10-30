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

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Execute the scheduled report
    const result = await ScheduledReportsService.executeScheduledReport(params.id);

    return NextResponse.json(result, { status: 201 });
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

    console.error("Error executing scheduled report:", error);
    return NextResponse.json(
      { error: "Failed to execute scheduled report" },
      { status: 500 },
    );
  }
}
