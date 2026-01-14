import { NextRequest } from 'next/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { ReportTypes } from '@/shared/infrastructure/di/reporting.types';
import { ScheduledReportsApiController } from '@/slices/reporting/presentation/api/scheduled-reports-api.controller';

/**
 * Scheduled Reports API Routes
 * Handles HTTP requests for getting scheduled report runs using clean architecture
 */

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/scheduled-reports/[id]/runs - Get runs for a scheduled report
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const controller = DIContainer.get<ScheduledReportsApiController>(ReportTypes.ScheduledReportsApiController);
    return await controller.getScheduledReportRuns(params.id, request);
  } catch (error) {
    console.error('Error in GET /api/scheduled-reports/[id]/runs:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
