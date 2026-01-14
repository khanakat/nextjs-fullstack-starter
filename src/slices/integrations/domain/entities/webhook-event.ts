import { ValueObject } from '../../../../shared/domain/base/value-object';
import { DomainEvent } from '../../../../shared/domain/base/domain-event';
import { WebhookEventId } from '../value-objects/webhook-event-id';

/**
 * Webhook Event Status Enum
 */
export enum WebhookEventStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

/**
 * Webhook Event Props Interface
 */
export interface WebhookEventProps {
  integrationId: string;
  webhookId?: string | null;
  action: string; // e.g., 'webhook_delivery', 'test_sent', 'sync_started'
  status: WebhookEventStatus;
  requestData?: string; // JSON string
  responseData?: string; // JSON string
  errorDetails?: string; // JSON string
  timestamp?: Date;
  duration?: number; // in milliseconds
  retryCount?: number;
  statusCode?: number; // HTTP status code
}

/**
 * Webhook Event Aggregate Root
 * Represents a webhook delivery event/log
 */
export class WebhookEvent {
  private _domainEvents: DomainEvent[] = [];
  private constructor(private props: WebhookEventProps, private _id: WebhookEventId) {}

  // Getters
  get id(): WebhookEventId {
    return this._id;
  }

  get integrationId(): string {
    return this.props.integrationId;
  }

  get webhookId(): string | null {
    return this.props.webhookId ?? null;
  }

  get action(): string {
    return this.props.action;
  }

  get status(): WebhookEventStatus {
    return this.props.status;
  }

  get requestData(): string | undefined {
    return this.props.requestData;
  }

  get responseData(): string | undefined {
    return this.props.responseData;
  }

  get errorDetails(): string | undefined {
    return this.props.errorDetails;
  }

  get timestamp(): Date {
    return this.props.timestamp ?? new Date();
  }

  get duration(): number | undefined {
    return this.props.duration;
  }

  get retryCount(): number {
    return this.props.retryCount ?? 0;
  }

  get statusCode(): number | undefined {
    return this.props.statusCode;
  }

  // Business Methods

  /**
   * Mark event as successful
   */
  markAsSuccess(responseData?: any, statusCode?: number): void {
    this.props.status = WebhookEventStatus.SUCCESS;
    if (responseData) {
      this.props.responseData = JSON.stringify(responseData);
    }
    if (statusCode) {
      this.props.statusCode = statusCode;
    }
    this.calculateDuration();
  }

  /**
   * Mark event as failed
   */
  markAsFailed(errorDetails: any, statusCode?: number): void {
    this.props.status = WebhookEventStatus.FAILED;
    this.props.errorDetails = typeof errorDetails === 'string'
      ? errorDetails
      : JSON.stringify(errorDetails);
    if (statusCode) {
      this.props.statusCode = statusCode;
    }
    this.calculateDuration();
  }

  /**
   * Increment retry count
   */
  incrementRetry(): void {
    this.props.retryCount = (this.props.retryCount ?? 0) + 1;
  }

  /**
   * Calculate event duration
   */
  private calculateDuration(): void {
    if (this.props.timestamp) {
      this.props.duration = Date.now() - this.props.timestamp.getTime();
    }
  }

  /**
   * Check if event is pending
   */
  isPending(): boolean {
    return this.props.status === WebhookEventStatus.PENDING;
  }

  /**
   * Check if event was successful
   */
  isSuccessful(): boolean {
    return this.props.status === WebhookEventStatus.SUCCESS;
  }

  /**
   * Check if event failed
   */
  isFailed(): boolean {
    return this.props.status === WebhookEventStatus.FAILED;
  }

  /**
   * Check if event can be retried
   */
  canRetry(maxRetries: number = 3): boolean {
    return this.isFailed() && this.props.retryCount! < maxRetries;
  }

  /**
   * Get request data as object
   */
  getRequestDataAsObject(): any {
    try {
      return this.props.requestData ? JSON.parse(this.props.requestData) : {};
    } catch {
      return {};
    }
  }

  /**
   * Get response data as object
   */
  getResponseDataAsObject(): any {
    try {
      return this.props.responseData ? JSON.parse(this.props.responseData) : {};
    } catch {
      return {};
    }
  }

  /**
   * Get error details as object
   */
  getErrorDetailsAsObject(): any {
    try {
      return this.props.errorDetails ? JSON.parse(this.props.errorDetails) : {};
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
   * Create a new Webhook Event (factory method)
   */
  static create(props: WebhookEventProps): WebhookEvent {
    const webhookEvent = new WebhookEvent(props, WebhookEventId.create());
    webhookEvent.addDomainEvent(new WebhookEventCreatedEvent(
      webhookEvent._id.value,
      props.integrationId,
      props.action
    ));
    return webhookEvent;
  }

  /**
   * Reconstitute Webhook Event from persistence (factory method)
   */
  static reconstitute(id: WebhookEventId, props: WebhookEventProps): WebhookEvent {
    const webhookEvent = new WebhookEvent(props, id);
    return webhookEvent;
  }

  /**
   * Convert to plain object for persistence
   */
  toPersistence(): Record<string, any> {
    return {
      id: this._id.value,
      integrationId: this.props.integrationId,
      webhookId: this.props.webhookId,
      action: this.props.action,
      status: this.props.status,
      requestData: this.props.requestData,
      responseData: this.props.responseData,
      errorDetails: this.props.errorDetails,
      timestamp: this.props.timestamp?.toISOString() ?? new Date().toISOString(),
      duration: this.props.duration,
      retryCount: this.props.retryCount ?? 0,
      statusCode: this.props.statusCode,
    };
  }
}

/**
 * Webhook Event Created Event
 */
class WebhookEventCreatedEvent extends DomainEvent {
  constructor(eventId: string, integrationId: string, action: string) {
    super();
    Object.assign(this, { eventId, integrationId, action });
  }

  getEventName(): string {
    return 'WebhookEventCreated';
  }
}
