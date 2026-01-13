import { CommandHandler } from '../../../../shared/application/base/command-handler';
import { Result } from '../../../../shared/application/base/result';
import { UpdateTemplateCommand } from '../commands/update-template-command';
import { ReportTemplateDto } from '../dtos/report-template-dto';
import { IReportTemplateRepository } from '../../../../shared/domain/reporting/repositories/report-template-repository';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { ReportConfig } from '../../../../shared/domain/reporting/value-objects/report-config';
import { ReportLayout } from '../../../../shared/domain/reporting/value-objects/report-layout';
import { ReportStyling } from '../../../../shared/domain/reporting/value-objects/report-styling';

/**
 * Handler for updating existing report templates
 */
export class UpdateTemplateHandler extends CommandHandler<UpdateTemplateCommand, ReportTemplateDto> {
  constructor(private readonly templateRepository: IReportTemplateRepository) {
    super();
  }

  async handle(command: UpdateTemplateCommand): Promise<Result<ReportTemplateDto>> {
    return this.handleWithValidation(command, async (cmd) => {
      // Find the template
      const templateId = UniqueId.create(cmd.templateId);
      const template = await this.templateRepository.findById(templateId);

      if (!template) {
        throw new Error(`Template with ID ${cmd.templateId} not found`);
      }

      // Check permissions - only creator can update (unless system template)
      // Normalize userId for consistent matching with UniqueId normalization
      const normalizedUserId = UniqueId.create(cmd.userId).id;
      if (!template.isSystem && template.createdBy.id !== normalizedUserId) {
        throw new Error('You do not have permission to update this template');
      }

      // System templates cannot be modified
      if (template.isSystem) {
        throw new Error('System templates cannot be modified');
      }

      // Check for name conflicts if name is being updated
      if (cmd.name && cmd.name !== template.name) {
        const nameExists = await this.templateRepository.existsByName(
          cmd.name,
          template.organizationId || (undefined as any)
        );

        if (nameExists) {
          throw new Error('A template with this name already exists');
        }
      }

      // Update template properties
      if (cmd.name !== undefined) {
        template.updateName(cmd.name);
      }

      if (cmd.description !== undefined) {
        template.updateDescription(cmd.description);
      }

      if (cmd.category !== undefined) {
        template.updateCategory(cmd.category);
      }

      if (cmd.config !== undefined) {
        const reportConfig = this.convertToReportConfig(cmd.config);
        template.updateConfig(reportConfig);
      }

      if (cmd.tags !== undefined) {
        template.updateTags(cmd.tags);
      }

      if (cmd.previewImageUrl !== undefined) {
        template.updatePreviewImage(cmd.previewImageUrl);
      }

      if (cmd.isActive !== undefined) {
        if (cmd.isActive) {
          template.activate();
        } else {
          template.deactivate();
        }
      }

      // Save the updated template
      await this.templateRepository.save(template);

      // Convert to DTO and return
      return this.convertToDto(template);
    });
  }

  private convertToReportConfig(configDto: any): ReportConfig {
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

  private convertToDto(template: any): ReportTemplateDto {
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
      undefined
    );
  }

  private convertConfigToDto(config: ReportConfig): any {
    return {
      title: config.title,
      description: config.description,
      filters: config.filters,
      parameters: config.parameters,
      layout: {
        type: 'grid',
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
