import { CommandHandler } from '../../../../shared/application/base/command-handler';
import { Result } from '../../../../shared/application/base/result';
import { CreateTemplateCommand } from '../commands/create-template-command';
import { ReportTemplateDto } from '../dtos/report-template-dto';
import { IReportTemplateRepository } from '../../../../shared/domain/reporting/repositories/report-template-repository';
import { ReportTemplate, TemplateType, TemplateCategory } from '../../../../shared/domain/reporting/entities/report-template';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { ReportConfig } from '../../../../shared/domain/reporting/value-objects/report-config';
import { ReportLayout } from '../../../../shared/domain/reporting/value-objects/report-layout';
import { ReportStyling } from '../../../../shared/domain/reporting/value-objects/report-styling';

/**
 * Handler for creating new report templates
 */
export class CreateTemplateHandler extends CommandHandler<CreateTemplateCommand, ReportTemplateDto> {
  constructor(private readonly templateRepository: IReportTemplateRepository) {
    super();
  }

  async handle(command: CreateTemplateCommand): Promise<Result<ReportTemplateDto>> {
    return this.handleWithValidation(command, async (cmd) => {
      // Check for duplicate template name within organization scope
      // Tests expect existsByName to receive (name, organizationId?)
      const nameExists = await this.templateRepository.existsByName(
        cmd.name,
        // Pass organizationId as the second argument (undefined when absent)
        (cmd.organizationId ? UniqueId.create(cmd.organizationId) : (undefined as any))
      );

      if (nameExists) {
        throw new Error('A template with this name already exists');
      }

      // Convert DTO to domain value objects
      const reportConfig = this.convertToReportConfig(cmd.config);

      // Create the template entity
      const template = ReportTemplate.create({
        name: cmd.name,
        description: cmd.description,
        type: cmd.type as TemplateType,
        category: cmd.category as TemplateCategory,
        config: reportConfig,
        tags: cmd.tags || [],
        previewImageUrl: cmd.previewImageUrl,
        isSystem: false,
        createdBy: UniqueId.create(cmd.userId!),
        organizationId: cmd.organizationId ? UniqueId.create(cmd.organizationId) : undefined,
      });

      // Save the template
      await this.templateRepository.save(template);

      // Convert to DTO and return
      return this.convertToDto(template);
    });
  }

  private convertToReportConfig(configDto: any): ReportConfig {
    // Convert layout DTO to domain object
    const layout = ReportLayout.create({
      components: configDto.layout.components.map((comp: any) => ({
        id: comp.id,
        type: comp.type,
        position: { x: comp.position.x, y: comp.position.y },
        size: { width: comp.size.width, height: comp.size.height },
        config: comp.config,
      })),
      grid: {
        columns: configDto.layout.grid.columns,
        rows: configDto.layout.grid.rows,
        gap: configDto.layout.grid.gap,
      },
    });

    // Convert styling DTO to domain object
    const styling = ReportStyling.create({
      theme: configDto.styling.theme,
      primaryColor: configDto.styling.colors.primary,
      secondaryColor: configDto.styling.colors.secondary,
      fontFamily: configDto.styling.fonts.family,
      fontSize: configDto.styling.fonts.sizes.medium,
    });

    return ReportConfig.create({
      title: configDto.title,
      description: configDto.description,
      filters: configDto.filters,
      parameters: configDto.parameters,
      layout,
      styling,
    });
  }

  private convertToDto(template: ReportTemplate): ReportTemplateDto {
    return new ReportTemplateDto(
      template.id.id,
      template.name,
      template.type,
      template.category,
      this.convertConfigToDto(template.config),
      template.isSystem,
      template.isActive,
      template.tags,
      template.createdBy.id,
      template.usageCount,
      template.createdAt,
      template.updatedAt,
      template.description,
      template.previewImageUrl,
      template.organizationId?.id,
      undefined // lastUsedAt is not available on ReportTemplate entity
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
        },
        fonts: {
          family: config.styling.fontFamily,
          sizes: {
            medium: config.styling.fontSize,
          },
        },
      },
    };
  }
}