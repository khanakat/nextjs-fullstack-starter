import { DomainEvent } from '../../../../shared/domain/base/domain-event';
import { WorkflowInstanceId } from '../value-objects/workflow-instance-id';

/**
 * Workflow Instance Domain Events
 */
export class WorkflowInstanceStartedEvent extends DomainEvent {
  constructor(instanceId: string, workflowId: string) {
    super();
    Object.assign(this, { instanceId, workflowId });
  }

  getEventName(): string {
    return 'WorkflowInstanceStarted';
  }
}

export class WorkflowInstanceCompletedEvent extends DomainEvent {
  constructor(instanceId: string, workflowId: string, duration: number) {
    super();
    Object.assign(this, { instanceId, workflowId, duration });
  }

  getEventName(): string {
    return 'WorkflowInstanceCompleted';
  }
}

export class WorkflowInstanceFailedEvent extends DomainEvent {
  constructor(instanceId: string, workflowId: string, errorMessage: string) {
    super();
    Object.assign(this, { instanceId, workflowId, errorMessage });
  }

  getEventName(): string {
    return 'WorkflowInstanceFailed';
  }
}

export class WorkflowInstanceCancelledEvent extends DomainEvent {
  constructor(instanceId: string, workflowId: string) {
    super();
    Object.assign(this, { instanceId, workflowId });
  }

  getEventName(): string {
    return 'WorkflowInstanceCancelled';
  }
}

export class WorkflowInstancePausedEvent extends DomainEvent {
  constructor(instanceId: string, workflowId: string) {
    super();
    Object.assign(this, { instanceId, workflowId });
  }

  getEventName(): string {
    return 'WorkflowInstancePaused';
  }
}

export class WorkflowInstanceResumedEvent extends DomainEvent {
  constructor(instanceId: string, workflowId: string) {
    super();
    Object.assign(this, { instanceId, workflowId });
  }

  getEventName(): string {
    return 'WorkflowInstanceResumed';
  }
}

/**
 * Workflow Instance Status Enum
 */
export enum WorkflowInstanceStatus {
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  PAUSED = 'paused',
}

/**
 * Trigger Type Enum
 */
export enum TriggerType {
  MANUAL = 'manual',
  SCHEDULED = 'scheduled',
  WEBHOOK = 'webhook',
  EVENT = 'event',
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
 * Workflow Instance Props Interface
 */
export interface WorkflowInstanceProps {
  workflowId: string;
  status: WorkflowInstanceStatus;
  currentStepId?: string;
  data: string; // JSON string
  variables: string; // JSON string
  context: string; // JSON string
  triggeredBy?: string;
  triggerType: TriggerType;
  triggerData: string; // JSON string
  startedAt: Date;
  completedAt?: Date;
  pausedAt?: Date;
  duration?: number; // seconds
  errorMessage?: string;
  errorStep?: string;
  retryCount: number;
  priority: Priority;
  slaDeadline?: Date;
}

/**
 * Workflow Instance Aggregate Root
 * Represents a running instance of a workflow in the workflows domain
 */
export class WorkflowInstance {
  private _domainEvents: DomainEvent[] = [];
  private constructor(
    private props: WorkflowInstanceProps,
    private _id: WorkflowInstanceId
  ) {}

  // Getters
  get id(): WorkflowInstanceId {
    return this._id;
  }

  get workflowId(): string {
    return this.props.workflowId;
  }

  get status(): WorkflowInstanceStatus {
    return this.props.status;
  }

  get currentStepId(): string | undefined {
    return this.props.currentStepId;
  }

  get data(): string {
    return this.props.data;
  }

  get variables(): string {
    return this.props.variables;
  }

  get context(): string {
    return this.props.context;
  }

  get triggeredBy(): string | undefined {
    return this.props.triggeredBy;
  }

  get triggerType(): TriggerType {
    return this.props.triggerType;
  }

  get triggerData(): string {
    return this.props.triggerData;
  }

