import { Dto } from '../../../../shared/application/base/dto';
import { WorkflowTaskStatus, TaskType, AssignmentType, Priority } from '../../domain/entities/workflow-task';

/**
 * WorkflowTaskDto
 * Data Transfer Object for workflow task
 */
export class WorkflowTaskDto extends Dto {
  readonly instanceId: string;
  readonly stepId: string;
  readonly name: string;
  readonly description: string | undefined;
  readonly taskType: TaskType;
  readonly status: WorkflowTaskStatus;
  readonly priority: Priority;
  readonly assigneeId: string | undefined;
  readonly assignedBy: string | undefined;
  readonly assignmentType: AssignmentType;
  readonly formData: string;
  readonly attachments: string;
  readonly comments: string;
  readonly assignedAt: Date | undefined;
  readonly startedAt: Date | undefined;
  readonly completedAt: Date | undefined;
  readonly dueDate: Date | undefined;
  readonly slaHours: number | undefined;
  readonly slaDeadline: Date | undefined;
  readonly result: string | undefined;
  readonly completedBy: string | undefined;
  readonly rejectedBy: string | undefined;
  readonly rejectionReason: string | undefined;

  constructor(props: {
    id: string;
    instanceId: string;
    stepId: string;
    name: string;
    description?: string;
    taskType: TaskType;
    status: WorkflowTaskStatus;
    priority: Priority;
    assigneeId?: string;
    assignedBy?: string;
    assignmentType: AssignmentType;
    formData: string;
    attachments: string;
    comments: string;
    assignedAt?: Date;
    startedAt?: Date;
    completedAt?: Date;
    dueDate?: Date;
    slaHours?: number;
    slaDeadline?: Date;
    result?: string;
    completedBy?: string;
    rejectedBy?: string;
    rejectionReason?: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id, props.createdAt, props.updatedAt);
    this.instanceId = props.instanceId;
    this.stepId = props.stepId;
    this.name = props.name;
    this.description = props.description;
    this.taskType = props.taskType;
    this.status = props.status;
    this.priority = props.priority;
    this.assigneeId = props.assigneeId;
    this.assignedBy = props.assignedBy;
    this.assignmentType = props.assignmentType;
    this.formData = props.formData;
    this.attachments = props.attachments;
    this.comments = props.comments;
    this.assignedAt = props.assignedAt;
    this.startedAt = props.startedAt;
    this.completedAt = props.completedAt;
    this.dueDate = props.dueDate;
    this.slaHours = props.slaHours;
    this.slaDeadline = props.slaDeadline;
    this.result = props.result;
    this.completedBy = props.completedBy;
    this.rejectedBy = props.rejectedBy;
    this.rejectionReason = props.rejectionReason;
  }

  toObject(): Record<string, unknown> {
    return {
      id: this.id,
      instanceId: this.instanceId,
      stepId: this.stepId,
      name: this.name,
      description: this.description ?? null,
      taskType: this.taskType,
      status: this.status,
      priority: this.priority,
      assigneeId: this.assigneeId ?? null,
      assignedBy: this.assignedBy ?? null,
      assignmentType: this.assignmentType,
      formData: this.formData,
      attachments: this.attachments,
      comments: this.comments,
      assignedAt: this.assignedAt?.toISOString() ?? null,
      startedAt: this.startedAt?.toISOString() ?? null,
      completedAt: this.completedAt?.toISOString() ?? null,
      dueDate: this.dueDate?.toISOString() ?? null,
      slaHours: this.slaHours ?? null,
      slaDeadline: this.slaDeadline?.toISOString() ?? null,
      result: this.result ?? null,
      completedBy: this.completedBy ?? null,
      rejectedBy: this.rejectedBy ?? null,
      rejectionReason: this.rejectionReason ?? null,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt?.toISOString() ?? null,
    };
  }
}
