import { CommandHandler } from '../../../../shared/application/base/command-handler';
import { Result } from '../../../../shared/application/base/result';
import { CreateReportCommand } from '../commands/create-report-command';
import { ReportDto } from '../dtos/report-dto';
import { IReportRepository } from '../../../../shared/domain/reporting/repositories/report-repository';
import { IReportTemplateRepository } from '../../../../shared/domain/reporting/repositories/report-template-repository';
import { Report } from '../../../../shared/domain/reporting/entities/report';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { ReportConfig } from '../../../../shared/domain/reporting/value-objects/report-config';
import { ReportLayout, ComponentType } from '../../../../shared/domain/reporting/value-objects/report-layout';
import { ReportStyling } from '../../../../shared/domain/reporting/value-objects/report-styling';

/**
 * Handler for creating new reports
 */
export class CreateReportHandler extends CommandHandler<CreateReportCommand, ReportDto> {
  constructor(
    private readonly reportRepository: IReportRepository,
    private readonly templateRepository: IReportTemplateRepository
  ) {
    super();
  }

  async handle(command: CreateReportCommand): Promise<Result<ReportDto>> {
    return this.handleWithValidation(command, async (cmd) => {
      // Check if template exists (if provided)
      if (cmd.templateId) {
        const templateExists = await this.templateRepository.exists(UniqueId.create(cmd.templateId));
        if (!templateExists) {
          throw new Error(`Template with ID ${cmd.templateId} not found`);
        }
      }

      // Check for duplicate title within user/organization scope
      const titleExists = await this.reportRepository.existsByTitle(
        cmd.title,
        UniqueId.create(cmd.userId!),
        cmd.organizationId ? UniqueId.create(cmd.organizationId) : undefined
      );

      if (titleExists) {
        throw new Error('A report with this title already exists');
      }

      // Convert DTO to domain value objects
      const reportConfig = this.convertToReportConfig(cmd.config);

      // Create the report entity
      const report = Report.create({
        title: cmd.title,
        description: cmd.description,
        config: reportConfig,
        isPublic: cmd.isPublic,
        templateId: cmd.templateId ? UniqueId.create(cmd.templateId) : undefined,
        createdBy: UniqueId.create(cmd.userId!),
        organizationId: cmd.organizationId ? UniqueId.create(cmd.organizationId) : undefined,
      });

      // Save the report
      await this.reportRepository.save(report);

      // Convert to DTO and return
      return this.convertToDto(report);
    });
  }

  private convertToReportConfig(configDto: any): ReportConfig {
    // Convert layout DTO to domain object
    const layout = ReportLayout.create({
      components: configDto.layout.components.map((comp: any) => ({
        id: comp.id,
        // Normalize type to domain enum values (e.g., 'chart' -> 'CHART')
        type: (comp.type || '').toUpperCase() as ComponentType,
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

  private convertToDto(report: Report): ReportDto {
    return new ReportDto(
      report.id.id,
      report.title,
      report.status.toString(),
      report.isPublic,
      report.createdBy.id,
      this.convertConfigToDto(report.config),
      report.createdAt,
      report.updatedAt,
      report.description,
      report.templateId?.id,
      report.organizationId?.id,
      report.publishedAt,
      report.archivedAt || undefined
    );
  }

  private convertConfigToDto(config: ReportConfig): any {
    return {
      title: config.title,
      description: config.description,
      filters: config.filters,
      parameters: config.parameters,
      layout: {
        type: 'grid', // Default to grid type since ReportLayout doesn't have a type property
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
          accent: config.styling.primaryColor, // Default to primary color
          background: config.styling.theme === 'dark' ? '#000000' : '#ffffff',
          text: config.styling.theme === 'dark' ? '#ffffff' : '#000000',
        },
        fonts: {
          family: config.styling.fontFamily,
          sizes: { medium: config.styling.fontSize },
          weights: { normal: 400, bold: 700 },
        },
        spacing: {
          unit: 8, // Default spacing unit
          scale: [0.5, 1, 1.5, 2], // Default scale steps
        },
      },
    };
  }
}