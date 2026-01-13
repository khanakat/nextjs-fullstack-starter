import { QueryHandler } from '../../../../shared/application/base/query-handler';
import { Result } from '../../../../shared/application/base/result';
import { GetScheduledReportsQuery } from '../queries/get-scheduled-reports-query';
import { ScheduledReportDto, DeliveryConfigDto } from '../dtos/scheduled-report-dto';
import { IScheduledReportRepository } from '../../../../shared/domain/reporting/repositories/scheduled-report-repository';
import { PaginatedResult } from '../../../../shared/application/base/paginated-result';
import { ScheduledReport, ScheduledReportStatus, DeliveryConfig, DeliveryMethod, ScheduleFrequency, ReportFrequency } from '../../../../shared/domain/reporting/entities/scheduled-report';

/**
 * Query handler for retrieving multiple scheduled reports
 */
export class GetScheduledReportsHandler extends QueryHandler<GetScheduledReportsQuery, PaginatedResult<ScheduledReportDto>> {
  constructor(
    private readonly scheduledReportRepository: IScheduledReportRepository
  ) {
    super();
  }

  async handle(query: GetScheduledReportsQuery): Promise<Result<PaginatedResult<ScheduledReportDto>>> {
    return this.handleWithValidation(query, async () => {
      // Build filters object expected by repository tests
      const filters: Record<string, any> = {};

      if (query.criteria.name) {
        filters.name = query.criteria.name;
      }

      if (query.criteria.reportId) {
        // Pass raw string ID per test expectations
        filters.reportId = query.criteria.reportId;
      }

      if (query.criteria.frequency) {
        filters.frequency = query.criteria.frequency;
      }

      if (query.criteria.isActive !== undefined) {
        filters.isActive = query.criteria.isActive;
      }

      if (query.criteria.createdBy) {
        filters.createdBy = query.criteria.createdBy;
      }

      if (query.criteria.organizationId) {
        filters.organizationId = query.criteria.organizationId;
      }

      // Date range filters mapped to expected keys with gte/lte
      if (query.criteria.createdAfter || query.criteria.createdBefore) {
        filters.createdAt = {
          ...(query.criteria.createdAfter ? { gte: query.criteria.createdAfter } : {}),
          ...(query.criteria.createdBefore ? { lte: query.criteria.createdBefore } : {}),
        };
      }

      if (query.criteria.nextExecutionAfter || query.criteria.nextExecutionBefore) {
        filters.nextExecution = {
          ...(query.criteria.nextExecutionAfter ? { gte: query.criteria.nextExecutionAfter } : {}),
          ...(query.criteria.nextExecutionBefore ? { lte: query.criteria.nextExecutionBefore } : {}),
        };
      }

      if (query.criteria.lastExecutionAfter || query.criteria.lastExecutionBefore) {
        filters.lastExecution = {
          ...(query.criteria.lastExecutionAfter ? { gte: query.criteria.lastExecutionAfter } : {}),
          ...(query.criteria.lastExecutionBefore ? { lte: query.criteria.lastExecutionBefore } : {}),
        };
      }

      // Pagination and sorting
      const page = query.pagination.page;
      const pageSize = query.pagination.pageSize;
      const sortBy = query.pagination.sortBy as string | undefined;
      const sortOrder = query.pagination.sortOrder as 'asc' | 'desc' | undefined;

      // Fetch paginated scheduled reports from repository
      const repoResult: any = await (this.scheduledReportRepository as any).findManyWithPagination(
        filters,
        page,
        pageSize,
        sortBy,
        sortOrder
      );

      // Convert to DTOs
      const scheduledReportDtos = (repoResult.items ?? []).map((scheduledReport: ScheduledReport) => 
        this.convertToDto(scheduledReport)
      );

      // Support both shapes: { totalCount } and { total }
      const total = repoResult.totalCount ?? repoResult.total ?? 0;
      const resultPage = repoResult.page ?? page;
      const resultLimit = repoResult.limit ?? pageSize;

      return new PaginatedResult(
        scheduledReportDtos,
        total,
        resultPage,
        resultLimit
      );
    });
  }

  private convertToDto(scheduledReport: ScheduledReport): ScheduledReportDto {
    const dto = new ScheduledReportDto(
      scheduledReport.id.id,
      scheduledReport.name,
      scheduledReport.reportId.id,
      scheduledReport.scheduleConfig.frequency as unknown as ReportFrequency,
      scheduledReport.status === ScheduledReportStatus.ACTIVE,
      scheduledReport.executionCount,
      scheduledReport.failureCount,
      scheduledReport.createdBy.id,
      scheduledReport.scheduleConfig.timezone,
      this.convertDeliveryConfigToDto(scheduledReport.deliveryConfig),
      [], // executionHistory - simplified for now
      scheduledReport.createdAt,
      scheduledReport.updatedAt,
      scheduledReport.nextExecutionAt,
      scheduledReport.lastExecutedAt,
      scheduledReport.organizationId?.id
    ) as any;

    // Attach description to satisfy tests expecting description field
    dto.description = (scheduledReport as any).description ?? undefined;

    return dto as ScheduledReportDto;
  }

  private convertDeliveryConfigToDto(config: DeliveryConfig): DeliveryConfigDto {
    // Map DeliveryMethod enum values to DTO expected values
    const methodMapping: Record<DeliveryMethod, 'email' | 'webhook' | 'file_system' | 'cloud_storage'> = {
      [DeliveryMethod.EMAIL]: 'email',
      [DeliveryMethod.WEBHOOK]: 'webhook',
      [DeliveryMethod.DOWNLOAD]: 'file_system', // Map DOWNLOAD to file_system
    };

    // Map format from uppercase to lowercase
    const formatMapping: Record<string, 'pdf' | 'excel' | 'csv' | 'json'> = {
      'PDF': 'pdf',
      'EXCEL': 'excel',
      'CSV': 'csv',
    };

    return new DeliveryConfigDto(
      methodMapping[config.method],
      config.recipients || [],
      formatMapping[config.format] || 'pdf',
      { includeCharts: config.includeCharts }
    );
  }
}