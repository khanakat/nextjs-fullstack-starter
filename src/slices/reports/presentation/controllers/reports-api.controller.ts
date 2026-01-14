import { injectable } from 'inversify';
import { CreateReportHandler } from '../../../../shared/application/reporting/handlers/create-report.handler';
import { UpdateReportHandler } from '../../../../shared/application/reporting/handlers/update-report.handler';
import { DeleteReportHandler } from '../../../../shared/application/reporting/handlers/delete-report.handler';
import { ListReportsHandler } from '../../../../shared/application/reporting/handlers/list-reports.handler';
import { GetReportHandler } from '../../../../shared/application/reporting/handlers/get-report.handler';
import { CreateReportCommand } from '../../../../shared/application/reporting/commands/create-report.command';
import { UpdateReportCommand } from '../../../../shared/application/reporting/commands/update-report.command';
import { DeleteReportCommand } from '../../../../shared/application/reporting/commands/delete-report.command';
import { ListReportsQuery } from '../../../../shared/application/reporting/queries/list-reports.query';
import { GetReportQuery } from '../../../../shared/application/reporting/queries/get-report.query';
import { ReportDto, PaginatedReportsDto } from '../../../../shared/application/reporting/dto/report.dto';

/**
 * Reports API Controller
 * Handles HTTP requests for report operations following Clean Architecture principles
 */
@injectable()
export class ReportsApiController {
  constructor(
    private readonly createReportHandler: CreateReportHandler,
    private readonly updateReportHandler: UpdateReportHandler,
    private readonly deleteReportHandler: DeleteReportHandler,
    private readonly listReportsHandler: ListReportsHandler,
    private readonly getReportHandler: GetReportHandler
  ) {}

