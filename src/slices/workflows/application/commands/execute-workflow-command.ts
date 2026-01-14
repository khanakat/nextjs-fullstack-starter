import { Command } from '../../../../shared/application/base/command';
import { Priority } from '../../domain/entities/workflow-instance';

/**
 * ExecuteWorkflowCommand
 * Command for executing a workflow
 */
export interface ExecuteWorkflowCommandProps {
  workflowId: string;
  inputs?: Record<string, any>;
  variables?: Record<string, any>;
  priority?: Priority;
  triggeredBy?: string;
}

export class ExecuteWorkflowCommand extends Command {
  public readonly props: ExecuteWorkflowCommandProps;

  constructor(props: ExecuteWorkflowCommandProps, userId?: string) {
    super(userId);
    this.props = {
      ...props,
      priority: props.priority || Priority.NORMAL,
      inputs: props.inputs || {},
      variables: props.variables || {},
    };
  }
}
