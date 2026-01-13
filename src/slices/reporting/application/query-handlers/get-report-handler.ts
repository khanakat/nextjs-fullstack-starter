import { QueryHandler } from '../../../../shared/application/base/query-handler';
import { Result } from '../../../../shared/application/base/result';
import { GetReportQuery } from '../queries/get-report-query';
import { ReportDto } from '../dtos/report-dto';
import { IReportRepository } from '../../../../shared/domain/reporting/repositories/report-repository';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { ReportConfig } from '../../../../shared/domain/reporting/value-objects/report-config';

/**
 * Handler for retrieving a single report by ID
 */
export class GetReportHandler extends QueryHandler<GetReportQuery, ReportDto> {
  constructor(private readonly reportRepository: IReportRepository) {
    super();
  }

  async handle(query: GetReportQuery): Promise<Result<ReportDto>> {
    return this.handleWithValidation(query, async (q) => {
      try {
        // Get the report by ID
        const reportUniqueId = UniqueId.create(q.reportId);
        const report = await this.reportRepository.findById(reportUniqueId);
        
        if (!report) {
          throw new Error(`Report with ID ${q.reportId} not found`);
        }

        // Convert to DTO and return
        const dto = this.convertToDto(report);
        return dto;
      } catch (error) {
        console.error('GetReportHandler error:', error);
        throw error;
      }
    });
  }

  private convertToDto(report: any): ReportDto {
    return new ReportDto(
      report.id.value,
      report.title,
      report.status.toString(),
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
        type: 'grid', // Default layout type since ReportLayout doesn't have a type property
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
          primary: config.styling.primaryColor,
          secondary: config.styling.secondaryColor,
          accent: config.styling.primaryColor, // Use primary as accent fallback
          background: config.styling.theme === 'dark' ? '#1a1a1a' : '#ffffff',
          text: config.styling.theme === 'dark' ? '#ffffff' : '#000000',
        },
        fonts: {
          family: config.styling.fontFamily,
          sizes: { base: config.styling.fontSize },
          weights: { normal: 400, bold: 700 },
        },
        spacing: {
          unit: 8,
          scale: [0, 4, 8, 16, 24, 32, 48, 64],
        },
      },
    };
  }
}