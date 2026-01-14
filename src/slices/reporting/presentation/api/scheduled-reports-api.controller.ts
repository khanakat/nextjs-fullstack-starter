import { injectable, inject } from 'inversify';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { CreateScheduledReportHandler } from '../../application/handlers/create-scheduled-report-handler';
import { ActivateScheduledReportHandler } from '../../application/handlers/activate-scheduled-report-handler';
import { CancelScheduledReportHandler } from '../../application/handlers/cancel-scheduled-report-handler';
import { ExecuteScheduledReportHandler } from '../../application/handlers/execute-scheduled-report-handler';
import { GetScheduledReportRunsHandler } from '../../application/handlers/get-scheduled-report-runs-handler';
import { GetScheduledReportStatsHandler } from '../../application/handlers/get-scheduled-report-stats-handler';
import { CreateScheduledReportCommand } from '../../application/commands/create-scheduled-report-command';
import { UpdateScheduledReportCommand } from '../../application/commands/update-scheduled-report-command';
import { DeleteScheduledReportCommand } from '../../application/commands/delete-scheduled-report-command';
import { GetScheduledReportQuery } from '../../application/queries/get-scheduled-report-query';
import { GetScheduledReportsQuery } from '../../application/queries/get-scheduled-reports-query';
import { DeliveryConfigDto } from '../../application/dtos/scheduled-report-dto';
import { ScheduleFrequency, ReportFrequency } from '../../../../shared/domain/reporting/entities/scheduled-report';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * Scheduled Reports API Controller
 * Handles HTTP requests for scheduled report management using Clean Architecture
 */
@injectable()
export class ScheduledReportsApiController {
  constructor(
    @inject(TYPES.CreateScheduledReportHandler) private createScheduledReportHandler: CreateScheduledReportHandler,
    @inject(TYPES.ActivateScheduledReportHandler) private activateScheduledReportHandler: ActivateScheduledReportHandler,
    @inject(TYPES.CancelScheduledReportHandler) private cancelScheduledReportHandler: CancelScheduledReportHandler,
    @inject(TYPES.ExecuteScheduledReportHandler) private executeScheduledReportHandler: ExecuteScheduledReportHandler,
    @inject(TYPES.GetScheduledReportRunsHandler) private getScheduledReportRunsHandler: GetScheduledReportRunsHandler,
    @inject(TYPES.GetScheduledReportStatsHandler) private getScheduledReportStatsHandler: GetScheduledReportStatsHandler
  ) {}

