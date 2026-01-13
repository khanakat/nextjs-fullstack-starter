import { DomainEvent } from '../../domain/base/domain-event';

/**
 * Event Bus Symbol for DI container
 */
export const EventBusSymbol = Symbol.for('EventBus');

/**
 * Interface for event bus
 * Provides mechanism to publish and subscribe to domain events
 */
export interface IEventBus {
  /**
   * Publish a domain event to all subscribers
   */
  publish<T extends DomainEvent>(event: T): Promise<void>;

  /**
   * Subscribe to a specific event type
   * Returns an unsubscribe function
   */
  subscribe(
    eventType: string,
    handler: (event: DomainEvent) => Promise<void> | void
  ): () => void;

  /**
   * Subscribe to all domain events
   * Returns an unsubscribe function
   */
  subscribeAll(handler: (event: DomainEvent) => Promise<void> | void): () => void;

  /**
   * Clear all subscribers
   */
  clear(): void;
}

/**
 * Unsubscribe function type
 */
export type UnsubscribeFunction = () => void;

/**
 * In-memory implementation of the event bus
 * Stores subscribers in memory and dispatches events synchronously
 */
export class InMemoryEventBus implements IEventBus {
  private subscribers: Map<string, Set<(event: DomainEvent) => Promise<void> | void>> = new Map();
  private allSubscribers: Set<(event: DomainEvent) => Promise<void> | void> = new Set();

  async publish<T extends DomainEvent>(event: T): Promise<void> {
    // Get the event type from the event constructor name
    const eventType = event.constructor.name;

    // Notify type-specific subscribers
    const typeSubscribers = this.subscribers.get(eventType);
    if (typeSubscribers) {
      for (const handler of typeSubscribers) {
        await handler(event);
      }
    }

    // Notify all-subscribers
    for (const handler of this.allSubscribers) {
      await handler(event);
    }
  }

  subscribe(
    eventType: string,
    handler: (event: DomainEvent) => Promise<void> | void
  ): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    this.subscribers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      const subscribers = this.subscribers.get(eventType);
      if (subscribers) {
        subscribers.delete(handler);
        if (subscribers.size === 0) {
          this.subscribers.delete(eventType);
        }
      }
    };
  }

  subscribeAll(handler: (event: DomainEvent) => Promise<void> | void): () => void {
    this.allSubscribers.add(handler);

    // Return unsubscribe function
    return () => {
      this.allSubscribers.delete(handler);
    };
  }

  clear(): void {
    this.subscribers.clear();
    this.allSubscribers.clear();
  }
}

/**
 * Global event bus instance
 * This is a singleton instance used throughout the application
 */
let globalEventBus: IEventBus | null = null;

/**
 * Get the global event bus instance
 * Creates a new InMemoryEventBus if one doesn't exist
 */
export function getEventBus(): IEventBus {
  if (!globalEventBus) {
    globalEventBus = new InMemoryEventBus();
  }
  return globalEventBus;
}

/**
 * Reset the global event bus instance
 * Useful for testing
 */
export function resetEventBus(): void {
  globalEventBus = null;
}
