import { DomainEvent } from '../../../../shared/domain/base/domain-event';
import { WorkflowTaskId } from '../value-objects/workflow-task-id';

/**
 * Workflow Task Domain Events
 */
export class WorkflowTaskCreatedEvent extends DomainEvent {
  constructor(taskId: string, instanceId: string, name: string) {
    super();
    Object.assign(this, { taskId, instanceId, name });
  }

  getEventName(): string {
    return 'WorkflowTaskCreated';
  }
}

export class WorkflowTaskAssignedEvent extends DomainEvent {
  constructor(taskId: string, instanceId: string, assigneeId: string) {
    super();
    Object.assign(this, { taskId, instanceId, assigneeId });
  }

  getEventName(): string {
    return 'WorkflowTaskAssigned';
  }
}

export class WorkflowTaskStartedEvent extends DomainEvent {
  constructor(taskId: string, instanceId: string) {
    super();
    Object.assign(this, { taskId, instanceId });
  }

  getEventName(): string {
    return 'WorkflowTaskStarted';
  }
}

export class WorkflowTaskCompletedEvent extends DomainEvent {
  constructor(taskId: string, instanceId: string, completedBy: string) {
    super();
    Object.assign(this, { taskId, instanceId, completedBy });
  }

  getEventName(): string {
    return 'WorkflowTaskCompleted';
  }
}

export class WorkflowTaskRejectedEvent extends DomainEvent {
  constructor(taskId: string, instanceId: string, reason: string) {
    super();
    Object.assign(this, { taskId, instanceId, reason });
  }

  getEventName(): string {
    return 'WorkflowTaskRejected';
  }
}

export class WorkflowTaskCancelledEvent extends DomainEvent {
  constructor(taskId: string, instanceId: string) {
    super();
    Object.assign(this, { taskId, instanceId });
  }

  getEventName(): string {
    return 'WorkflowTaskCancelled';
  }
}

/**
 * Workflow Task Status Enum
 */
export enum WorkflowTaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

/**
 * Task Type Enum
 */
export enum TaskType {
  MANUAL = 'manual',
  APPROVAL = 'approval',
  REVIEW = 'review',
  FORM = 'form',
  AUTOMATED = 'automated',
}

/**
 * Assignment Type Enum
 */
export enum AssignmentType {
  MANUAL = 'manual',
  AUTOMATIC = 'automatic',
  ROLE_BASED = 'role_based',
}

/**
 * Workflow Task Props Interface
 */
export interface WorkflowTaskProps {
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
  formData: string; // JSON string
  attachments: string; // JSON array string
  comments: string; // JSON array string
  createdAt: Date;
  assignedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  dueDate?: Date;
  slaHours?: number;
  slaDeadline?: Date;
  result?: string; // JSON string
  completedBy?: string;
  rejectedBy?: string;
  rejectionReason?: string;
}

/**
 * Priority Enum
 */
export enum Priority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * Workflow Task Aggregate Root
 * Represents a task within a workflow instance
 */
export class WorkflowTask {
  private _domainEvents: DomainEvent[] = [];
  private constructor(
    private props: WorkflowTaskProps,
    private _id: WorkflowTaskId
  ) {}

  // Getters
  get id(): WorkflowTaskId {
    return this._id;
  }

  get instanceId(): string {
    return this.props.instanceId;
  }

