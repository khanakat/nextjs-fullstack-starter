import { Command } from '../../../../shared/application/base/command';

/**
 * UpdateWorkflowTaskCommand
 * Command for updating a workflow task
 */
export interface UpdateWorkflowTaskCommandProps {
  taskId: string;
  formData?: Record<string, any>;
  priority?: string;
  dueDate?: Date;
}

export class UpdateWorkflowTaskCommand extends Command {
  public readonly props: UpdateWorkflowTaskCommandProps;

  constructor(props: UpdateWorkflowTaskCommandProps, userId?: string) {
    super(userId);
    this.props = props;
  }
}
