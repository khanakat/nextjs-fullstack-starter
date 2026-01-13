import { ApplicationService } from '../../../../shared/application/base/application-service';
import { Result } from '../../../../shared/application/base/result';
import { ReportDto } from '../dtos/report-dto';
import { CreateReportCommand } from '../commands/create-report-command';
import { UpdateReportCommand } from '../commands/update-report-command';
import { PublishReportCommand } from '../commands/publish-report-command';
import { ArchiveReportCommand } from '../commands/archive-report-command';
import { DeleteReportCommand } from '../commands/delete-report-command';
import { GetReportQuery } from '../queries/get-report-query';
import { GetReportsQuery, ReportSearchCriteria } from '../queries/get-reports-query';
import { CreateReportHandler } from '../handlers/create-report-handler';
import { UpdateReportHandler } from '../handlers/update-report-handler';
import { PublishReportHandler } from '../handlers/publish-report-handler';
import { ArchiveReportHandler } from '../handlers/archive-report-handler';
import { DeleteReportHandler } from '../handlers/delete-report-handler';
import { GetReportHandler } from '../query-handlers/get-report-handler';
import { GetReportsHandler } from '../query-handlers/get-reports-handler';
import { PaginationDto } from '../../../../shared/application/base/dto';
import { PaginatedResult } from '../../../../shared/application/base/paginated-result';
import { ReportStatus } from '../../../../shared/domain/reporting/value-objects/report-status';

/**
 * Use case for managing reports
 * Orchestrates report CRUD operations and business logic
 */
export class ReportManagementUseCase extends ApplicationService {
  constructor(
    private readonly createReportHandler: CreateReportHandler,
    private readonly updateReportHandler: UpdateReportHandler,
    private readonly publishReportHandler: PublishReportHandler,
    private readonly archiveReportHandler: ArchiveReportHandler,
    private readonly deleteReportHandler: DeleteReportHandler,
    private readonly getReportHandler: GetReportHandler,
    private readonly getReportsHandler: GetReportsHandler
  ) {
    super();
  }