  get stepId(): string {
    return this.props.stepId;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get taskType(): TaskType {
    return this.props.taskType;
  }

  get status(): WorkflowTaskStatus {
    return this.props.status;
  }

  get priority(): Priority {
    return this.props.priority;
  }

  get assigneeId(): string | undefined {
    return this.props.assigneeId;
  }

  get assignedBy(): string | undefined {
    return this.props.assignedBy;
  }

  get assignmentType(): AssignmentType {
    return this.props.assignmentType;
  }

  get formData(): string {
    return this.props.formData;
  }

  get attachments(): string {
    return this.props.attachments;
  }

  get comments(): string {
    return this.props.comments;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get assignedAt(): Date | undefined {
    return this.props.assignedAt;
  }

  get startedAt(): Date | undefined {
    return this.props.startedAt;
  }

  get completedAt(): Date | undefined {
    return this.props.completedAt;
  }

  get dueDate(): Date | undefined {
    return this.props.dueDate;
  }

  get slaHours(): number | undefined {
    return this.props.slaHours;
  }

  get slaDeadline(): Date | undefined {
    return this.props.slaDeadline;
  }

  get result(): string | undefined {
    return this.props.result;
  }

  get completedBy(): string | undefined {
    return this.props.completedBy;
  }

  get rejectedBy(): string | undefined {
    return this.props.rejectedBy;
  }

  get rejectionReason(): string | undefined {
    return this.props.rejectionReason;
  }

  // Business Methods

  /**
   * Assign task to a user
   */
  assignTo(assigneeId: string, assignedBy: string): void {
    if (this.props.status !== WorkflowTaskStatus.PENDING) {
      throw new Error(
        `Cannot assign task with status ${this.props.status}`
      );
    }

    this.props.assigneeId = assigneeId;
    this.props.assignedBy = assignedBy;
    this.props.assignedAt = new Date();

    this.addDomainEvent(
      new WorkflowTaskAssignedEvent(this.id.value, this.props.instanceId, assigneeId)
    );
  }

  /**
   * Start the task
   */
  start(userId: string): void {
    if (this.props.status !== WorkflowTaskStatus.PENDING) {
      throw new Error(
        `Cannot start task with status ${this.props.status}`
      );
    }

    if (this.props.assigneeId !== userId) {
      throw new Error('Task is not assigned to this user');
    }

    this.props.status = WorkflowTaskStatus.IN_PROGRESS;
    this.props.startedAt = new Date();

    this.addDomainEvent(
      new WorkflowTaskStartedEvent(this.id.value, this.props.instanceId)
    );
  }

  /**
   * Complete the task
   */
  complete(userId: string, result?: string): void {
    if (this.props.status !== WorkflowTaskStatus.IN_PROGRESS) {
      throw new Error(
        `Cannot complete task with status ${this.props.status}`
      );
    }

    if (this.props.assigneeId !== userId) {
      throw new Error('Task is not assigned to this user');
    }

    this.props.status = WorkflowTaskStatus.COMPLETED;
    this.props.completedAt = new Date();
    this.props.completedBy = userId;
    if (result) {
      this.props.result = result;
    }

    this.addDomainEvent(
      new WorkflowTaskCompletedEvent(this.id.value, this.props.instanceId, userId)
    );
  }

  /**
   * Reject the task
   */
  reject(userId: string, reason: string): void {
    if (
      this.props.status !== WorkflowTaskStatus.PENDING &&
      this.props.status !== WorkflowTaskStatus.IN_PROGRESS
    ) {
      throw new Error(
        `Cannot reject task with status ${this.props.status}`
      );
    }

    if (this.props.assigneeId !== userId) {
      throw new Error('Task is not assigned to this user');
    }

    this.props.status = WorkflowTaskStatus.REJECTED;
    this.props.completedAt = new Date();
    this.props.rejectedBy = userId;
    this.props.rejectionReason = reason;

    this.addDomainEvent(
      new WorkflowTaskRejectedEvent(this.id.value, this.props.instanceId, reason)
    );
  }

  /**
   * Cancel the task
   */
  cancel(): void {
    if (
      this.props.status === WorkflowTaskStatus.COMPLETED ||
      this.props.status === WorkflowTaskStatus.REJECTED ||
      this.props.status === WorkflowTaskStatus.CANCELLED
    ) {
      return; // Already terminal state
    }

    const previousStatus = this.props.status;
    this.props.status = WorkflowTaskStatus.CANCELLED;

    this.addDomainEvent(
      new WorkflowTaskCancelledEvent(this.id.value, this.props.instanceId)
    );
  }

  /**
   * Update task form data
   */
  updateFormData(formData: string): void {
    this.props.formData = formData;
  }

  /**
   * Add comment to task
   */
  addComment(comment: string): void {
    try {
      const comments = JSON.parse(this.props.comments);
      comments.push({
        text: comment,
        timestamp: new Date().toISOString(),
      });
      this.props.comments = JSON.stringify(comments);
    } catch (error) {
      // If parsing fails, initialize with new comment
      this.props.comments = JSON.stringify([
        {
          text: comment,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }

  /**
   * Add attachment to task
   */
  addAttachment(attachmentUrl: string): void {
    try {
      const attachments = JSON.parse(this.props.attachments);
      attachments.push({
        url: attachmentUrl,
        timestamp: new Date().toISOString(),
      });
      this.props.attachments = JSON.stringify(attachments);
    } catch (error) {
      // If parsing fails, initialize with new attachment
      this.props.attachments = JSON.stringify([
        {
          url: attachmentUrl,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }

  /**
   * Check if task is pending
   */
  isPending(): boolean {
    return this.props.status === WorkflowTaskStatus.PENDING;
  }

  /**
   * Check if task is in progress
   */
  isInProgress(): boolean {
    return this.props.status === WorkflowTaskStatus.IN_PROGRESS;
  }

  /**
   * Check if task is completed
   */
  isCompleted(): boolean {
    return this.props.status === WorkflowTaskStatus.COMPLETED;
  }

  /**
   * Check if task is rejected
   */
  isRejected(): boolean {
    return this.props.status === WorkflowTaskStatus.REJECTED;
  }

  /**
   * Check if task is cancelled
   */
  isCancelled(): boolean {
    return this.props.status === WorkflowTaskStatus.CANCELLED;
  }

  /**
   * Check if task is active (pending or in progress)
   */
  isActive(): boolean {
    return (
      this.props.status === WorkflowTaskStatus.PENDING ||
      this.props.status === WorkflowTaskStatus.IN_PROGRESS
    );
  }

  /**
   * Check if task is overdue
   */
  isOverdue(): boolean {
    if (!this.props.dueDate) {
      return false;
    }
    return new Date() > this.props.dueDate;
  }

  /**
   * Check if task has exceeded SLA
   */
  hasExceededSLA(): boolean {
    if (!this.props.slaDeadline) {
      return false;
    }
    return new Date() > this.props.slaDeadline;
  }

  /**
   * Check if task is assigned to user
   */
  isAssignedTo(userId: string): boolean {
    return this.props.assigneeId === userId;
  }

  /**
   * Get task form data as parsed object
   */
  getFormDataAsObject(): any {
    try {
      return JSON.parse(this.props.formData);
    } catch {
      return {};
    }
  }

  /**
   * Get task attachments as parsed array
   */
  getAttachmentsAsArray(): any[] {
    try {
      return JSON.parse(this.props.attachments);
    } catch {
      return [];
    }
  }

  /**
   * Get task comments as parsed array
   */
  getCommentsAsArray(): any[] {
    try {
      return JSON.parse(this.props.comments);
    } catch {
      return [];
    }
  }

  /**
   * Get task result as parsed object
   */
  getResultAsObject(): any {
    if (!this.props.result) {
      return {};
    }
    try {
      return JSON.parse(this.props.result);
    } catch {
      return {};
    }
  }

  /**
   * Add domain event
   */
  private addDomainEvent(domainEvent: DomainEvent): void {
    this._domainEvents.push(domainEvent);
  }

  /**
   * Get uncommitted domain events
   */
  public getUncommittedEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  /**
   * Clear domain events (when committed)
   */
  public clearEvents(): void {
    this._domainEvents = [];
  }

  /**
   * Create a new Workflow Task (factory method)
   */
  static create(props: WorkflowTaskProps): WorkflowTask {
    const task = new WorkflowTask(props, WorkflowTaskId.create());
    task.addDomainEvent(
      new WorkflowTaskCreatedEvent(task.id.value, props.instanceId, props.name)
    );
    return task;
  }

  /**
   * Reconstitute Workflow Task from persistence (factory method)
   */
  static reconstitute(id: WorkflowTaskId, props: WorkflowTaskProps): WorkflowTask {
    const task = new WorkflowTask(props, id);
    return task;
  }

  /**
   * Convert to plain object for persistence
   */
  toPersistence(): Record<string, any> {
    return {
      id: this.id.value,
      instanceId: this.props.instanceId,
      stepId: this.props.stepId,
      name: this.props.name,
      description: this.props.description,
      taskType: this.props.taskType,
      status: this.props.status,
      priority: this.props.priority,
      assigneeId: this.props.assigneeId,
      assignedBy: this.props.assignedBy,
      assignmentType: this.props.assignmentType,
      formData: this.props.formData,
      attachments: this.props.attachments,
      comments: this.props.comments,
      createdAt: this.props.createdAt,
      assignedAt: this.props.assignedAt,
      startedAt: this.props.startedAt,
      completedAt: this.props.completedAt,
      dueDate: this.props.dueDate,
      slaHours: this.props.slaHours,
      slaDeadline: this.props.slaDeadline,
      result: this.props.result,
      completedBy: this.props.completedBy,
      rejectedBy: this.props.rejectedBy,
      rejectionReason: this.props.rejectionReason,
    };
  }
}
