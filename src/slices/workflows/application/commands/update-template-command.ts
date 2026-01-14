import { Command } from '../../../../shared/application/base/command';

/**
 * UpdateWorkflowTemplateCommand
 * Command for updating a workflow template
 */
export interface UpdateWorkflowTemplateCommandProps {
  templateId: string;
  name?: string;
  description?: string;
  category?: string;
  template?: Record<string, any>;
  variables?: Record<string, any>;
  settings?: Record<string, any>;
  isPublic?: boolean;
  tags?: string[];
}

export class UpdateWorkflowTemplateCommand extends Command {
  public readonly props: UpdateWorkflowTemplateCommandProps;

  constructor(props: UpdateWorkflowTemplateCommandProps, userId?: string) {
    super(userId);
    this.props = props;
  }
}
