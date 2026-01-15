import { CommandHandler } from '../../../base/command-handler';
import { UpdateTemplateCommand } from '../commands/update-template.command';
import { IReportTemplateRepository } from '../../../../domain/reporting/repositories/report-template-repository';
import { ReportTemplate } from '../../../../domain/reporting/entities/report-template';
import { Result } from '../../../base/result';
import { UniqueId } from '../../../../domain/value-objects/unique-id';
import { ReportConfig } from '../../../../domain/reporting/value-objects/report-config';

export class UpdateTemplateHandler extends CommandHandler<UpdateTemplateCommand, ReportTemplate> {
  constructor(private templateRepository: IReportTemplateRepository) {
    super();
  }

  async handle(command: UpdateTemplateCommand): Promise<Result<ReportTemplate>> {
    try {
      // @ts-ignore - validate() exists on Command base class
      command.validate();

      const templateId = UniqueId.create(command.templateId);
      const template = await this.templateRepository.findById(templateId);

      if (!template) {
        return Result.failure<ReportTemplate>(new Error('Template not found'));
      }

      // Update fields if provided
      if (command.name) {
        template.updateName(command.name);
      }

      if (command.description !== undefined) {
        template.updateDescription(command.description);
      }

      if (command.config) {
        const config = command.config instanceof ReportConfig
          ? command.config
          : ReportConfig.create(command.config);
        template.updateConfig(config);
      }

      if (command.isActive !== undefined) {
        if (command.isActive) {
          template.activate();
        } else {
          template.deactivate();
        }
      }

      if (command.tags) {
        template.updateTags(command.tags);
      }

      // Save updated template
      await this.templateRepository.save(template);

      return Result.success<ReportTemplate>(template);
    } catch (error) {
      return Result.failure<ReportTemplate>(
        error instanceof Error ? error : new Error('Failed to update template')
      );
    }
  }
}
