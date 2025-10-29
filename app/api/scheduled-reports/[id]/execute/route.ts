import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ScheduledReportsService } from "@/lib/services/scheduled-reports-service";

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
    const run = await ScheduledReportsService.executeScheduledReport(params.id);

    return NextResponse.json(run, { status: 201 });
  } catch (error) {
    console.error("Error executing scheduled report:", error);

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { error: "Scheduled report not found" },
        { status: 404 },
      );
    }

    if (error instanceof Error && error.message.includes("not active")) {
      return NextResponse.json(
        { error: "Scheduled report is not active" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to execute scheduled report" },
      { status: 500 },
    );
  }
}
