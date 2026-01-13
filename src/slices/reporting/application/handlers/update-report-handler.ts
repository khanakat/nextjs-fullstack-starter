import { CommandHandler } from '../../../../shared/application/base/command-handler';
import { Result } from '../../../../shared/application/base/result';
import { UpdateReportCommand } from '../commands/update-report-command';
import { ReportDto } from '../dtos/report-dto';
import { IReportRepository } from '../../../../shared/domain/reporting/repositories/report-repository';
import { ReportConfig } from '../../../../shared/domain/reporting/value-objects/report-config';
import { ReportLayout, ComponentType } from '../../../../shared/domain/reporting/value-objects/report-layout';
import { ReportStyling } from '../../../../shared/domain/reporting/value-objects/report-styling';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';

export class UpdateReportHandler extends CommandHandler<UpdateReportCommand, ReportDto> {
  constructor(private readonly reportRepository: IReportRepository) {
    super();
  }

  async handle(command: UpdateReportCommand): Promise<Result<ReportDto>> {
    // Prefijo de mensaje para errores de validación esperados por tests
    try {
      command.validate();
    } catch (err) {
      return Result.failure(new Error(`validation: ${(err as Error).message}`));
    }

    try {
      const cmd = command;
      const report = await this.reportRepository.findById(UniqueId.create(cmd.reportId));
      if (!report) {
        // Mensaje esperado por los tests
        throw new Error('Report not found');
      }

      // Authorization: only creator can update
      if (report.createdBy.id !== cmd.userId) {
        throw new Error('Not authorized to update this report');
      }

      // Update fields based on command
      if (cmd.title) {
        // Prevent duplicate titles for the same user/org
        const exists = await this.reportRepository.existsByTitle(
          cmd.title,
          UniqueId.create(cmd.userId),
          report.organizationId ? UniqueId.create(report.organizationId.id) : undefined
        );
        if (exists) {
          throw new Error('A report with this title already exists');
        }
        report.updateTitle(cmd.title);
      }
      if (cmd.description !== undefined) report.updateDescription(cmd.description);
      if (cmd.config) {
        const newConfig = this.convertToReportConfig(cmd.config);
        report.updateConfig(newConfig);
      }
      if (cmd.status !== undefined) {
        // Map string status to domain value object transitions
        if (cmd.status === 'PUBLISHED' && report.canBePublished()) {
          report.publish();
        } else if (cmd.status === 'ARCHIVED' && report.canBeArchived()) {
          report.archive();
        } else if (cmd.status === 'DRAFT') {
          // No-op: create/publish/archive drive transitions; reverting to DRAFT unsupported
        }
      }
      if (cmd.isPublic !== undefined) report.updateVisibility(cmd.isPublic);

      await this.reportRepository.save(report);
      return Result.success(this.convertToDto(report));
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  private convertToReportConfig(configDto: any): ReportConfig {
    const layout = ReportLayout.create({
      components: (configDto.layout?.components ?? []).map((comp: any) => ({
        id: comp.id,
        type: this.normalizeComponentType(comp.type),
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

  private normalizeComponentType(type: any): ComponentType {
    // Aceptar strings en minúsculas del DTO y mapear a enum del dominio
    if (typeof type === 'string') {
      const upper = type.toUpperCase();
      switch (upper) {
        case 'CHART':
          return ComponentType.CHART;
        case 'TABLE':
          return ComponentType.TABLE;
        case 'TEXT':
          return ComponentType.TEXT;
        case 'IMAGE':
          return ComponentType.IMAGE;
        case 'METRIC':
          return ComponentType.METRIC;
        case 'FILTER':
          return ComponentType.FILTER;
        default:
          // Dejar que la validación del VO lance error claro
          return upper as unknown as ComponentType;
      }
    }
    return type as ComponentType;
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