import { Command } from '../../../../shared/application/base/command';
import { TaskType, AssignmentType, Priority } from '../../domain/entities/workflow-task';

/**
 * CreateWorkflowTaskCommand
 * Command for creating a new workflow task
 */
export interface CreateWorkflowTaskCommandProps {
  instanceId: string;
  stepId: string;
  name: string;
  description?: string;
  taskType?: TaskType;
  priority?: Priority;
  assigneeId?: string;
  assignedBy?: string;
  assignmentType?: AssignmentType;
  formData?: Record<string, any>;
  dueDate?: Date;
  slaHours?: number;
}

export class CreateWorkflowTaskCommand extends Command {
  public readonly props: CreateWorkflowTaskCommandProps;

  constructor(props: CreateWorkflowTaskCommandProps, userId?: string) {
    super(userId);
    this.props = {
      ...props,
      taskType: props.taskType || TaskType.MANUAL,
      priority: props.priority || Priority.NORMAL,
      assignmentType: props.assignmentType || AssignmentType.MANUAL,
      formData: props.formData || {},
    };
  }
}
