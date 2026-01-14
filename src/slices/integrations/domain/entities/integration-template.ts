import { ValueObject } from '../../../../shared/domain/base/value-object';
import { DomainEvent } from '../../../../shared/domain/base/domain-event';
import { IntegrationTemplateId } from '../value-objects/integration-template-id';

/**
 * Integration Template Props Interface
 */
export interface IntegrationTemplateProps {
  name: string;
  description?: string;
  provider: string;
  category: string;
  template: string; // JSON string for template configuration
  organizationId?: string | null;
  isBuiltIn: boolean;
  isPublic: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
}

/**
 * Integration Template Aggregate Root
 * Represents a reusable integration template
 */
export class IntegrationTemplate {
  private _domainEvents: DomainEvent[] = [];
  private constructor(private props: IntegrationTemplateProps, private _id: IntegrationTemplateId) {}

  // Getters
  get id(): IntegrationTemplateId {
    return this._id;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get provider(): string {
    return this.props.provider;
  }

  get category(): string {
    return this.props.category;
  }

  get template(): string {
    return this.props.template;
  }

  get organizationId(): string | null {
    return this.props.organizationId ?? null;
  }

  get isBuiltIn(): boolean {
    return this.props.isBuiltIn;
  }

  get isPublic(): boolean {
    return this.props.isPublic;
  }

  get createdAt(): Date {
    return this.props.createdAt ?? new Date();
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  get createdBy(): string | undefined {
    return this.props.createdBy;
  }

  // Business Methods

  /**
   * Update template details
   */
  updateDetails(updates: Partial<Pick<IntegrationTemplateProps, 'name' | 'description' | 'template' | 'category'>>): void {
    if (updates.name && updates.name !== this.props.name) {
      this.props.name = updates.name;
    }
    if (updates.description !== undefined) {
      this.props.description = updates.description;
    }
    if (updates.template && updates.template !== this.props.template) {
      this.props.template = updates.template;
      this.addDomainEvent(new IntegrationTemplateUpdatedEvent(
        this._id.value,
        this.props.name
      ));
    }
    if (updates.category && updates.category !== this.props.category) {
      this.props.category = updates.category;
    }
    this.props.updatedAt = new Date();
  }

  /**
   * Get template configuration as object
   */
  getTemplateAsObject(): any {
    try {
      return JSON.parse(this.props.template);
    } catch {
      return {};
    }
  }

  /**
   * Check if template is built-in
   */
  isTemplateBuiltIn(): boolean {
    return this.props.isBuiltIn;
  }

  /**
   * Check if template is publicly accessible
   */
  isTemplatePublic(): boolean {
    return this.props.isPublic;
  }

  /**
   * Check if template is organization-specific
   */
  isOrganizationSpecific(): boolean {
    return this.props.organizationId !== null && this.props.organizationId !== undefined;
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
   * Create a new Integration Template (factory method)
   */
  static create(props: IntegrationTemplateProps): IntegrationTemplate {
    const template = new IntegrationTemplate(props, IntegrationTemplateId.create());
    template.addDomainEvent(new IntegrationTemplateCreatedEvent(
      template._id.value,
      props.name
    ));
    return template;
  }

  /**
   * Reconstitute Integration Template from persistence (factory method)
   */
  static reconstitute(id: IntegrationTemplateId, props: IntegrationTemplateProps): IntegrationTemplate {
    const template = new IntegrationTemplate(props, id);
    return template;
  }

  /**
   * Convert to plain object for persistence
   */
  toPersistence(): Record<string, any> {
    return {
      id: this._id.value,
      name: this.props.name,
      description: this.props.description,
      provider: this.props.provider,
      category: this.props.category,
      template: this.props.template,
      organizationId: this.props.organizationId,
      isBuiltIn: this.props.isBuiltIn,
      isPublic: this.props.isPublic,
      createdAt: this.props.createdAt?.toISOString() ?? new Date().toISOString(),
      updatedAt: this.props.updatedAt?.toISOString() ?? null,
      createdBy: this.props.createdBy,
    };
  }
}

/**
 * Integration Template Created Event
 */
class IntegrationTemplateCreatedEvent extends DomainEvent {
  constructor(templateId: string, name: string) {
    super();
    Object.assign(this, { templateId, name });
  }

  getEventName(): string {
    return 'IntegrationTemplateCreated';
  }
}

/**
 * Integration Template Updated Event
 */
class IntegrationTemplateUpdatedEvent extends DomainEvent {
  constructor(templateId: string, name: string) {
    super();
    Object.assign(this, { templateId, name });
  }

  getEventName(): string {
    return 'IntegrationTemplateUpdated';
  }
}
