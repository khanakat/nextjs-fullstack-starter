import { Command } from '../../../../shared/application/base/command';
import { WorkflowStatus } from '../../domain/entities/workflow';

/**
 * UpdateWorkflowCommand
 * Command for updating an existing workflow
 */
export interface UpdateWorkflowCommandProps {
  workflowId: string;
  name?: string;
  description?: string;
  definition?: string;
  settings?: string;
  variables?: string;
  status?: WorkflowStatus;
  isTemplate?: boolean;
  isPublic?: boolean;
  updatedBy: string;
}

export class UpdateWorkflowCommand extends Command {
  public readonly props: UpdateWorkflowCommandProps;

  constructor(props: UpdateWorkflowCommandProps, userId?: string) {
    super(userId);
    this.props = props;
  }
}
