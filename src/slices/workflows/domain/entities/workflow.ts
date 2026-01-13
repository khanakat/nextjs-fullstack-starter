import { DomainEvent } from '../../../../shared/domain/base/domain-event';
import { WorkflowId } from '../value-objects/workflow-id';

/**
 * Workflow Domain Events
 */
class WorkflowCreatedEvent extends DomainEvent {
  constructor(workflowId: string, name: string) {
    super();
    Object.assign(this, { workflowId, name });
  }

  getEventName(): string {
    return 'WorkflowCreated';
  }
}

class WorkflowUpdatedEvent extends DomainEvent {
  constructor(workflowId: string, name: string) {
    super();
    Object.assign(this, { workflowId, name });
  }

  getEventName(): string {
    return 'WorkflowUpdated';
  }
}

class WorkflowDeletedEvent extends DomainEvent {
  constructor(workflowId: string, name: string) {
    super();
    super();
    Object.assign(this, { workflowId, name });
  }

  getEventName(): string {
    return 'WorkflowDeleted';
  }
}

class WorkflowPublishedEvent extends DomainEvent {
  constructor(workflowId: string, name: string) {
    super();
    Object.assign(this, { workflowId, name });
  }

  getEventName(): string {
    return 'WorkflowPublished';
  }
}

class WorkflowActivatedEvent extends DomainEvent {
  constructor(workflowId: string, name: string) {
    super();
    Object.assign(this, { workflowId, name });
  }

  getEventName(): string {
    return 'WorkflowActivated';
  }
}

class WorkflowDeactivatedEvent extends DomainEvent {
  constructor(workflowId: string, name: string) {
    super();
    Object.assign(this, { workflowId, name });
  }

  getEventName(): string {
    return 'WorkflowDeactivated';
  }
}

/**
 * Workflow Status Enum
 */
export enum WorkflowStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

/**
 * Workflow Props Interface
 */
export interface WorkflowProps {
  name: string;
  description?: string;
  version: string;
  status: WorkflowStatus;
  definition: string; // JSON string for workflow definition (nodes, edges, etc.)
  settings: string; // JSON string for workflow settings
  variables: string; // JSON string for workflow variables
  organizationId?: string;
  isTemplate: boolean;
  isPublic: boolean;
  createdBy?: string;
}

/**
 * Workflow Aggregate Root
 * Represents a business process workflow in workflows domain
 */
export class Workflow {
  private _domainEvents: DomainEvent[] = [];
  private constructor(private props: WorkflowProps, private _id: WorkflowId) {}

