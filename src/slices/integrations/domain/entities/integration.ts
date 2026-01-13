import { ValueObject } from '../../../../shared/domain/base/value-object';
import { DomainEvent } from '../../../../shared/domain/base/domain-event';
import { IntegrationId } from '../value-objects/integration-id';

/**
 * Integration Status Enum
 */
export enum IntegrationStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * Integration Props Interface
 */
export interface IntegrationProps {
  name: string;
  type: string;
  provider: string;
  config: string; // JSON string for integration configuration
  organizationId?: string;
  status: IntegrationStatus;
  lastSync?: Date;
  lastError?: string;
  category?: string;
  description?: string;
  settings?: string;
  isEnabled?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
}

/**
 * Integration Aggregate Root
 * Represents an external integration (e.g., Stripe, Google, Slack, etc.)
 */
export class Integration {
  private _domainEvents: DomainEvent[] = [];
  private constructor(private props: IntegrationProps, private _id: IntegrationId) {}

  // Getters
  get id(): IntegrationId {
    return this._id;
  }

  get name(): string {
    return this.props.name;
  }

  get type(): string {
    return this.props.type;
  }

  get provider(): string {
    return this.props.provider;
  }

  get config(): string {
    return this.props.config;
  }

  get organizationId(): string | undefined {
    return this.props.organizationId;
  }

  get status(): IntegrationStatus {
    return this.props.status;
  }

  get lastSync(): Date | undefined {
    return this.props.lastSync;
  }

  get lastError(): string | undefined {
    return this.props.lastError;
  }

  get category(): string | undefined {
    return this.props.category;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get settings(): string | undefined {
    return this.props.settings;
  }

  get isEnabled(): boolean {
    return this.props.isEnabled ?? true;
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
   * Update integration configuration
   */
  updateConfig(config: string): void {
    this.props.config = config;
    this.addDomainEvent(new IntegrationConfigUpdatedEvent(
      this._id.value,
      this.props.name
    ));
  }

  /**
   * Mark integration as completed
   */
  markAsCompleted(): void {
    if (this.props.status !== IntegrationStatus.COMPLETED) {
      this.props.status = IntegrationStatus.COMPLETED;
      this.addDomainEvent(new IntegrationCompletedEvent(
        this._id.value,
        this.props.name
      ));
    }
  }

  /**
   * Mark integration as failed
   */
  markAsFailed(error: string): void {
    this.props.status = IntegrationStatus.FAILED;
    this.props.lastError = error;
    this.addDomainEvent(new IntegrationFailedEvent(
      this._id.value,
      this.props.name,
      error
    ));
  }

  /**
   * Update last sync timestamp
   */
  updateLastSync(timestamp: Date): void {
    this.props.lastSync = timestamp;
  }

  /**
   * Check if integration is pending
   */
  isPending(): boolean {
    return this.props.status === IntegrationStatus.PENDING;
  }

  /**
   * Check if integration is in progress
   */
  isInProgress(): boolean {
    return this.props.status === IntegrationStatus.IN_PROGRESS;
  }

  /**
   * Check if integration is completed
   */
  isCompleted(): boolean {
    return this.props.status === IntegrationStatus.COMPLETED;
  }

  /**
   * Check if integration is failed
   */
  isFailed(): boolean {
    return this.props.status === IntegrationStatus.FAILED;
  }

  /**
   * Get configuration as object
   */
  getConfigAsObject(): any {
    try {
      return JSON.parse(this.props.config);
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
   * Create a new Integration (factory method)
   */
  static create(props: IntegrationProps): Integration {
    const integration = new Integration(props, IntegrationId.create());
    integration.addDomainEvent(new IntegrationCreatedEvent(
      integration._id.value,
      props.name
    ));
    return integration;
  }

  /**
   * Reconstitute Integration from persistence (factory method)
   */
  static reconstitute(id: IntegrationId, props: IntegrationProps): Integration {
    const integration = new Integration(props, id);
    return integration;
  }

  /**
   * Convert to plain object for persistence
   */
  toPersistence(): Record<string, any> {
    return {
      id: this._id.value,
      name: this.props.name,
      type: this.props.type,
      provider: this.props.provider,
      config: this.props.config,
      organizationId: this.props.organizationId,
      status: this.props.status,
      lastSync: this.props.lastSync?.toISOString() ?? null,
      lastError: this.props.lastError,
      category: this.props.category,
      description: this.props.description,
      settings: this.props.settings,
      isEnabled: this.props.isEnabled ?? true,
      createdAt: this.props.createdAt?.toISOString() ?? new Date().toISOString(),
      updatedAt: this.props.updatedAt?.toISOString() ?? null,
      createdBy: this.props.createdBy,
    };
  }
}

/**
 * Integration Created Event
 */
class IntegrationCreatedEvent extends DomainEvent {
  constructor(integrationId: string, name: string) {
    super();
    Object.assign(this, { integrationId, name });
  }

  getEventName(): string {
    return 'IntegrationCreated';
  }
}

/**
 * Integration Config Updated Event
 */
class IntegrationConfigUpdatedEvent extends DomainEvent {
  constructor(integrationId: string, name: string) {
    super();
    Object.assign(this, { integrationId, name });
  }

  getEventName(): string {
    return 'IntegrationConfigUpdated';
  }
}

/**
 * Integration Completed Event
 */
class IntegrationCompletedEvent extends DomainEvent {
  constructor(integrationId: string, name: string) {
    super();
    Object.assign(this, { integrationId, name });
  }

  getEventName(): string {
    return 'IntegrationCompleted';
  }
}

/**
 * Integration Failed Event
 */
class IntegrationFailedEvent extends DomainEvent {
  constructor(integrationId: string, name: string, error: string) {
    super();
    Object.assign(this, { integrationId, name, error });
  }

  getEventName(): string {
    return 'IntegrationFailed';
  }
}
