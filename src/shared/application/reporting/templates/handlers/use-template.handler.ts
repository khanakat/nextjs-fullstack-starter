import { CommandHandler } from '../../../base/command-handler';
import { UseTemplateCommand } from '../commands/use-template.command';
import { IReportTemplateRepository } from '../../../../domain/reporting/repositories/report-template-repository';
import { IReportRepository } from '../../../../domain/reporting/repositories/report-repository';
import { Report } from '../../../../domain/reporting/entities/report';
import { ReportTemplate } from '../../../../domain/reporting/entities/report-template';
import { Result } from '../../../base/result';
import { UniqueId } from '../../../../domain/value-objects/unique-id';
import { ReportConfig } from '../../../../domain/reporting/value-objects/report-config';

export class UseTemplateHandler implements CommandHandler<UseTemplateCommand> {
  constructor(
    private templateRepository: IReportTemplateRepository,
    private reportRepository: IReportRepository
  ) {}

  async handle(command: UseTemplateCommand): Promise<Result<{ report: Report; template: ReportTemplate }>> {
    try {
      command.validate();

      const templateId = UniqueId.create(command.templateId);
      const template = await this.templateRepository.findById(templateId);

      if (!template) {
        return Result.failure<{ report: Report; template: ReportTemplate }>('Template not found');
      }

      // Check permissions
      const isOwner = template.createdBy.id === command.userId;
      const canUse = isOwner || template.isPublic;

      if (!canUse) {
        return Result.failure<{ report: Report; template: ReportTemplate }>('You do not have permission to use this template');
      }

      // Create report from template
      const report = Report.create({
        name: command.title,
        description: command.description,
        templateId: templateId,
        config: template.config,
        createdBy: command.userId,
        organizationId: command.organizationId,
      });

      // Save the report
      await this.reportRepository.save(report);

      // Increment template usage
      await this.templateRepository.incrementUsage(templateId);

      return Result.success<{ report: Report; template: ReportTemplate }>({
        report,
        template,
      });
    } catch (error) {
      return Result.failure<{ report: Report; template: ReportTemplate }>(
        error instanceof Error ? error.message : 'Failed to use template'
      );
    }
  }
}
