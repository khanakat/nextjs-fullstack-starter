/**
 * Base Domain Event class
 * Domain events represent something that happened in the domain
 */
export abstract class DomainEvent {
  public readonly occurredOn: Date;
  public readonly eventId: string;
  public readonly eventVersion: number;

  constructor();
  constructor(eventVersion: number);
  constructor(occurredOn: Date);
  constructor(eventName: string, aggregateId: string);
  constructor(eventName: string, aggregateId: string, data: any);
  constructor(
    eventVersionOrOccurredOnOrEventName?: number | Date | string,
    aggregateId?: string,
    data?: any
  ) {
    // Handle different constructor signatures for backward compatibility
    if (typeof eventVersionOrOccurredOnOrEventName === 'string') {
      // Constructor with eventName and aggregateId
      this.occurredOn = new Date();
      this.eventId = crypto.randomUUID();
      this.eventVersion = 1;
    } else if (eventVersionOrOccurredOnOrEventName instanceof Date) {
      // Constructor with occurredOn date
      this.occurredOn = eventVersionOrOccurredOnOrEventName;
      this.eventId = crypto.randomUUID();
      this.eventVersion = 1;
    } else {
      // Constructor with eventVersion or default
      this.occurredOn = new Date();
      this.eventId = crypto.randomUUID();
      this.eventVersion = eventVersionOrOccurredOnOrEventName || 1;
    }
  }

  abstract getEventName(): string;

  public get eventType(): string {
    return this.getEventName();
  }

  public getEventData(): Record<string, any> {
    return {
      eventId: this.eventId,
      eventName: this.getEventName(),
      occurredOn: this.occurredOn,
      eventVersion: this.eventVersion,
    };
  }

  public toString(): string {
    return `${this.getEventName()}(${this.eventId})`;
  }
}