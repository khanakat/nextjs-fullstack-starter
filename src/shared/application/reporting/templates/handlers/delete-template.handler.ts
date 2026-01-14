import { CommandHandler } from '../../../base/command-handler';
import { DeleteTemplateCommand } from '../commands/delete-template.command';
import { IReportTemplateRepository } from '../../../../domain/reporting/repositories/report-template-repository';
import { Result } from '../../../base/result';
import { UniqueId } from '../../../../domain/value-objects/unique-id';

export class DeleteTemplateHandler implements CommandHandler<DeleteTemplateCommand> {
  constructor(private templateRepository: IReportTemplateRepository) {}

  async handle(command: DeleteTemplateCommand): Promise<Result<void>> {
    try {
      command.validate();

      const templateId = UniqueId.create(command.templateId);
      const template = await this.templateRepository.findById(templateId);

      if (!template) {
        return Result.failure<void>('Template not found');
      }

      // Soft delete the template
      await this.templateRepository.delete(templateId);

      return Result.success<void>(undefined);
    } catch (error) {
      return Result.failure<void>(
        error instanceof Error ? error.message : 'Failed to delete template'
      );
    }
  }
}
