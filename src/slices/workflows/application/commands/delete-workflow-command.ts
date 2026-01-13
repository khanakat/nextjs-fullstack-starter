import { Command } from '../../../../shared/application/base/command';

/**
 * DeleteWorkflowCommand
 * Command for deleting a workflow
 */
export interface DeleteWorkflowCommandProps {
  workflowId: string;
  deletedBy: string;
}

export class DeleteWorkflowCommand extends Command {
  public readonly props: DeleteWorkflowCommandProps;

  constructor(props: DeleteWorkflowCommandProps, userId?: string) {
    super(userId);
    this.props = props;
  }
}
