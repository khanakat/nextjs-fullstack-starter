import { NextRequest } from 'next/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { ReportTypes } from '@/shared/infrastructure/di/reporting.types';
import { ScheduledReportsApiController } from '@/slices/reporting/presentation/api/scheduled-reports-api.controller';

/**
 * Scheduled Reports API Routes
 * Handles HTTP requests for activating scheduled reports using clean architecture
 */

interface RouteParams {
  params: {
    id: string;
  };
}

// POST /api/scheduled-reports/[id]/activate - Activate a scheduled report
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const controller = DIContainer.get<ScheduledReportsApiController>(ReportTypes.ScheduledReportsApiController);
    return await controller.activateScheduledReport(params.id);
  } catch (error) {
    console.error('Error in POST /api/scheduled-reports/[id]/activate:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
