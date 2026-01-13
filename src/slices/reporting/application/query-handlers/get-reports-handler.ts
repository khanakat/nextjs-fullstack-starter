import { QueryHandler } from '../../../../shared/application/base/query-handler';
import { Result } from '../../../../shared/application/base/result';
import { GetReportsQuery } from '../queries/get-reports-query';
import { ReportDto } from '../dtos/report-dto';
import { IReportRepository } from '../../../../shared/domain/reporting/repositories/report-repository';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { ReportConfig } from '../../../../shared/domain/reporting/value-objects/report-config';
import { PaginatedResult } from '../../../../shared/application/base/paginated-result';

/**
 * Handler for retrieving multiple reports with filtering and pagination
 */
export class GetReportsHandler extends QueryHandler<GetReportsQuery, PaginatedResult<ReportDto>> {
  constructor(private readonly reportRepository: IReportRepository) {
    super();
  }

  async handle(query: GetReportsQuery): Promise<Result<PaginatedResult<ReportDto>>> {
    return this.handleWithValidation(query, async (q) => {
      // Build filter criteria
      const filters = this.buildFilters(q.criteria);

      // Use search method from repository interface
      const result = await this.reportRepository.search(
        filters,
        {
          limit: q.pagination.pageSize,
          offset: (q.pagination.page - 1) * q.pagination.pageSize,
          sortBy: (q.pagination.sortBy as 'title' | 'createdAt' | 'updatedAt' | 'publishedAt') || 'createdAt',
          sortOrder: q.pagination.sortOrder || 'desc',
        }
      );

      // Convert to DTOs
      const reportDtos = result.reports.map((report: any) => this.convertToDto(report));

      return new PaginatedResult(
        reportDtos,
        result.total,
        q.pagination.page,
        q.pagination.pageSize
      );
    });
  }

  private buildFilters(criteria: any): any {
    const filters: any = {};

    if (criteria.title) {
      filters.title = { contains: criteria.title, mode: 'insensitive' };
    }

    if (criteria.status) {
      filters.status = criteria.status;
    }

    if (criteria.createdBy) {
      filters.createdBy = criteria.createdBy;
    }

    if (criteria.organizationId) {
      filters.organizationId = criteria.organizationId;
    }

    if (criteria.templateId) {
      filters.templateId = criteria.templateId;
    }

    if (criteria.isPublic !== undefined) {
      filters.isPublic = criteria.isPublic;
    }

    if (criteria.createdAfter || criteria.createdBefore) {
      filters.createdAt = {};
      if (criteria.createdAfter) {
        filters.createdAt.gte = criteria.createdAfter;
      }
      if (criteria.createdBefore) {
        filters.createdAt.lte = criteria.createdBefore;
      }
    }

    if (criteria.updatedAfter || criteria.updatedBefore) {
      filters.updatedAt = {};
      if (criteria.updatedAfter) {
        filters.updatedAt.gte = criteria.updatedAfter;
      }
      if (criteria.updatedBefore) {
        filters.updatedAt.lte = criteria.updatedBefore;
      }
    }

    if (criteria.tags && criteria.tags.length > 0) {
      filters.tags = { hasSome: criteria.tags };
    }

    return filters;
  }

  private convertToDto(report: any): ReportDto {
    return new ReportDto(
      report.id.value,
      report.title,
      report.status,
      report.isPublic,
      report.createdBy.value,
      this.convertConfigToDto(report.config),
      report.createdAt,
      report.updatedAt,
      report.description,
      report.templateId?.value,
      report.organizationId?.value,
      report.publishedAt,
      report.archivedAt
    );
  }

  private convertConfigToDto(config: ReportConfig): any {
    return {
      title: config.title,
      description: config.description,
      filters: config.filters,
      parameters: config.parameters,
      layout: {
        type: 'grid' as const,
        components: config.layout.components.map(comp => ({
          id: comp.id,
          type: comp.type,
          position: { x: comp.position.x, y: comp.position.y },
          size: { width: comp.size.width, height: comp.size.height },
          config: comp.config,
        })),
        grid: {
          columns: config.layout.grid.columns,
          rows: config.layout.grid.rows,
          gap: config.layout.grid.gap,
        },
      },
      styling: {
        theme: config.styling.theme,
        colors: {
          primary: (config as any)?.styling?.primaryColor ?? '#3b82f6',
          secondary: (config as any)?.styling?.secondaryColor ?? '#64748b',
          accent: config.styling.theme === 'dark' ? '#f59e0b' : '#8b5cf6',
          background: config.styling.theme === 'dark' ? '#1f2937' : '#ffffff',
          text: config.styling.theme === 'dark' ? '#f9fafb' : '#111827',
        },
        fonts: {
          family: (config as any)?.styling?.fontFamily ?? 'Inter',
          sizes: { base: (config as any)?.styling?.fontSize ?? 14 },
          weights: { normal: 400, medium: 500, bold: 700 },
        },
        spacing: {
          unit: 8,
          scale: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48],
        },
      },
    };
  }
}