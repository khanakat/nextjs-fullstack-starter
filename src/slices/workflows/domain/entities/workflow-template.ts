import { DomainEvent } from '../../../../shared/domain/base/domain-event';
import { WorkflowTemplateId } from '../value-objects/workflow-template-id';

/**
 * Workflow Template Domain Events
 */
export class WorkflowTemplateCreatedEvent extends DomainEvent {
  constructor(templateId: string, name: string, category: string) {
    super();
    Object.assign(this, { templateId, name, category });
  }

  getEventName(): string {
    return 'WorkflowTemplateCreated';
  }
}

export class WorkflowTemplateUpdatedEvent extends DomainEvent {
  constructor(templateId: string, name: string) {
    super();
    Object.assign(this, { templateId, name });
  }

  getEventName(): string {
    return 'WorkflowTemplateUpdated';
  }
}

export class WorkflowTemplatePublishedEvent extends DomainEvent {
  constructor(templateId: string, name: string) {
    super();
    Object.assign(this, { templateId, name });
  }

  getEventName(): string {
    return 'WorkflowTemplatePublished';
  }
}

export class WorkflowTemplateUsedEvent extends DomainEvent {
  constructor(templateId: string, name: string) {
    super();
    Object.assign(this, { templateId, name });
  }

  getEventName(): string {
    return 'WorkflowTemplateUsed';
  }
}

export class WorkflowTemplateDeletedEvent extends DomainEvent {
  constructor(templateId: string, name: string) {
    super();
    Object.assign(this, { templateId, name });
  }

  getEventName(): string {
    return 'WorkflowTemplateDeleted';
  }
}

/**
 * Workflow Template Props Interface
 */
export interface WorkflowTemplateProps {
  workflowId?: string; // Reference to base workflow (optional)
  name: string;
  description?: string;
  category: string;
  template: string; // JSON string for template definition
  variables: string; // JSON string for template variables
  settings: string; // JSON string for template settings
  isBuiltIn: boolean;
  isPublic: boolean;
  tags: string; // JSON array string
  usageCount: number;
  rating?: number;
  createdBy?: string;
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Workflow Template Aggregate Root
 * Represents a reusable workflow template
 */
export class WorkflowTemplate {
  private _domainEvents: DomainEvent[] = [];
  private constructor(
    private props: WorkflowTemplateProps,
    private _id: WorkflowTemplateId
  ) {}

  // Getters
  get id(): WorkflowTemplateId {
    return this._id;
  }

