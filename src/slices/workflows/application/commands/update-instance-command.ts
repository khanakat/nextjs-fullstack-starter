import { Command } from '../../../../shared/application/base/command';
import { WorkflowInstanceStatus } from '../../domain/entities/workflow-instance';

/**
 * UpdateWorkflowInstanceCommand
 * Command for updating a workflow instance
 */
export interface UpdateWorkflowInstanceCommandProps {
  instanceId: string;
  data?: string;
  variables?: string;
  context?: string;
  currentStepId?: string;
}

export class UpdateWorkflowInstanceCommand extends Command {
  public readonly props: UpdateWorkflowInstanceCommandProps;

  constructor(props: UpdateWorkflowInstanceCommandProps, userId?: string) {
    super(userId);
    this.props = props;
  }
}
