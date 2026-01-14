import { Command } from '../../../../shared/application/base/command';
import { TriggerType, Priority } from '../../domain/entities/workflow-instance';

/**
 * CreateWorkflowInstanceCommand
 * Command for creating a new workflow instance
 */
export interface CreateWorkflowInstanceCommandProps {
  workflowId: string;
  triggeredBy?: string;
  triggerType?: TriggerType;
  triggerData?: string;
  data?: string;
  variables?: string;
  priority?: Priority;
  slaDeadline?: Date;
}

export class CreateWorkflowInstanceCommand extends Command {
  public readonly props: CreateWorkflowInstanceCommandProps;

  constructor(props: CreateWorkflowInstanceCommandProps, userId?: string) {
    super(userId);
    this.props = {
      ...props,
      triggerType: props.triggerType || TriggerType.MANUAL,
      triggerData: props.triggerData || '{}',
      data: props.data || '{}',
      variables: props.variables || '{}',
      priority: props.priority || Priority.NORMAL,
    };
  }
}
