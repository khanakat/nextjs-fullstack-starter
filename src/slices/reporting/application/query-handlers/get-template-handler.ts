import { QueryHandler } from '../../../../shared/application/base/query-handler';
import { Result } from '../../../../shared/application/base/result';
import { GetTemplateQuery } from '../queries/get-template-query';
import { ReportTemplateDto } from '../dtos/report-template-dto';
import { IReportTemplateRepository } from '../../../../shared/domain/reporting/repositories/report-template-repository';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { ReportConfig } from '../../../../shared/domain/reporting/value-objects/report-config';

/**
 * Handler for retrieving a single report template by ID
 */
export class GetTemplateHandler extends QueryHandler<GetTemplateQuery, ReportTemplateDto> {
  constructor(private readonly templateRepository: IReportTemplateRepository) {
    super();
  }

  async handle(query: GetTemplateQuery): Promise<Result<ReportTemplateDto>> {
    return this.handleWithValidation(query, async (q) => {
      // Get the template by ID
      const template = await this.templateRepository.findById(UniqueId.create(q.templateId));
      
      if (!template) {
        throw new Error(`Template with ID ${q.templateId} not found`);
      }

      // Convert to DTO and return
      return this.convertToDto(template);
    });
  }

  private convertToDto(template: any): ReportTemplateDto {
    // Normalize id-like fields and map in expected constructor order
    const id = template.id?.id ?? template.id?.value ?? template.id;
    const createdBy = template.createdBy?.id ?? template.createdBy?.value ?? template.createdBy;
    const organizationId = template.organizationId?.id ?? template.organizationId?.value ?? template.organizationId;

    return new ReportTemplateDto(
      id,
      template.name,
      template.type,
      template.category,
      this.convertConfigToDto(template.config),
      template.isSystem,
      template.isActive,
      template.tags ?? [],
      createdBy,
      template.usageCount ?? 0,
      template.createdAt,
      template.updatedAt,
      template.description,
      template.previewImageUrl,
      organizationId,
      template.lastUsedAt
    );
  }

  private convertConfigToDto(config: ReportConfig): any {
    // Guard against undefined layout/styling shapes and normalize
    const layout = config.layout;
    const styling = config.styling;

    return {
      title: config.title,
      description: config.description,
      filters: config.filters ?? {},
      parameters: config.parameters ?? {},
      layout: {
        type: 'grid',
        components: Array.isArray((layout as any)?.components)
          ? layout.components.map((comp: any) => ({
              id: comp.id,
              type: comp.type,
              position: { x: comp.position.x, y: comp.position.y },
              size: { width: comp.size.width, height: comp.size.height },
              config: comp.config ?? {},
            }))
          : [],
        grid: {
          columns: (layout as any)?.grid?.columns ?? 12,
          rows: (layout as any)?.grid?.rows ?? 8,
          gap: (layout as any)?.grid?.gap ?? 16,
        },
      },
      styling: {
        theme: (styling as any)?.theme ?? 'light',
        colors: {
          primary: (styling as any)?.primaryColor ?? '#3b82f6',
          secondary: (styling as any)?.secondaryColor ?? '#64748b',
        },
        fonts: {
          family: (styling as any)?.fontFamily ?? 'Inter',
          sizes: { medium: (styling as any)?.fontSize ?? 14 },
        },
      },
    };
  }
}