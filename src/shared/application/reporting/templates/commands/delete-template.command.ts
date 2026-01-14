import { Command } from '../../../base/command';

/**
 * Delete Report Template Command
 * Command to delete (soft delete) a report template
 */
export class DeleteTemplateCommand extends Command {
  readonly templateId: string;
  readonly userId: string;

  constructor(templateId: string, userId: string) {
    super(userId);
    this.templateId = templateId;
    this.userId = userId;
  }

  public validate(): void {
    if (!this.templateId) {
      throw new Error('Template ID is required');
    }
  }
}
