import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ScheduledReportsService } from "@/lib/services/scheduled-reports-service";
import { 
  ScheduledReportError, 
  ScheduledReportNotFoundError, 
  ScheduledReportValidationError 
} from "@/lib/types/scheduled-reports";
import { 
  handleScheduledReportsError, 
  validateRequestAuth,
  createSuccessResponse 
} from "@/lib/middleware/scheduled-reports-error-handler";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    // Validate authentication and required parameters
    validateRequestAuth(session?.user?.id, organizationId || undefined);

    // Validate scheduled report ID format
    if (!params.id || typeof params.id !== 'string') {
      throw new ScheduledReportValidationError('id', params.id, 'Invalid scheduled report ID');
    }

    // Activate the scheduled report
    const activatedReport = await ScheduledReportsService.activateScheduledReport(
      params.id,
      session!.user!.id,
      organizationId!,
    );

    return createSuccessResponse(
      activatedReport, 
      "Scheduled report activated successfully",
      { 
        scheduledReportId: params.id,
        nextRun: activatedReport.nextRun 
      }
    );
  } catch (error) {
    return handleScheduledReportsError(error, {
      operation: 'activate_scheduled_report',
      userId: (await getServerSession(authOptions))?.user?.id,
      organizationId: new URL(request.url).searchParams.get("organizationId") || undefined,
      scheduledReportId: params.id,
      path: request.url,
    });
  }
}