  /**
   * Execute operation with validation and error handling
   */
  protected async executeWithValidation<T>(operation: () => Promise<T>): Promise<Result<T>> {
    try {
      const result = await operation();
      return Result.success(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // Application-level use case tests expect error as string, not Error instance
      return Result.failure(message as unknown as Error);
    }
  }

  /**
   * Supports both validation styles used across commands/queries:
   * - validate() throws on failure
   * - validate() returns Result with isSuccess/isFailure
   */
  private runValidationOrThrow(validateFn: () => any): void {
    const maybeResult = validateFn();
    if (maybeResult && typeof maybeResult === 'object' && 'isSuccess' in maybeResult) {
      // Treat as Result
      if (!maybeResult.isSuccess) {
        const err = maybeResult.error;
        const message = err instanceof Error ? err.message : String(err);
        throw message;
      }
    }
  }

  /**
   * Create a new report
   */
  async createReport(command: CreateReportCommand): Promise<Result<ReportDto>> {
    return this.executeWithValidation(async () => {
      try {
        // Validate command (supports both throw and Result styles)
        this.runValidationOrThrow(() => command.validate());

        // Execute creation
        const result = await this.createReportHandler.handle(command);
        if (!result.isSuccess) {
          throw result.error;
        }

        return result.value;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        // Re-throw as string so outer wrapper returns failure with string error as tests expect
        throw message;
      }
    });
  }

  /**
   * Update an existing report
   */
  async updateReport(command: UpdateReportCommand): Promise<Result<ReportDto>> {
    return this.executeWithValidation(async () => {
      try {
        // Validate command
        this.runValidationOrThrow(() => command.validate());

        // Execute update
        const result = await this.updateReportHandler.handle(command);
        if (!result.isSuccess) {
          throw result.error;
        }

        return result.value;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw message;
      }
    });
  }

  /**
   * Publish a report
   */
  async publishReport(command: PublishReportCommand): Promise<Result<ReportDto>> {
    return this.executeWithValidation(async () => {
      try {
        // Validate command
        this.runValidationOrThrow(() => command.validate());

        // Execute publish
        const result = await this.publishReportHandler.handle(command);
        if (!result.isSuccess) {
          throw result.error;
        }

        return result.value;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw message;
      }
    });
  }

  /**
   * Archive a report
   */
  async archiveReport(command: ArchiveReportCommand): Promise<Result<ReportDto>> {
    return this.executeWithValidation(async () => {
      try {
        // Validate command
        this.runValidationOrThrow(() => command.validate());

        // Execute archive
        const result = await this.archiveReportHandler.handle(command);
        if (!result.isSuccess) {
          throw result.error;
        }

        return result.value;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw message;
      }
    });
  }

  /**
   * Delete a report
   */
  async deleteReport(command: DeleteReportCommand): Promise<Result<void>> {
    return this.executeWithValidation(async () => {
      try {
        // Validate command
        this.runValidationOrThrow(() => command.validate());

        // Execute deletion
        const result = await this.deleteReportHandler.handle(command);
        if (!result.isSuccess) {
          throw result.error;
        }

        // Return void for delete operations
        return;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw message;
      }
    });
  }

  /**
   * Get a report by ID
   */
  async getReport(query: GetReportQuery): Promise<Result<ReportDto>> {
    return this.executeWithValidation(async () => {
      try {
        // Validate query (supports both styles; tests spy on this method)
        this.runValidationOrThrow(() => query.validate());

        const result = await this.getReportHandler.handle(query);
        if (!result.isSuccess) {
          throw result.error;
        }

        return result.value;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw message;
      }
    });
  }

  /**
   * Get reports with filtering and pagination
   */
  async getReports(query: GetReportsQuery): Promise<Result<PaginatedResult<ReportDto>>> {
    return this.executeWithValidation(async () => {
      try {
        // Validate query (supports both styles)
        this.runValidationOrThrow(() => query.validate());

        // Execute query using provided instance
        const result = await this.getReportsHandler.handle(query);
        if (!result.isSuccess) {
          throw result.error;
        }
        return result.value;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw message;
      }
    });
  }

  async getReportsByStatus(
    status: string,
    userId: string,
    organizationId: string,
    page: number,
    limit: number
  ): Promise<Result<PaginatedResult<ReportDto>>> {
    const criteria: ReportSearchCriteria = {
      status: status as any,
      organizationId,
      createdBy: userId,
    };
    const pagination: PaginationDto = { page, pageSize: limit };
    const query = new GetReportsQuery(criteria, pagination, userId);
    return this.getReports(query);
  }

  /**
   * Get user's reports
   */
  async getUserReports(
    userId: string,
    organizationId: string,
    page: number,
    limit: number
  ): Promise<Result<PaginatedResult<ReportDto>>> {
    const criteria: ReportSearchCriteria = {
      createdBy: userId,
      organizationId,
    };
    const pagination: PaginationDto = { page, pageSize: limit };
    const query = new GetReportsQuery(criteria, pagination, userId);
    return this.getReports(query);
  }

  /**
   * Get public reports
   */
  async getPublicReports(
    organizationId: string,
    page: number,
    limit: number
  ): Promise<Result<PaginatedResult<ReportDto>>> {
    const criteria: ReportSearchCriteria = {
      isPublic: true,
      organizationId,
    };
    const pagination: PaginationDto = { page, pageSize: limit };
    const query = new GetReportsQuery(criteria, pagination);
    return this.getReports(query);
  }

  /**
   * Search reports by title or description
   */
  async searchReports(
    searchTerm: string,
    userId: string,
    organizationId: string,
    page: number,
    limit: number
  ): Promise<Result<PaginatedResult<ReportDto>>> {
    const criteria: ReportSearchCriteria = {
      title: searchTerm,
      organizationId,
      createdBy: userId,
    };
    const pagination: PaginationDto = { page, pageSize: limit };
    const query = new GetReportsQuery(criteria, pagination, userId);
    return this.getReports(query);
  }

  /**
   * Get reports created in date range
   */
  async getReportsInDateRange(
    startDate: Date,
    endDate: Date,
    userId: string,
    organizationId: string,
    page: number,
    limit: number
  ): Promise<Result<PaginatedResult<ReportDto>>> {
    const criteria: ReportSearchCriteria = {
      createdAfter: startDate,
      createdBefore: endDate,
      organizationId,
      createdBy: userId,
    };
    const pagination: PaginationDto = { page, pageSize: limit };
    const query = new GetReportsQuery(criteria, pagination, userId);
    return this.getReports(query);
  }

  /**
   * Get report statistics for a user
   */
  async getReportStatistics(
    userId: string,
    organizationId?: string
  ): Promise<Result<{
    totalReports: number;
    publishedReports: number;
    draftReports: number;
    archivedReports: number;
    recentActivity: ReportDto[];
  }>> {
    return this.executeWithValidation(async () => {
      try {
        // Get all user reports
        // Use a validated page size within allowed bounds
        const allReportsResult = await this.getUserReports(userId, organizationId ?? '', 1, 100);
        if (!allReportsResult.isSuccess) {
          throw allReportsResult.error;
        }

        const reports = allReportsResult.value.items;

        // Calculate statistics
        const totalReports = reports.length;
        const publishedReports = reports.filter(r => String(r.status || '').toLowerCase() === 'published').length;
        const draftReports = reports.filter(r => String(r.status || '').toLowerCase() === 'draft').length;
        const archivedReports = reports.filter(r => String(r.status || '').toLowerCase() === 'archived').length;

        // Get recent activity (last 5 reports)
        const recentActivity = reports
          .sort((a, b) => {
            const aDate = a.updatedAt || a.createdAt;
            const bDate = b.updatedAt || b.createdAt;
            return new Date(bDate).getTime() - new Date(aDate).getTime();
          })
          .slice(0, 5);

        return {
          totalReports,
          publishedReports,
          draftReports,
          archivedReports,
          recentActivity,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw message;
      }
    });
  }

  /**
   * Duplicate a report
   */
  async duplicateReport(
    reportId: string,
    userId: string,
    newTitle?: string
  ): Promise<Result<ReportDto>> {
    return this.executeWithValidation(async () => {
      try {
        // Get the original report
        const originalReportQuery = new GetReportQuery({ id: reportId, userId });
        const originalReportResult = await this.getReport(originalReportQuery);
        if (!originalReportResult.isSuccess) {
          throw originalReportResult.error;
        }

        const originalReport = originalReportResult.value;

        // Create duplicate command
        const duplicateTitle = newTitle || `Copy of ${originalReport.title}`;
        const createCommand = new CreateReportCommand(
          duplicateTitle,
          originalReport.config,
          originalReport.isPublic,
          userId,
          originalReport.description,
          originalReport.templateId,
          originalReport.organizationId
        );

        // Create the duplicate
        const createResult = await this.createReport(createCommand);
        if (!createResult.isSuccess) {
          throw createResult.error;
        }

        return createResult.value;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw message;
      }
    });
  }
}