  /**
   * List reports with filtering and pagination
   * GET /api/reports
   */
  async listReports(request: {
    userId: string;
    organizationId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data?: PaginatedReportsDto; error?: string }> {
    try {
      const query = new ListReportsQuery({
        userId: request.userId,
        organizationId: request.organizationId,
        status: request.status,
        page: request.page,
        limit: request.limit,
      });

      const result = await this.listReportsHandler.handle(query);

      if (result.isFailure || !result.value) {
        return {
          success: false,
          error: result.error?.message || 'Failed to fetch reports',
        };
      }

      const reportsData: ReportDto[] = result.value.reports.map((report) => ({
        id: report.id.id,
        title: report.title,
        description: report.description,
        config: report.config.toPlainObject(),
        content: report.content,
        status: report.status.value as any,
        isPublic: report.isPublic,
        templateId: report.templateId?.id,
        createdBy: report.createdBy.id,
        organizationId: report.organizationId?.id,
        metadata: report.metadata,
        createdAt: report.createdAt.toISOString(),
        updatedAt: report.updatedAt.toISOString(),
        publishedAt: report.publishedAt?.toISOString(),
        archivedAt: report.archivedAt?.toISOString(),
      }));

      return {
        success: true,
        data: {
          reports: reportsData,
          pagination: {
            total: result.value.total,
            page: query.page,
            limit: query.limit,
            totalPages: Math.ceil(result.value.total / query.limit),
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      };
    }
  }

  /**
   * Get a single report by ID
   * GET /api/reports/[id]
   */
  async getReport(request: {
    reportId: string;
  }): Promise<{ success: boolean; data?: ReportDto; error?: string }> {
    try {
      const query = new GetReportQuery({ reportId: request.reportId });

      const result = await this.getReportHandler.handle(query);

      if (result.isFailure || !result.value) {
        return {
          success: false,
          error: result.error?.message || 'Report not found',
        };
      }

      const report = result.value;
      const reportData: ReportDto = {
        id: report.id.id,
        title: report.title,
        description: report.description,
        config: report.config.toPlainObject(),
        content: report.content,
        status: report.status.value as any,
        isPublic: report.isPublic,
        templateId: report.templateId?.id,
        createdBy: report.createdBy.id,
        organizationId: report.organizationId?.id,
        metadata: report.metadata,
        createdAt: report.createdAt.toISOString(),
        updatedAt: report.updatedAt.toISOString(),
        publishedAt: report.publishedAt?.toISOString(),
        archivedAt: report.archivedAt?.toISOString(),
      };

      return {
        success: true,
        data: reportData,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      };
    }
  }

  /**
   * Create a new report
   * POST /api/reports
   */
  async createReport(request: {
    userId: string;
    organizationId?: string;
    title: string;
    description?: string;
    config: Record<string, any>;
    isPublic?: boolean;
  }): Promise<{ success: boolean; data?: ReportDto; error?: string }> {
    try {
      const command = new CreateReportCommand({
        title: request.title,
        description: request.description,
        config: request.config,
        isPublic: request.isPublic,
        createdBy: request.userId,
        organizationId: request.organizationId,
      });

      const result = await this.createReportHandler.handle(command);

      if (result.isFailure || !result.value) {
        return {
          success: false,
          error: result.error?.message || 'Failed to create report',
        };
      }

      const report = result.value;
      const reportData: ReportDto = {
        id: report.id.id,
        title: report.title,
        description: report.description,
        config: report.config.toPlainObject(),
        content: report.content,
        status: report.status.value as any,
        isPublic: report.isPublic,
        templateId: report.templateId?.id,
        createdBy: report.createdBy.id,
        organizationId: report.organizationId?.id,
        metadata: report.metadata,
        createdAt: report.createdAt.toISOString(),
        updatedAt: report.updatedAt.toISOString(),
        publishedAt: report.publishedAt?.toISOString(),
        archivedAt: report.archivedAt?.toISOString(),
      };

      return {
        success: true,
        data: reportData,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      };
    }
  }

  /**
   * Update an existing report
   * PUT /api/reports/[id]
   */
  async updateReport(request: {
    reportId: string;
    title?: string;
    description?: string;
    config?: Record<string, any>;
    content?: any;
    isPublic?: boolean;
  }): Promise<{ success: boolean; data?: ReportDto; error?: string }> {
    try {
      const command = new UpdateReportCommand({
        reportId: request.reportId,
        title: request.title,
        description: request.description,
        config: request.config,
        content: request.content,
        isPublic: request.isPublic,
      });

      const result = await this.updateReportHandler.handle(command);

      if (result.isFailure || !result.value) {
        return {
          success: false,
          error: result.error?.message || 'Failed to update report',
        };
      }

      const report = result.value;
      const reportData: ReportDto = {
        id: report.id.id,
        title: report.title,
        description: report.description,
        config: report.config.toPlainObject(),
        content: report.content,
        status: report.status.value as any,
        isPublic: report.isPublic,
        templateId: report.templateId?.id,
        createdBy: report.createdBy.id,
        organizationId: report.organizationId?.id,
        metadata: report.metadata,
        createdAt: report.createdAt.toISOString(),
        updatedAt: report.updatedAt.toISOString(),
        publishedAt: report.publishedAt?.toISOString(),
        archivedAt: report.archivedAt?.toISOString(),
      };

      return {
        success: true,
        data: reportData,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      };
    }
  }

  /**
   * Delete a report
   * DELETE /api/reports/[id]
   */
  async deleteReport(request: {
    reportId: string;
    userId: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const command = new DeleteReportCommand({ reportId: request.reportId });

      const result = await this.deleteReportHandler.handle(command);

      if (result.isFailure) {
        return {
          success: false,
          error: result.error?.message || 'Failed to delete report',
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      };
    }
  }

  /**
   * Get report permissions
   * GET /api/reports/permissions?reportId=xxx
   */
  async getReportPermissions(request: {
    reportId: string;
    userId: string;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const report = await this.getReportHandler.handle(
        new GetReportQuery({ reportId: request.reportId })
      );

      if (report.isFailure || !report.value) {
        return {
          success: false,
          error: 'Report not found',
        };
      }

      const reportData = report.value;

      // Check if user is owner
      if (reportData.createdBy.id !== request.userId) {
        return {
          success: false,
          error: 'Access denied. Only the report owner can view permissions.',
        };
      }

      // Return permissions from the report entity
      // Note: The current domain model doesn't include permissions in the aggregate
      // This is a placeholder that would need to be implemented with a proper query/permissions handler
      return {
        success: true,
        data: {
          reportId: request.reportId,
          permissions: [], // Would be populated from a proper permissions repository
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      };
    }
  }

  /**
   * Create report permission
   * POST /api/reports/permissions
   */
  async createReportPermission(request: {
    reportId: string;
    userId: string;
    targetUserId: string;
    permission: string;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const report = await this.getReportHandler.handle(
        new GetReportQuery({ reportId: request.reportId })
      );

      if (report.isFailure || !report.value) {
        return {
          success: false,
          error: 'Report not found',
        };
      }

      const reportData = report.value;

      // Check if requesting user is owner
      if (reportData.createdBy.id !== request.userId) {
        return {
          success: false,
          error: 'Access denied. Only the report owner can grant permissions.',
        };
      }

      // Note: This would need a proper CreatePermissionHandler and Permission aggregate
      // For now, this is a placeholder that would be implemented with proper domain logic
      return {
        success: true,
        data: {
          id: crypto.randomUUID(),
          reportId: request.reportId,
          userId: request.targetUserId,
          permissionType: request.permission,
          grantedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      };
    }
  }

  /**
   * Get report statistics
   * GET /api/reports/stats
   */
  async getReportStats(request: {
    userId: string;
    organizationId?: string;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Use ListReportsHandler to get stats
      const allReportsResult = await this.listReportsHandler.handle(
        new ListReportsQuery({
          userId: request.userId,
          organizationId: request.organizationId,
          page: 1,
          limit: 1000, // Get all for stats
        })
      );

      if (allReportsResult.isFailure) {
        return {
          success: false,
          error: 'Failed to fetch report statistics',
        };
      }

      const allReports = allReportsResult.value?.reports || [];

      // Calculate stats
      const totalReports = allReports.length;
      const reportsThisMonth = allReports.filter(
        (r) => r.createdAt >= startOfMonth
      ).length;
      const reportsLastMonth = allReports.filter(
        (r) => r.createdAt >= startOfLastMonth && r.createdAt <= endOfLastMonth
      ).length;

      return {
        success: true,
        data: {
          totalReports,
          reportsCreatedThisMonth: reportsThisMonth,
          reportsCreatedLastMonth: reportsLastMonth,
          totalViews: 0,
          averageViews: 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      };
    }
  }
}
