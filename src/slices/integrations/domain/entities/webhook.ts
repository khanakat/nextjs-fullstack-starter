import { ValueObject } from '../../../../shared/domain/base/value-object';
import { DomainEvent } from '../../../../shared/domain/base/domain-event';
import { WebhookId } from '../value-objects/webhook-id';

/**
 * Webhook Status Enum
 */
export enum WebhookStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISABLED = 'disabled',
}

/**
 * Webhook Props Interface
 */
export interface WebhookProps {
  integrationId: string;
  url: string;
  events: string[]; // Array of event types this webhook listens to
  secret?: string; // For signature verification
  status: WebhookStatus;
  httpMethod?: string; // POST, PUT, etc.
  headers?: Record<string, string>; // Custom headers
  retryConfig?: string; // JSON string for retry configuration
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
}

/**
 * Webhook Aggregate Root
 * Represents a webhook configuration for an integration
 */
export class Webhook {
  private _domainEvents: DomainEvent[] = [];
  private constructor(private props: WebhookProps, private _id: WebhookId) {}

  // Getters
  get id(): WebhookId {
    return this._id;
  }

  get integrationId(): string {
    return this.props.integrationId;
  }

  get url(): string {
    return this.props.url;
  }

  get events(): string[] {
    return this.props.events;
  }

  get secret(): string | undefined {
    return this.props.secret;
  }

  get status(): WebhookStatus {
    return this.props.status;
  }

  get httpMethod(): string {
    return this.props.httpMethod ?? 'POST';
  }

  get headers(): Record<string, string> {
    return this.props.headers ?? {};
  }

  get retryConfig(): string | undefined {
    return this.props.retryConfig;
  }

  get isActive(): boolean {
    return this.props.isActive ?? this.props.status === WebhookStatus.ACTIVE;
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
   * Update webhook URL
   */
  updateUrl(url: string): void {
    if (url && url !== this.props.url) {
      this.props.url = url;
      this.props.updatedAt = new Date();
      this.addDomainEvent(new WebhookUpdatedEvent(
        this._id.value,
        this.props.integrationId
      ));
    }
  }

  /**
   * Update webhook events
   */
  updateEvents(events: string[]): void {
    if (events && events.length > 0) {
      this.props.events = events;
      this.props.updatedAt = new Date();
    }
  }

  /**
   * Activate webhook
   */
  activate(): void {
    if (this.props.status !== WebhookStatus.ACTIVE) {
      this.props.status = WebhookStatus.ACTIVE;
      this.props.isActive = true;
      this.props.updatedAt = new Date();
      this.addDomainEvent(new WebhookActivatedEvent(
        this._id.value,
        this.props.integrationId
      ));
    }
  }

  /**
   * Deactivate webhook
   */
  deactivate(): void {
    if (this.props.status === WebhookStatus.ACTIVE) {
      this.props.status = WebhookStatus.INACTIVE;
      this.props.isActive = false;
      this.props.updatedAt = new Date();
      this.addDomainEvent(new WebhookDeactivatedEvent(
        this._id.value,
        this.props.integrationId
      ));
    }
  }

  /**
   * Disable webhook
   */
  disable(): void {
    if (this.props.status !== WebhookStatus.DISABLED) {
      this.props.status = WebhookStatus.DISABLED;
      this.props.isActive = false;
      this.props.updatedAt = new Date();
    }
  }

  /**
   * Regenerate webhook secret
   */
  regenerateSecret(newSecret: string): void {
    this.props.secret = newSecret;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new WebhookSecretRegeneratedEvent(
      this._id.value,
      this.props.integrationId
    ));
  }

  /**
   * Update retry configuration
   */
  updateRetryConfig(retryConfig: Record<string, any>): void {
    this.props.retryConfig = JSON.stringify(retryConfig);
    this.props.updatedAt = new Date();
  }

  /**
   * Check if webhook is active
   */
  isWebhookActive(): boolean {
    return this.props.status === WebhookStatus.ACTIVE;
  }

  /**
   * Check if webhook listens to a specific event
   */
  listensToEvent(event: string): boolean {
    return this.props.events.includes(event);
  }

  /**
   * Get retry configuration as object
   */
  getRetryConfigAsObject(): any {
    try {
      return this.props.retryConfig ? JSON.parse(this.props.retryConfig) : {};
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
   * Create a new Webhook (factory method)
   */
  static create(props: WebhookProps): Webhook {
    const webhook = new Webhook(props, WebhookId.create());
    webhook.addDomainEvent(new WebhookCreatedEvent(
      webhook._id.value,
      props.integrationId,
      props.url
    ));
    return webhook;
  }

  /**
   * Reconstitute Webhook from persistence (factory method)
   */
  static reconstitute(id: WebhookId, props: WebhookProps): Webhook {
    const webhook = new Webhook(props, id);
    return webhook;
  }

  /**
   * Convert to plain object for persistence
   */
  toPersistence(): Record<string, any> {
    return {
      id: this._id.value,
      integrationId: this.props.integrationId,
      url: this.props.url,
      events: this.props.events,
      secret: this.props.secret,
      status: this.props.status,
      httpMethod: this.props.httpMethod,
      headers: JSON.stringify(this.props.headers),
      retryConfig: this.props.retryConfig,
      isActive: this.isActive,
      createdAt: this.props.createdAt?.toISOString() ?? new Date().toISOString(),
      updatedAt: this.props.updatedAt?.toISOString() ?? null,
      createdBy: this.props.createdBy,
    };
  }
}

/**
 * Webhook Created Event
 */
class WebhookCreatedEvent extends DomainEvent {
  constructor(webhookId: string, integrationId: string, url: string) {
    super();
    Object.assign(this, { webhookId, integrationId, url });
  }

  getEventName(): string {
    return 'WebhookCreated';
  }
}

/**
 * Webhook Updated Event
 */
class WebhookUpdatedEvent extends DomainEvent {
  constructor(webhookId: string, integrationId: string) {
    super();
    Object.assign(this, { webhookId, integrationId });
  }

  getEventName(): string {
    return 'WebhookUpdated';
  }
}

/**
 * Webhook Activated Event
 */
class WebhookActivatedEvent extends DomainEvent {
  constructor(webhookId: string, integrationId: string) {
    super();
    Object.assign(this, { webhookId, integrationId });
  }

  getEventName(): string {
    return 'WebhookActivated';
  }
}

/**
 * Webhook Deactivated Event
 */
class WebhookDeactivatedEvent extends DomainEvent {
  constructor(webhookId: string, integrationId: string) {
    super();
    Object.assign(this, { webhookId, integrationId });
  }

  getEventName(): string {
    return 'WebhookDeactivated';
  }
}

/**
 * Webhook Secret Regenerated Event
 */
class WebhookSecretRegeneratedEvent extends DomainEvent {
  constructor(webhookId: string, integrationId: string) {
    super();
    Object.assign(this, { webhookId, integrationId });
  }

  getEventName(): string {
    return 'WebhookSecretRegenerated';
  }
}
