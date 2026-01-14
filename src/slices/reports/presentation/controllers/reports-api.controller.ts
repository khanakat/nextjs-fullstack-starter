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
          error: result.error || 'Failed to fetch reports',
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
          error: result.error || 'Report not found',
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
          error: result.error || 'Failed to create report',
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
          error: result.error || 'Failed to update report',
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
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const command = new DeleteReportCommand({ reportId: request.reportId });

      const result = await this.deleteReportHandler.handle(command);

      if (result.isFailure) {
        return {
          success: false,
          error: result.error || 'Failed to delete report',
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
}
