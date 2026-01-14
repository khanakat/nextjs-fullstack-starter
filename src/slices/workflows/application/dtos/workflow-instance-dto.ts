import { Dto } from '../../../../shared/application/base/dto';
import { WorkflowInstanceStatus, TriggerType, Priority } from '../../domain/entities/workflow-instance';

/**
 * WorkflowInstanceDto
 * Data Transfer Object for workflow instance
 */
export class WorkflowInstanceDto extends Dto {
  readonly workflowId: string;
  readonly status: WorkflowInstanceStatus;
  readonly currentStepId: string | undefined;
  readonly data: string;
  readonly variables: string;
  readonly context: string;
  readonly triggeredBy: string | undefined;
  readonly triggerType: TriggerType;
  readonly triggerData: string;
  readonly startedAt: Date;
  readonly completedAt: Date | undefined;
  readonly pausedAt: Date | undefined;
  readonly duration: number | undefined;
  readonly errorMessage: string | undefined;
  readonly errorStep: string | undefined;
  readonly retryCount: number;
  readonly priority: Priority;
  readonly slaDeadline: Date | undefined;

  constructor(props: {
    id: string;
    workflowId: string;
    status: WorkflowInstanceStatus;
    currentStepId?: string;
    data: string;
    variables: string;
    context: string;
    triggeredBy?: string;
    triggerType: TriggerType;
    triggerData: string;
    startedAt: Date;
    completedAt?: Date;
    pausedAt?: Date;
    duration?: number;
    errorMessage?: string;
    errorStep?: string;
    retryCount: number;
    priority: Priority;
    slaDeadline?: Date;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id, props.createdAt, props.updatedAt);
    this.workflowId = props.workflowId;
    this.status = props.status;
    this.currentStepId = props.currentStepId;
    this.data = props.data;
    this.variables = props.variables;
    this.context = props.context;
    this.triggeredBy = props.triggeredBy;
    this.triggerType = props.triggerType;
    this.triggerData = props.triggerData;
    this.startedAt = props.startedAt;
    this.completedAt = props.completedAt;
    this.pausedAt = props.pausedAt;
    this.duration = props.duration;
    this.errorMessage = props.errorMessage;
    this.errorStep = props.errorStep;
    this.retryCount = props.retryCount;
    this.priority = props.priority;
    this.slaDeadline = props.slaDeadline;
  }

  toObject(): Record<string, unknown> {
    return {
      id: this.id,
      workflowId: this.workflowId,
      status: this.status,
      currentStepId: this.currentStepId ?? null,
      data: this.data,
      variables: this.variables,
      context: this.context,
      triggeredBy: this.triggeredBy ?? null,
      triggerType: this.triggerType,
      triggerData: this.triggerData,
      startedAt: this.startedAt.toISOString(),
      completedAt: this.completedAt?.toISOString() ?? null,
      pausedAt: this.pausedAt?.toISOString() ?? null,
      duration: this.duration ?? null,
      errorMessage: this.errorMessage ?? null,
      errorStep: this.errorStep ?? null,
      retryCount: this.retryCount,
      priority: this.priority,
      slaDeadline: this.slaDeadline?.toISOString() ?? null,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt?.toISOString() ?? null,
    };
  }
}
