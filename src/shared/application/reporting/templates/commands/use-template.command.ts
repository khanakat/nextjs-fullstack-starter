import { Command } from '../../../base/command';

/**
 * Use Template Command
 * Command to create a report from a template
 */
export class UseTemplateCommand extends Command {
  readonly templateId: string;
  readonly title: string;
  readonly description?: string;
  readonly userId: string;
  readonly organizationId?: string;

  constructor(props: {
    templateId: string;
    title: string;
    description?: string;
    userId: string;
    organizationId?: string;
  }) {
    super(props.userId);
    this.templateId = props.templateId;
    this.title = props.title;
    this.description = props.description;
    this.userId = props.userId;
    this.organizationId = props.organizationId;
  }

  public validate(): void {
    if (!this.templateId) {
      throw new Error('Template ID is required');
    }

    if (!this.title || this.title.trim().length === 0) {
      throw new Error('Title is required');
    }
  }
}
