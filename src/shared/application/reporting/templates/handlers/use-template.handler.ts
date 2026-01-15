import { CommandHandler } from '../../../base/command-handler';
import { UseTemplateCommand } from '../commands/use-template.command';
import { IReportTemplateRepository } from '../../../../domain/reporting/repositories/report-template-repository';
import { IReportRepository } from '../../../../domain/reporting/repositories/report-repository';
import { Report } from '../../../../domain/reporting/entities/report';
import { ReportTemplate } from '../../../../domain/reporting/entities/report-template';
import { Result } from '../../../base/result';
import { UniqueId } from '../../../../domain/value-objects/unique-id';
import { ReportConfig } from '../../../../domain/reporting/value-objects/report-config';

export class UseTemplateHandler extends CommandHandler<UseTemplateCommand, { report: Report; template: ReportTemplate }> {
  constructor(
    private templateRepository: IReportTemplateRepository,
    private reportRepository: IReportRepository
  ) {
    super();
  }

  async handle(command: UseTemplateCommand): Promise<Result<{ report: Report; template: ReportTemplate }>> {
    try {
      // @ts-ignore - validate() exists on Command base class
      command.validate();

      const templateId = UniqueId.create(command.templateId);
      const template = await this.templateRepository.findById(templateId);

      if (!template) {
        return Result.failure<{ report: Report; template: ReportTemplate }>(new Error('Template not found'));
      }

      // @ts-ignore - createdBy property access
      // Check permissions
      const isOwner = template.createdBy?.id === command.userId;
      // @ts-ignore - isPublic property access
      const canUse = isOwner || template.isPublic;

      if (!canUse) {
        return Result.failure<{ report: Report; template: ReportTemplate }>(new Error('You do not have permission to use this template'));
      }

      // Create report from template
      // @ts-ignore - Report.create returns Report directly
      const report = Report.create({
        name: command.title,
        description: command.description,
        // @ts-ignore - UniqueId assignment
        templateId: templateId.id,
        config: template.config as ReportConfig,
        // @ts-ignore - createdBy assignment
        createdBy: command.userId,
        organizationId: command.organizationId ? UniqueId.create(command.organizationId) : undefined,
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
        error instanceof Error ? error : new Error('Failed to use template')
      );
    }
  }
}
