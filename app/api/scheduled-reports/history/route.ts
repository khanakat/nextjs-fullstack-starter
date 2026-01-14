import { NextRequest } from 'next/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { ReportTypes } from '@/shared/infrastructure/di/reporting.types';
import { ScheduledReportsApiController } from '@/slices/reporting/presentation/api/scheduled-reports-api.controller';

/**
 * Scheduled Reports API Routes
 * Handles HTTP requests for scheduled reports execution history using clean architecture
 */

// GET /api/scheduled-reports/history - Get execution history for scheduled reports
export async function GET(request: NextRequest) {
  try {
    const controller = DIContainer.get<ScheduledReportsApiController>(ReportTypes.ScheduledReportsApiController);
    return await controller.getExecutionHistory(request);
  } catch (error) {
    console.error('Error in GET /api/scheduled-reports/history:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
