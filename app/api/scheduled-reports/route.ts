import { NextRequest } from 'next/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { ReportTypes } from '@/shared/infrastructure/di/reporting.types';
import { ScheduledReportsApiController } from '@/slices/reporting/presentation/api/scheduled-reports-api.controller';

/**
 * Scheduled Reports API Routes
 * Handles HTTP requests for scheduled report management using clean architecture
 */

// GET /api/scheduled-reports - Get scheduled reports with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const controller = DIContainer.get<ScheduledReportsApiController>(ReportTypes.ScheduledReportsApiController);
    return await controller.getScheduledReports(request);
  } catch (error) {
    console.error('Error in GET /api/scheduled-reports:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// POST /api/scheduled-reports - Create a new scheduled report
export async function POST(request: NextRequest) {
  try {
    const controller = DIContainer.get<ScheduledReportsApiController>(ReportTypes.ScheduledReportsApiController);
    return await controller.createScheduledReport(request);
  } catch (error) {
    console.error('Error in POST /api/scheduled-reports:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