  /**
   * GET /api/scheduled-reports
   * Get scheduled reports with filtering and pagination
   */
  async getScheduledReports(request: NextRequest): Promise<NextResponse> {
    try {
      const { userId } = await auth();
      if (!userId) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const { searchParams } = new URL(request.url);
      const organizationId = searchParams.get('organizationId') || undefined;

      // For demo mode, return demo data
      if (userId === 'demo-user') {
        const demoReports = {
          scheduledReports: [
            {
              id: 'demo-report-1',
              name: 'Weekly Sales Report',
              description: 'Automated weekly sales summary',
              status: 'active',
              schedule: '0 9 * * 1',
              nextRun: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
              lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              organizationId: 'demo-org',
              createdBy: 'demo-user',
              reportConfig: {
                type: 'sales',
                format: 'pdf',
                recipients: ['manager@company.com']
              }
            }
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1
          }
        };
        return NextResponse.json(demoReports);
      }

      // TODO: Implement with proper handlers when available
      return NextResponse.json({
        scheduledReports: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
      });
    } catch (error) {
      console.error('Error in ScheduledReportsApiController.getScheduledReports:', error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * POST /api/scheduled-reports
   * Create a new scheduled report
   */
  async createScheduledReport(request: NextRequest): Promise<NextResponse> {
    try {
      const { userId } = await auth();
      if (!userId) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const body = await request.json();
      const organizationId = body.organizationId;

      // Create delivery configuration
      const deliveryConfig = new DeliveryConfigDto(
        body.method || 'email',
        body.recipients || [],
        body.format || 'pdf',
        body.settings || {}
      );

      const command = new CreateScheduledReportCommand(
        body.name,
        body.reportId,
        body.frequency as ScheduleFrequency,
        body.timezone || 'UTC',
        deliveryConfig,
        userId,
        organizationId
      );

      const result = await this.createScheduledReportHandler.handle(command);

      if (result.isFailure) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { success: true, data: result.value, message: 'Scheduled report created successfully' },
        { status: 201 }
      );
    } catch (error) {
      console.error('Error in ScheduledReportsApiController.createScheduledReport:', error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * GET /api/scheduled-reports/[id]
   * Get a specific scheduled report by ID
   */
  async getScheduledReport(scheduledReportId: string): Promise<NextResponse> {
    try {
      const { userId } = await auth();
      if (!userId) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // TODO: Implement with proper handler
      return NextResponse.json(
        { success: false, error: 'Not implemented' },
        { status: 501 }
      );
    } catch (error) {
      console.error('Error in ScheduledReportsApiController.getScheduledReport:', error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * PUT /api/scheduled-reports/[id]
   * Update an existing scheduled report
   */
  async updateScheduledReport(scheduledReportId: string, request: NextRequest): Promise<NextResponse> {
    try {
      const { userId } = await auth();
      if (!userId) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // TODO: Implement with proper handler
      return NextResponse.json(
        { success: false, error: 'Not implemented' },
        { status: 501 }
      );
    } catch (error) {
      console.error('Error in ScheduledReportsApiController.updateScheduledReport:', error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * DELETE /api/scheduled-reports/[id]
   * Delete a scheduled report
   */
  async deleteScheduledReport(scheduledReportId: string): Promise<NextResponse> {
    try {
      const { userId } = await auth();
      if (!userId) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // TODO: Implement with proper handler
      return NextResponse.json(
        { success: false, error: 'Not implemented' },
        { status: 501 }
      );
    } catch (error) {
      console.error('Error in ScheduledReportsApiController.deleteScheduledReport:', error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * POST /api/scheduled-reports/[id]/activate
   * Activate a scheduled report
   */
  async activateScheduledReport(scheduledReportId: string): Promise<NextResponse> {
    try {
      const { userId } = await auth();
      if (!userId) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const result = await this.activateScheduledReportHandler.handle(scheduledReportId);

      if (result.isFailure) {
        return NextResponse.json(
          { success: false, error: result.error?.message || 'Failed to activate scheduled report' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        data: result.value,
        message: 'Scheduled report activated successfully'
      });
    } catch (error) {
      console.error('Error in ScheduledReportsApiController.activateScheduledReport:', error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * POST /api/scheduled-reports/[id]/cancel
   * Cancel a scheduled report
   */
  async cancelScheduledReport(scheduledReportId: string): Promise<NextResponse> {
    try {
      const { userId } = await auth();
      if (!userId) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const result = await this.cancelScheduledReportHandler.handle(scheduledReportId);

      if (result.isFailure) {
        return NextResponse.json(
          { success: false, error: result.error?.message || 'Failed to cancel scheduled report' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        data: result.value,
        message: 'Scheduled report cancelled successfully'
      });
    } catch (error) {
      console.error('Error in ScheduledReportsApiController.cancelScheduledReport:', error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * POST /api/scheduled-reports/[id]/execute
   * Execute a scheduled report immediately
   */
  async executeScheduledReport(scheduledReportId: string, request: NextRequest): Promise<NextResponse> {
    try {
      const { userId } = await auth();
      if (!userId) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const result = await this.executeScheduledReportHandler.handle({ scheduledReportId, userId });

      if (result.isFailure) {
        return NextResponse.json(
          { success: false, error: result.error?.message || 'Failed to execute scheduled report' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: result.value,
          message: 'Scheduled report execution started'
        },
        { status: 201 }
      );
    } catch (error) {
      console.error('Error in ScheduledReportsApiController.executeScheduledReport:', error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * GET /api/scheduled-reports/[id]/runs
   * Get runs for a scheduled report
   */
  async getScheduledReportRuns(scheduledReportId: string, request: NextRequest): Promise<NextResponse> {
    try {
      const { userId } = await auth();
      if (!userId) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const { searchParams } = new URL(request.url);
      const organizationId = searchParams.get('organizationId');
      if (!organizationId) {
        return NextResponse.json(
          { success: false, error: 'Organization ID is required' },
          { status: 400 }
        );
      }

      const limit = Number(searchParams.get('limit') ?? '20');
      const offset = Number(searchParams.get('offset') ?? '0');
      const statusFilter = searchParams.get('status') || undefined;
      const sortBy = searchParams.get('sortBy') || 'startedAt';
      const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';

      const result = await this.getScheduledReportRunsHandler.handle({
        scheduledReportId,
        userId,
        organizationId,
        options: { limit, offset, status: statusFilter, sortBy, sortOrder }
      });

      if (result.isFailure) {
        return NextResponse.json(
          { success: false, error: result.error?.message || 'Failed to get scheduled report runs' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        data: result.value
      });
    } catch (error) {
      console.error('Error in ScheduledReportsApiController.getScheduledReportRuns:', error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * GET /api/scheduled-reports/history
   * Get execution history for scheduled reports
   */
  async getExecutionHistory(request: NextRequest): Promise<NextResponse> {
    try {
      const { userId } = await auth();
      if (!userId) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const { searchParams } = new URL(request.url);
      const organizationId = searchParams.get('organizationId');

      if (!organizationId) {
        return NextResponse.json(
          { success: false, error: 'Organization ID is required' },
          { status: 400 }
        );
      }

      // For demo mode
      if (userId === 'demo-user') {
        const demoHistory = {
          executions: [
            {
              id: 'demo-exec-1',
              scheduledReportId: 'demo-report-1',
              reportName: 'Weekly Sales Report',
              status: 'completed',
              startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 45000).toISOString(),
              duration: 45000,
              fileSize: 2048576,
              downloadUrl: '/api/reports/demo-exec-1/download',
              error: null
            }
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1
          }
        };
        return NextResponse.json(demoHistory);
      }

      // TODO: Implement with proper handler
      return NextResponse.json({
        executions: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
      });
    } catch (error) {
      console.error('Error in ScheduledReportsApiController.getExecutionHistory:', error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * GET /api/scheduled-reports/stats
   * Get scheduled report statistics
   */
  async getScheduledReportStats(request: NextRequest): Promise<NextResponse> {
    try {
      const { userId } = await auth();
      if (!userId) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const { searchParams } = new URL(request.url);
      const organizationId = searchParams.get('organizationId');

      if (!organizationId) {
        return NextResponse.json(
          { success: false, error: 'Organization ID is required' },
          { status: 400 }
        );
      }

      const startDate = searchParams.get('startDate')
        ? new Date(searchParams.get('startDate')!)
        : undefined;
      const endDate = searchParams.get('endDate')
        ? new Date(searchParams.get('endDate')!)
        : undefined;

      const result = await this.getScheduledReportStatsHandler.handle({
        organizationId,
        startDate,
        endDate
      });

      if (result.isFailure) {
        return NextResponse.json(
          { success: false, error: result.error?.message || 'Failed to get statistics' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        data: result.value
      });
    } catch (error) {
      console.error('Error in ScheduledReportsApiController.getScheduledReportStats:', error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
}
