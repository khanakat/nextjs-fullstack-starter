import { Entity } from './entity';
import { DomainEvent } from './domain-event';

/**
 * Base Aggregate Root class following DDD principles
 * Aggregate roots are the only entities that can be directly accessed from outside
 */
export abstract class AggregateRoot<T> extends Entity<T> {
  private _version: number = 0;

  get version(): number {
    return this._version;
  }

  protected incrementVersion(): void {
    this._version++;
  }

  public markEventsAsCommitted(): void {
    this.clearEvents();
    this.incrementVersion();
  }

  /**
   * Adds a domain event and increments version
   */
  protected addDomainEvent(domainEvent: DomainEvent): void {
    super.addDomainEvent(domainEvent);
    this.incrementVersion();
  }

  /**
   * Gets uncommitted domain events
   */
  public getUncommittedEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  /**
   * Checks if the aggregate has uncommitted events
   */
  public hasUncommittedEvents(): boolean {
    return this._domainEvents.length > 0;
  }
}