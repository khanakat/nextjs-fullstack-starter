import { DomainEvent } from './domain-event';

/**
 * Base Entity class following DDD principles
 * All domain entities should extend this class
 */
export abstract class Entity<T> {
  protected readonly _id: T;
  protected _domainEvents: DomainEvent[] = [];

  constructor(id: T) {
    this._id = id;
  }

  get id(): T {
    return this._id;
  }

  get domainEvents(): DomainEvent[] {
    return this._domainEvents;
  }

  protected addDomainEvent(domainEvent: DomainEvent): void {
    this._domainEvents.push(domainEvent);
  }

  public clearEvents(): void {
    this._domainEvents = [];
  }

  public equals(entity: Entity<T>): boolean {
    if (!(entity instanceof Entity)) {
      return false;
    }
    const thisId: any = this._id as any;
    const otherId: any = entity._id as any;
    if (thisId && typeof thisId.equals === 'function') {
      try {
        return thisId.equals(otherId);
      } catch {
        // fall through to strict equality
      }
    }
    return this._id === entity._id;
  }

  public toString(): string {
    return `${this.constructor.name}(${this._id})`;
  }
}