  // Getters
  get id(): WorkflowId {
    return this._id;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get version(): string {
    return this.props.version;
  }

  get status(): WorkflowStatus {
    return this.props.status;
  }

  get definition(): string {
    return this.props.definition;
  }

  get settings(): string {
    return this.props.settings;
  }

  get variables(): string {
    return this.props.variables;
  }

  get organizationId(): string | undefined {
    return this.props.organizationId;
  }

  get isTemplate(): boolean {
    return this.props.isTemplate;
  }

  get isPublic(): boolean {
    return this.props.isPublic;
  }

  // Business Methods

  /**
   * Update workflow details
   */
  updateDetails(updates: Partial<WorkflowProps>): void {
    if (updates.name !== undefined) {
      this.props.name = updates.name;
    }
    if (updates.description !== undefined) {
      this.props.description = updates.description;
    }
    if (updates.version !== undefined) {
      this.props.version = updates.version;
    }
    if (updates.definition !== undefined) {
      this.props.definition = updates.definition;
    }
    if (updates.settings !== undefined) {
      this.props.settings = updates.settings;
    }
    if (updates.variables !== undefined) {
      this.props.variables = updates.variables;
    }
    if (updates.isTemplate !== undefined) {
      this.props.isTemplate = updates.isTemplate;
    }
    if (updates.isPublic !== undefined) {
      this.props.isPublic = updates.isPublic;
    }

    this.addDomainEvent(new WorkflowUpdatedEvent(
      this.id.value,
      this.props.name
    ));
  }

  /**
   * Publish workflow (make it available for use)
   */
  publish(): void {
    if (this.props.status === WorkflowStatus.ACTIVE) {
      return; // Already published
    }

    this.props.status = WorkflowStatus.ACTIVE;
    this.addDomainEvent(new WorkflowPublishedEvent(
      this.id.value,
      this.props.name
    ));
  }

  /**
   * Activate workflow
   */
  activate(): void {
    if (this.props.status === WorkflowStatus.ACTIVE) {
      return; // Already active
    }

    this.props.status = WorkflowStatus.ACTIVE;
    this.addDomainEvent(new WorkflowActivatedEvent(
      this.id.value,
      this.props.name
    ));
  }

  /**
   * Deactivate workflow
   */
  deactivate(): void {
    if (this.props.status === WorkflowStatus.INACTIVE) {
      return; // Already inactive
    }

    this.props.status = WorkflowStatus.INACTIVE;
    this.addDomainEvent(new WorkflowDeactivatedEvent(
      this.id.value,
      this.props.name
    ));
  }

  /**
   * Archive workflow
   */
  archive(): void {
    if (this.props.status === WorkflowStatus.ARCHIVED) {
      return; // Already archived
    }

    this.props.status = WorkflowStatus.ARCHIVED;
    this.addDomainEvent(new WorkflowUpdatedEvent(
      this.id.value,
      this.props.name
    ));
  }

  /**
   * Check if workflow is draft
   */
  isDraft(): boolean {
    return this.props.status === WorkflowStatus.DRAFT;
  }

  /**
   * Check if workflow is active
   */
  isActive(): boolean {
    return this.props.status === WorkflowStatus.ACTIVE;
  }

  /**
   * Check if workflow is inactive
   */
  isInactive(): boolean {
    return this.props.status === WorkflowStatus.INACTIVE;
  }

  /**
   * Check if workflow is archived
   */
  isArchived(): boolean {
    return this.props.status === WorkflowStatus.ARCHIVED;
  }

  /**
   * Check if workflow is a template
   */
  isWorkflowTemplate(): boolean {
    return this.props.isTemplate;
  }

  /**
   * Check if workflow is public
   */
  isWorkflowPublic(): boolean {
    return this.props.isPublic;
  }

  /**
   * Get workflow definition as parsed object
   */
  getDefinitionAsObject(): any {
    try {
      return JSON.parse(this.props.definition);
    } catch {
      return {};
    }
  }

  /**
   * Get workflow settings as parsed object
   */
  getSettingsAsObject(): any {
    try {
      return JSON.parse(this.props.settings);
    } catch {
      return {};
    }
  }

  /**
   * Get workflow variables as parsed object
   */
  getVariablesAsObject(): any {
    try {
      return JSON.parse(this.props.variables);
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
   * Create a new Workflow (factory method)
   */
  static create(props: WorkflowProps): Workflow {
    const workflow = new Workflow(props, WorkflowId.create());
    workflow.addDomainEvent(new WorkflowCreatedEvent(
      workflow.id.value,
      props.name
    ));
    return workflow;
  }

  /**
   * Reconstitute Workflow from persistence (factory method)
   */
  static reconstitute(id: WorkflowId, props: WorkflowProps): Workflow {
    const workflow = new Workflow(props, id);
    return workflow;
  }

  /**
   * Convert to plain object for persistence
   */
  toPersistence(): Record<string, any> {
    return {
      id: this.id.value,
      name: this.props.name,
      description: this.props.description,
      version: this.props.version,
      status: this.props.status,
      definition: this.props.definition,
      settings: this.props.settings,
      variables: this.props.variables,
      organizationId: this.props.organizationId,
      isTemplate: this.props.isTemplate,
      isPublic: this.props.isPublic,
      createdBy: 'system',
    };
  }
}
