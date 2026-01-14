import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { container } from "@/shared/infrastructure/di/container";
import { ReportTypes } from "@/shared/infrastructure/di/reporting.types";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";

// Force dynamic rendering for this route
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const { userId } = await auth();

    if (!userId) {
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        requestId,
      );
    }

    // Get controller from DI container
    const controller = container.get<any>(ReportTypes.ReportsApiController);

    const result = await controller.getReportStats({ userId });

    if (!result.success) {
      return StandardErrorResponse.internal(
        result.error || "Failed to fetch report statistics",
        requestId,
      );
    }

    return StandardSuccessResponse.ok(result.data, requestId);
  } catch (error) {
    return StandardErrorResponse.internal(
      "Failed to process report request",
      requestId,
    );
  }
}
