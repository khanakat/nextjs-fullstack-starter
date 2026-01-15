import { DomainEvent } from '../../base/domain-event';
import { CacheEntry } from '../entities/cache-entry';

/**
 * Cache Entry Created Event
 * Emitted when a new cache entry is created
 */
export class CacheEntryCreatedEvent extends DomainEvent {
  constructor(public readonly cacheEntry: CacheEntry) {
    super();
  }

  get aggregateId(): string {
    return this.cacheEntry.key.getValue();
  }

  getEventName(): string {
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
  }

  get aggregateId(): string {
    return this.cacheEntry.key.getValue();
  }

  getEventName(): string {
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
  }

  get aggregateId(): string {
    return this.cacheEntry.key.getValue();
  }

  getEventName(): string {
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
  }

  get aggregateId(): string {
    return this.cacheEntry.key.getValue();
  }

  getEventName(): string {
    return 'CacheEntryExpired';
  }
}

/**
 * Cache Invalidated Event
 * Emitted when cache entries are invalidated by tag or pattern
 */
export class CacheInvalidatedEvent extends DomainEvent {
  constructor(
    public readonly count: number,
    public readonly tag?: string,
    public readonly pattern?: string
  ) {
    super();
  }

  get aggregateId(): string {
    return this.tag || this.pattern || 'global';
  }

  getEventName(): string {
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
  }

  get aggregateId(): string {
    return 'global';
  }

  getEventName(): string {
    return 'CacheCleared';
  }
}
