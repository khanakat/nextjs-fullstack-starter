import { CommandHandler } from '../../../base/command-handler';
import { DeleteTemplateCommand } from '../commands/delete-template.command';
import { IReportTemplateRepository } from '../../../../domain/reporting/repositories/report-template-repository';
import { Result } from '../../../base/result';
import { UniqueId } from '../../../../domain/value-objects/unique-id';

export class DeleteTemplateHandler extends CommandHandler<DeleteTemplateCommand, void> {
  constructor(private templateRepository: IReportTemplateRepository) {
    super();
  }

  async handle(command: DeleteTemplateCommand): Promise<Result<void>> {
    try {
      // @ts-ignore - validate() exists on Command base class
      command.validate();

      const templateId = UniqueId.create(command.templateId);
      const template = await this.templateRepository.findById(templateId);

      if (!template) {
        return Result.failure<void>(new Error('Template not found'));
      }

      // Soft delete the template
      await this.templateRepository.delete(templateId);

      return Result.success<void>(undefined);
    } catch (error) {
      return Result.failure<void>(
        error instanceof Error ? error : new Error('Failed to delete template')
      );
    }
  }
}
