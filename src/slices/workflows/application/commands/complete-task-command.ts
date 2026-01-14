import { Command } from '../../../../shared/application/base/command';

/**
 * CompleteWorkflowTaskCommand
 * Command for completing a workflow task
 */
export interface CompleteWorkflowTaskCommandProps {
  taskId: string;
  result?: Record<string, any>;
}

export class CompleteWorkflowTaskCommand extends Command {
  public readonly props: CompleteWorkflowTaskCommandProps;

  constructor(props: CompleteWorkflowTaskCommandProps, userId?: string) {
    super(userId);
    this.props = {
      ...props,
      result: props.result || {},
    };
  }
}
