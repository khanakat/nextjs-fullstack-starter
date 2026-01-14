import { DomainEvent } from '../../base/domain-event';
import { CacheEntry } from '../entities/cache-entry';

/**
 * Cache Entry Created Event
 * Emitted when a new cache entry is created
 */
export class CacheEntryCreatedEvent extends DomainEvent {
  constructor(public readonly cacheEntry: CacheEntry) {
    super();
    this.occurredOn = new Date();
  }

  get aggregateId(): string {
    return this.cacheEntry.key.getValue();
  }

  get eventType(): string {
    return 'CacheEntryCreated';
  }
}

/**
 * Cache Entry Updated Event
 * Emitted when a cache entry is updated
 */
export class CacheEntryUpdatedEvent extends DomainEvent {
  constructor(public readonly cacheEntry: CacheEntry) {
    super();
    this.occurredOn = new Date();
  }

  get aggregateId(): string {
    return this.cacheEntry.key.getValue();
  }

  get eventType(): string {
    return 'CacheEntryUpdated';
  }
}

/**
 * Cache Entry Deleted Event
 * Emitted when a cache entry is deleted
 */
export class CacheEntryDeletedEvent extends DomainEvent {
  constructor(public readonly cacheEntry: CacheEntry) {
    super();
    this.occurredOn = new Date();
  }

  get aggregateId(): string {
    return this.cacheEntry.key.getValue();
  }

  get eventType(): string {
    return 'CacheEntryDeleted';
  }
}

/**
 * Cache Entry Expired Event
 * Emitted when a cache entry expires
 */
export class CacheEntryExpiredEvent extends DomainEvent {
  constructor(public readonly cacheEntry: CacheEntry) {
    super();
    this.occurredOn = new Date();
  }

  get aggregateId(): string {
    return this.cacheEntry.key.getValue();
  }

  get eventType(): string {
    return 'CacheEntryExpired';
  }
}

/**
 * Cache Invalidated Event
 * Emitted when cache entries are invalidated by tag or pattern
 */
export class CacheInvalidatedEvent extends DomainEvent {
  constructor(
    public readonly tag?: string,
    public readonly pattern?: string,
    public readonly count: number
  ) {
    super();
    this.occurredOn = new Date();
  }

  get aggregateId(): string {
    return this.tag || this.pattern || 'global';
  }

  get eventType(): string {
    return 'CacheInvalidated';
  }
}

/**
 * Cache Cleared Event
 * Emitted when the entire cache is cleared
 */
export class CacheClearedEvent extends DomainEvent {
  constructor(public readonly count: number) {
    super();
    this.occurredOn = new Date();
  }

  get aggregateId(): string {
    return 'global';
  }

  get eventType(): string {
    return 'CacheCleared';
  }
}
