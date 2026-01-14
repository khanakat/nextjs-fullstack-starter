import { CommandHandler } from '../../../base/command-handler';
import { CreateTemplateCommand } from '../commands/create-template.command';
import { IReportTemplateRepository } from '../../../../domain/reporting/repositories/report-template-repository';
import { ReportTemplate } from '../../../../domain/reporting/entities/report-template';
import { Result } from '../../../base/result';
import { toTemplateDto } from '../dto/template.dto';

export class CreateTemplateHandler implements CommandHandler<CreateTemplateCommand> {
  constructor(private templateRepository: IReportTemplateRepository) {}

  async handle(command: CreateTemplateCommand): Promise<Result<ReportTemplate>> {
    try {
      command.validate();

      // Create the template using the factory method
      const template = ReportTemplate.create({
        name: command.name,
        description: command.description,
        type: command.type,
        category: command.category,
        config: command.config,
        layout: command.layout,
        styling: command.styling,
        isSystem: false,
        isActive: true,
        tags: command.tags,
        createdBy: command.createdBy,
        organizationId: command.organizationId,
      });

      // Save to repository
      await this.templateRepository.save(template);

      return Result.success<ReportTemplate>(template);
    } catch (error) {
      return Result.failure<ReportTemplate>(
        error instanceof Error ? error.message : 'Failed to create template'
      );
    }
  }
}
