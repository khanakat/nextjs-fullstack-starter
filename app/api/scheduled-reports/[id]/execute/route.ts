import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ScheduledReportsService } from "@/lib/services/scheduled-reports-service";
import { ScheduledReportError, ScheduledReportNotFoundError } from "@/lib/types/scheduled-reports";
import { handleScheduledReportsError, validateRequestAuth, createSuccessResponse } from "@/lib/middleware/scheduled-reports-error-handler";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId") || request.headers.get("x-organization-id") || undefined;

    validateRequestAuth(session?.user?.id, organizationId);

    const result = await ScheduledReportsService.executeScheduledReport(params.id);

    return createSuccessResponse(result, "Scheduled report execution started", { scheduledReportId: params.id }, 201);
  } catch (error) {
    return handleScheduledReportsError(error, {
      operation: 'execute_scheduled_report',
      userId: (await getServerSession(authOptions))?.user?.id,
      organizationId: (
        new URL(request.url).searchParams.get("organizationId") ||
        request.headers.get("x-organization-id") || undefined
      ),
      scheduledReportId: params.id,
      path: request.url,
    });
  }
}
