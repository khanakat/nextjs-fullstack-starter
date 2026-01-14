import { NextRequest } from 'next/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { ReportTypes } from '@/shared/infrastructure/di/reporting.types';
import { ScheduledReportsApiController } from '@/slices/reporting/presentation/api/scheduled-reports-api.controller';

/**
 * Scheduled Reports API Routes
 * Handles HTTP requests for individual scheduled report management using clean architecture
 */

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/scheduled-reports/[id] - Get a specific scheduled report by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const controller = DIContainer.get<ScheduledReportsApiController>(ReportTypes.ScheduledReportsApiController);
    return await controller.getScheduledReport(params.id);
  } catch (error) {
    console.error('Error in GET /api/scheduled-reports/[id]:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// PUT /api/scheduled-reports/[id] - Update a scheduled report
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const controller = DIContainer.get<ScheduledReportsApiController>(ReportTypes.ScheduledReportsApiController);
    return await controller.updateScheduledReport(params.id, request);
  } catch (error) {
    console.error('Error in PUT /api/scheduled-reports/[id]:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// DELETE /api/scheduled-reports/[id] - Delete a scheduled report
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const controller = DIContainer.get<ScheduledReportsApiController>(ReportTypes.ScheduledReportsApiController);
    return await controller.deleteScheduledReport(params.id);
  } catch (error) {
    console.error('Error in DELETE /api/scheduled-reports/[id]:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