  get startedAt(): Date {
    return this.props.startedAt;
  }

  get completedAt(): Date | undefined {
    return this.props.completedAt;
  }

  get pausedAt(): Date | undefined {
    return this.props.pausedAt;
  }

  get duration(): number | undefined {
    return this.props.duration;
  }

  get errorMessage(): string | undefined {
    return this.props.errorMessage;
  }

  get errorStep(): string | undefined {
    return this.props.errorStep;
  }

  get retryCount(): number {
    return this.props.retryCount;
  }

  get priority(): Priority {
    return this.props.priority;
  }

  get slaDeadline(): Date | undefined {
    return this.props.slaDeadline;
  }

  // Business Methods

  /**
   * Complete the workflow instance
   */
  complete(): void {
    if (this.props.status === WorkflowInstanceStatus.COMPLETED) {
      return; // Already completed
    }

    if (
      this.props.status !== WorkflowInstanceStatus.RUNNING &&
      this.props.status !== WorkflowInstanceStatus.PAUSED
    ) {
      throw new Error(
        `Cannot complete workflow instance with status ${this.props.status}`
      );
    }

    this.props.status = WorkflowInstanceStatus.COMPLETED;
    this.props.completedAt = new Date();
    this.props.duration = Math.floor(
      (this.props.completedAt.getTime() - this.props.startedAt.getTime()) / 1000
    );

    this.addDomainEvent(
      new WorkflowInstanceCompletedEvent(
        this.id.value,
        this.props.workflowId,
        this.props.duration
      )
    );
  }

  /**
   * Fail the workflow instance
   */
  fail(errorMessage: string, errorStep?: string): void {
    if (this.props.status === WorkflowInstanceStatus.COMPLETED) {
      throw new Error('Cannot fail a completed workflow instance');
    }

    this.props.status = WorkflowInstanceStatus.FAILED;
    this.props.errorMessage = errorMessage;
    this.props.errorStep = errorStep;
    this.props.completedAt = new Date();

    this.addDomainEvent(
      new WorkflowInstanceFailedEvent(
        this.id.value,
        this.props.workflowId,
        errorMessage
      )
    );
  }

  /**
   * Cancel the workflow instance
   */
  cancel(): void {
    if (
      this.props.status === WorkflowInstanceStatus.COMPLETED ||
      this.props.status === WorkflowInstanceStatus.CANCELLED
    ) {
      return; // Already completed or cancelled
    }

    const previousStatus = this.props.status;
    this.props.status = WorkflowInstanceStatus.CANCELLED;
    this.props.completedAt = new Date();

    this.addDomainEvent(
      new WorkflowInstanceCancelledEvent(this.id.value, this.props.workflowId)
    );
  }

  /**
   * Pause the workflow instance
   */
  pause(): void {
    if (this.props.status !== WorkflowInstanceStatus.RUNNING) {
      throw new Error(
        `Cannot pause workflow instance with status ${this.props.status}`
      );
    }

    this.props.status = WorkflowInstanceStatus.PAUSED;
    this.props.pausedAt = new Date();

    this.addDomainEvent(
      new WorkflowInstancePausedEvent(this.id.value, this.props.workflowId)
    );
  }

  /**
   * Resume the workflow instance
   */
  resume(): void {
    if (this.props.status !== WorkflowInstanceStatus.PAUSED) {
      throw new Error(
        `Cannot resume workflow instance with status ${this.props.status}`
      );
    }

    this.props.status = WorkflowInstanceStatus.RUNNING;
    this.props.pausedAt = undefined;

    this.addDomainEvent(
      new WorkflowInstanceResumedEvent(this.id.value, this.props.workflowId)
    );
  }

  /**
   * Update current step
   */
  updateCurrentStep(stepId: string): void {
    if (this.props.status !== WorkflowInstanceStatus.RUNNING) {
      throw new Error(
        `Cannot update step for workflow instance with status ${this.props.status}`
      );
    }

    this.props.currentStepId = stepId;
  }

