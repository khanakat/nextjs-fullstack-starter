import { Command } from '../../../../shared/application/base/command';

/**
 * DeleteWorkflowTemplateCommand
 * Command for deleting a workflow template
 */
export interface DeleteWorkflowTemplateCommandProps {
  templateId: string;
}

export class DeleteWorkflowTemplateCommand extends Command {
  public readonly props: DeleteWorkflowTemplateCommandProps;

  constructor(props: DeleteWorkflowTemplateCommandProps, userId?: string) {
    super(userId);
    this.props = props;
  }
}