  get workflowId(): string | undefined {
    return this.props.workflowId;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get category(): string {
    return this.props.category;
  }

  get template(): string {
    return this.props.template;
  }

  get variables(): string {
    return this.props.variables;
  }

  get settings(): string {
    return this.props.settings;
  }

  get isBuiltIn(): boolean {
    return this.props.isBuiltIn;
  }

  get isPublic(): boolean {
    return this.props.isPublic;
  }

  get tags(): string {
    return this.props.tags;
  }

  get usageCount(): number {
    return this.props.usageCount;
  }

  get rating(): number | undefined {
    return this.props.rating;
  }

  get createdBy(): string | undefined {
    return this.props.createdBy;
  }

  get organizationId(): string | undefined {
    return this.props.organizationId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business Methods

  /**
   * Update template details
   */
  updateDetails(updates: Partial<WorkflowTemplateProps>): void {
    const now = new Date();

    if (updates.name !== undefined) {
      this.props.name = updates.name;
    }
    if (updates.description !== undefined) {
      this.props.description = updates.description;
    }
    if (updates.category !== undefined) {
      this.props.category = updates.category;
    }
    if (updates.template !== undefined) {
      this.props.template = updates.template;
    }
    if (updates.variables !== undefined) {
      this.props.variables = updates.variables;
    }
    if (updates.settings !== undefined) {
      this.props.settings = updates.settings;
    }
    if (updates.isPublic !== undefined) {
      this.props.isPublic = updates.isPublic;
    }
    if (updates.tags !== undefined) {
      this.props.tags = updates.tags;
    }

    this.props.updatedAt = now;
    this.addDomainEvent(
      new WorkflowTemplateUpdatedEvent(this.id.value, this.props.name)
    );
  }

  /**
   * Increment usage count
   */
  recordUsage(): void {
    this.props.usageCount += 1;
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new WorkflowTemplateUsedEvent(this.id.value, this.props.name)
    );
  }

  /**
   * Update rating
   */
  updateRating(rating: number): void {
    if (rating < 0 || rating > 5) {
      throw new Error('Rating must be between 0 and 5');
    }

    this.props.rating = rating;
    this.props.updatedAt = new Date();
  }

  /**
   * Add tag
   */
  addTag(tag: string): void {
    try {
      const tags = JSON.parse(this.props.tags);
      if (!tags.includes(tag)) {
        tags.push(tag);
        this.props.tags = JSON.stringify(tags);
        this.props.updatedAt = new Date();
      }
    } catch (error) {
      // If parsing fails, initialize with new tag
      this.props.tags = JSON.stringify([tag]);
      this.props.updatedAt = new Date();
    }
  }

  /**
   * Remove tag
   */
  removeTag(tag: string): void {
    try {
      const tags = JSON.parse(this.props.tags);
      const filteredTags = tags.filter((t: string) => t !== tag);
      if (filteredTags.length !== tags.length) {
        this.props.tags = JSON.stringify(filteredTags);
        this.props.updatedAt = new Date();
      }
    } catch (error) {
      // Ignore if parsing fails
    }
  }

  /**
   * Make template public
   */
  makePublic(): void {
    if (!this.props.isPublic) {
      this.props.isPublic = true;
      this.props.updatedAt = new Date();

      this.addDomainEvent(
        new WorkflowTemplatePublishedEvent(this.id.value, this.props.name)
      );
    }
  }

  /**
   * Make template private
   */
  makePrivate(): void {
    if (this.props.isPublic) {
      this.props.isPublic = false;
      this.props.updatedAt = new Date();
    }
  }

  /**
   * Check if template is built-in
   */
  isSystemTemplate(): boolean {
    return this.props.isBuiltIn;
  }

  /**
   * Check if template is public
   */
  isTemplatePublic(): boolean {
    return this.props.isPublic;
  }

  /**
   * Check if template is owned by organization
   */
  isOwnedBy(organizationId: string): boolean {
    return this.props.organizationId === organizationId;
  }

  /**
   * Check if template can be modified
   * Built-in templates cannot be modified
   */
  canBeModified(): boolean {
    return !this.props.isBuiltIn;
  }

  /**
   * Check if template can be deleted
   * Built-in templates cannot be deleted
   */
  canBeDeleted(): boolean {
    return !this.props.isBuiltIn;
  }

  /**
   * Get template definition as parsed object
   */
  getTemplateAsObject(): any {
    try {
      return JSON.parse(this.props.template);
    } catch {
      return {};
    }
  }

  /**
   * Get template variables as parsed object
   */
  getVariablesAsObject(): any {
    try {
      return JSON.parse(this.props.variables);
    } catch {
      return {};
    }
  }

  /**
   * Get template settings as parsed object
   */
  getSettingsAsObject(): any {
    try {
      return JSON.parse(this.props.settings);
    } catch {
      return {};
    }
  }

  /**
   * Get template tags as parsed array
   */
  getTagsAsArray(): string[] {
    try {
      return JSON.parse(this.props.tags);
    } catch {
      return [];
    }
  }

  /**
   * Search in tags
   */
  hasTag(tag: string): boolean {
    const tags = this.getTagsAsArray();
    return tags.includes(tag);
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
   * Create a new Workflow Template (factory method)
   */
  static create(props: WorkflowTemplateProps): WorkflowTemplate {
    const now = new Date();
    const template = new WorkflowTemplate(
      {
        ...props,
        createdAt: now,
        updatedAt: now,
      },
      WorkflowTemplateId.create()
    );
    template.addDomainEvent(
      new WorkflowTemplateCreatedEvent(
        template.id.value,
        props.name,
        props.category
      )
    );
    return template;
  }

  /**
   * Reconstitute Workflow Template from persistence (factory method)
   */
  static reconstitute(
    id: WorkflowTemplateId,
    props: WorkflowTemplateProps
  ): WorkflowTemplate {
    const template = new WorkflowTemplate(props, id);
    return template;
  }

  /**
   * Convert to plain object for persistence
   */
  toPersistence(): Record<string, any> {
    return {
      id: this.id.value,
      workflowId: this.props.workflowId,
      name: this.props.name,
      description: this.props.description,
      category: this.props.category,
      template: this.props.template,
      variables: this.props.variables,
      settings: this.props.settings,
      isBuiltIn: this.props.isBuiltIn,
      isPublic: this.props.isPublic,
      tags: this.props.tags,
      usageCount: this.props.usageCount,
      rating: this.props.rating,
      createdBy: this.props.createdBy,
      organizationId: this.props.organizationId,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
