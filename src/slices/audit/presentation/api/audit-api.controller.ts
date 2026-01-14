import { injectable, inject } from 'inversify';
import { NextRequest, NextResponse } from 'next/server';
import { GetAuditLogQuery, UpdateAuditLogCommand, DeleteAuditLogCommand, GetAuditStatisticsQuery } from '../../application/commands/create-audit-log-command';
import { GetAuditLogHandler } from '../../application/handlers/get-audit-log-handler';
import { UpdateAuditLogHandler } from '../../application/handlers/update-audit-log-handler';
import { DeleteAuditLogHandler } from '../../application/handlers/delete-audit-log-handler';
import { GetAuditLogsHandler } from '../../application/handlers/get-audit-logs-handler';
import { GetAuditStatisticsHandler } from '../../application/handlers/get-audit-statistics-handler';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * Audit API Controller
 * Handles HTTP requests for audit log management
 */
@injectable()
export class AuditApiController {
  constructor(
    @inject(TYPES.GetAuditLogHandler) private getAuditLogHandler: GetAuditLogHandler,
    @inject(TYPES.UpdateAuditLogHandler) private updateAuditLogHandler: UpdateAuditLogHandler,
    @inject(TYPES.DeleteAuditLogHandler) private deleteAuditLogHandler: DeleteAuditLogHandler,
    @inject(TYPES.GetAuditLogsHandler) private getAuditLogsHandler: GetAuditLogsHandler,
    @inject(TYPES.GetAuditStatisticsHandler) private getAuditStatisticsHandler: GetAuditStatisticsHandler
  ) {}

  /**
   * GET /api/audit/[id]
   * Get specific audit log by ID
   */
  async getAuditLog(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const query = new GetAuditLogQuery({ id: params.id });
      const result = await this.getAuditLogHandler.handle(query);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error?.message || 'Audit log not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(result.value, { status: 200 });
    } catch (error) {
      console.error('Error in AuditApiController.getAuditLog:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * GET /api/audit/logs
   * Get audit logs with filtering and pagination
   */
  async getAuditLogs(request: NextRequest): Promise<NextResponse> {
    try {
      const result = await this.getAuditLogsHandler.handle();

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error?.message || 'Failed to get audit logs' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { logs: result.value, total: result.value.length },
        { status: 200 }
      );
    } catch (error) {
      console.error('Error in AuditApiController.getAuditLogs:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * GET /api/audit/stats
   * Get audit log statistics and analytics
   */
  async getAuditStats(request: NextRequest): Promise<NextResponse> {
    try {
      const url = new URL(request.url);
      const organizationId = url.searchParams.get('organizationId') || undefined;
      const startDate = url.searchParams.get('startDate') ? new Date(url.searchParams.get('startDate')!) : undefined;
      const endDate = url.searchParams.get('endDate') ? new Date(url.searchParams.get('endDate')!) : undefined;

      const query = new GetAuditStatisticsQuery({
        organizationId,
        startDate,
        endDate,
      });

      const result = await this.getAuditStatisticsHandler.handle(query);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error?.message || 'Failed to get audit statistics' },
          { status: 400 }
        );
      }

      return NextResponse.json(result.value, { status: 200 });
    } catch (error) {
      console.error('Error in AuditApiController.getAuditStats:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * PUT /api/audit/[id]
   * Update specific audit log by ID
   */
  async updateAuditLog(auditLogId: string, request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();

      const command = new UpdateAuditLogCommand({
        id: auditLogId,
        status: body.status,
        metadata: body.metadata ? JSON.stringify(body.metadata) : undefined,
        retentionDate: body.retentionDate ? new Date(body.retentionDate) : undefined,
        isArchived: body.isArchived,
      });

      const result = await this.updateAuditLogHandler.handle(command);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error?.message || 'Failed to update audit log' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { data: result.value },
        { status: 200 }
      );
    } catch (error) {
      console.error('Error in AuditApiController.updateAuditLog:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * DELETE /api/audit/[id]
   * Delete specific audit log by ID
   */
  async deleteAuditLog(auditLogId: string): Promise<NextResponse> {
    try {
      const command = new DeleteAuditLogCommand({ id: auditLogId });
      const result = await this.deleteAuditLogHandler.handle(command);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error?.message || 'Failed to delete audit log' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { data: { success: true } },
        { status: 200 }
      );
    } catch (error) {
      console.error('Error in AuditApiController.deleteAuditLog:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
}
