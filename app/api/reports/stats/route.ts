import { NextRequest, NextResponse } from "next/server";
import { ApiError, errorResponse } from "@/lib/api-utils";
import { logger } from "@/lib/logger";
import { auth } from "@clerk/nextjs/server";
import { ReportService } from "@/lib/services/report-service";

// Force dynamic rendering for this route
export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await ReportService.getReportStats(userId);

    return NextResponse.json(stats);
  } catch (error) {
    logger.apiError("Error processing report request", "report", error, {
      endpoint: "/api/reports/stats",
    });

    if (error instanceof ApiError) {
      return errorResponse(error);
    }

    return errorResponse("Failed to process report request", 500);
  }
}