  /**
   * Increment retry count
   */
  incrementRetryCount(): void {
    this.props.retryCount += 1;
  }

  /**
   * Update instance data
   */
  updateData(data: string): void {
    this.props.data = data;
  }

  /**
   * Update instance variables
   */
  updateVariables(variables: string): void {
    this.props.variables = variables;
  }

  /**
   * Update instance context
   */
  updateContext(context: string): void {
    this.props.context = context;
  }

  /**
   * Check if instance is running
   */
  isRunning(): boolean {
    return this.props.status === WorkflowInstanceStatus.RUNNING;
  }

  /**
   * Check if instance is completed
   */
  isCompleted(): boolean {
    return this.props.status === WorkflowInstanceStatus.COMPLETED;
  }

  /**
   * Check if instance is failed
   */
  isFailed(): boolean {
    return this.props.status === WorkflowInstanceStatus.FAILED;
  }

  /**
   * Check if instance is cancelled
   */
  isCancelled(): boolean {
    return this.props.status === WorkflowInstanceStatus.CANCELLED;
  }

  /**
   * Check if instance is paused
   */
  isPaused(): boolean {
    return this.props.status === WorkflowInstanceStatus.PAUSED;
  }

  /**
   * Check if instance is active (running or paused)
   */
  isActive(): boolean {
    return (
      this.props.status === WorkflowInstanceStatus.RUNNING ||
      this.props.status === WorkflowInstanceStatus.PAUSED
    );
  }

  /**
   * Check if instance has exceeded SLA
   */
  hasExceededSLA(): boolean {
    if (!this.props.slaDeadline) {
      return false;
    }
    return new Date() > this.props.slaDeadline;
  }

  /**
   * Get instance data as parsed object
   */
  getDataAsObject(): any {
    try {
      return JSON.parse(this.props.data);
    } catch {
      return {};
    }
  }

  /**
   * Get instance variables as parsed object
   */
  getVariablesAsObject(): any {
    try {
      return JSON.parse(this.props.variables);
    } catch {
      return {};
    }
  }

  /**
   * Get instance context as parsed object
   */
  getContextAsObject(): any {
    try {
      return JSON.parse(this.props.context);
    } catch {
      return {};
    }
  }

  /**
   * Get trigger data as parsed object
   */
  getTriggerDataAsObject(): any {
    try {
      return JSON.parse(this.props.triggerData);
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
   * Create a new Workflow Instance (factory method)
   */
  static create(props: WorkflowInstanceProps): WorkflowInstance {
    const instance = new WorkflowInstance(
      props,
      WorkflowInstanceId.create()
    );
    instance.addDomainEvent(
      new WorkflowInstanceStartedEvent(instance.id.value, props.workflowId)
    );
    return instance;
  }

  /**
   * Reconstitute Workflow Instance from persistence (factory method)
   */
  static reconstitute(
    id: WorkflowInstanceId,
    props: WorkflowInstanceProps
  ): WorkflowInstance {
    const instance = new WorkflowInstance(props, id);
    return instance;
  }

  /**
   * Convert to plain object for persistence
   */
  toPersistence(): Record<string, any> {
    return {
      id: this.id.value,
      workflowId: this.props.workflowId,
      status: this.props.status,
      currentStepId: this.props.currentStepId,
      data: this.props.data,
      variables: this.props.variables,
      context: this.props.context,
      triggeredBy: this.props.triggeredBy,
      triggerType: this.props.triggerType,
      triggerData: this.props.triggerData,
      startedAt: this.props.startedAt,
      completedAt: this.props.completedAt,
      pausedAt: this.props.pausedAt,
      duration: this.props.duration,
      errorMessage: this.props.errorMessage,
      errorStep: this.props.errorStep,
      retryCount: this.props.retryCount,
      priority: this.props.priority,
      slaDeadline: this.props.slaDeadline,
    };
  }
}
