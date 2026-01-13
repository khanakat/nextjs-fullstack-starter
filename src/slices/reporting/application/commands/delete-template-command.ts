import { Command } from '../../../../shared/application/base/command';

/**
 * Command to delete a report template
 */
export class DeleteTemplateCommand extends Command {
  public readonly templateId: string;

  constructor(templateId: string, userId: string) {
    super(userId);
    this.templateId = templateId;
  }

  public validate(): void {
    super.validate();
    
    if (!this.templateId || this.templateId.trim().length === 0) {
      throw new Error('Template ID is required');
    }

    if (!this.userId || this.userId.trim().length === 0) {
      throw new Error('User ID is required');
    }
  }
}
