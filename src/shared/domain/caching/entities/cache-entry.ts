import { Entity } from '../../base/entity';
import { CacheKey } from '../value-objects/cache-key';
import { CacheTTL } from '../value-objects/cache-ttl';
import { CacheTag } from '../value-objects/cache-tag';
import { CacheEntryCreatedEvent, CacheEntryUpdatedEvent, CacheEntryDeletedEvent, CacheEntryExpiredEvent } from '../events/cache-events';

/**
 * Cache Entry Entity
 * Represents a cached data entry with metadata
 */
export interface CacheEntryProps {
  key: CacheKey;
  value: string;
  ttl: CacheTTL;
  tags: CacheTag[];
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  hitCount: number;
  metadata?: Record<string, any>;
}

export class CacheEntry extends Entity<CacheKey> {
  private _value: string;
  private _ttl: CacheTTL;
  private _tags: CacheTag[];
  private _createdAt: Date;
  private _updatedAt: Date;
  private _expiresAt?: Date;
  private _hitCount: number;
  private _metadata?: Record<string, any>;

  constructor(props: CacheEntryProps) {
    super(props.key);
    this._value = props.value;
    this._ttl = props.ttl;
    this._tags = [...props.tags];
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this._expiresAt = props.expiresAt;
    this._hitCount = props.hitCount;
    this._metadata = props.metadata;

    // Emit created event
    this.addDomainEvent(new CacheEntryCreatedEvent(this));
  }

  public static create(props: Omit<CacheEntryProps, 'createdAt' | 'updatedAt' | 'hitCount'>): CacheEntry {
    const now = new Date();
    const expiresAt = props.ttl.isSet() ? props.ttl.toExpirationDate() : undefined;

    return new CacheEntry({
      ...props,
      createdAt: now,
      updatedAt: now,
      hitCount: 0,
      expiresAt,
    });
  }

  /**
   * Update the cached value
   */
  public update(value: string, ttl?: CacheTTL): void {
    this._value = value;
    if (ttl) {
      this._ttl = ttl;
      this._expiresAt = ttl.isSet() ? ttl.toExpirationDate() : undefined;
    }
    this._updatedAt = new Date();
    this.addDomainEvent(new CacheEntryUpdatedEvent(this));
  }

  /**
   * Increment hit count
   */
  public incrementHitCount(): void {
    this._hitCount++;
    this._updatedAt = new Date();
  }

  /**
   * Mark as expired
   */
  public expire(): void {
    this._expiresAt = new Date();
    this.addDomainEvent(new CacheEntryExpiredEvent(this));
  }

  /**
   * Delete the cache entry
   */
  public delete(): void {
    this.addDomainEvent(new CacheEntryDeletedEvent(this));
  }

  /**
   * Check if the entry is expired
   */
  public isExpired(): boolean {
    if (!this._expiresAt) {
      return false;
    }
    return new Date() > this._expiresAt;
  }

  /**
   * Check if the entry has a specific tag
   */
  public hasTag(tag: CacheTag): boolean {
    return this._tags.some(t => t.equals(tag));
  }

  /**
   * Check if the entry has any of the specified tags
   */
  public hasAnyTag(tags: CacheTag[]): boolean {
    return tags.some(tag => this.hasTag(tag));
  }

  /**
   * Add a tag to the entry
   */
  public addTag(tag: CacheTag): void {
    if (!this.hasTag(tag)) {
      this._tags.push(tag);
      this._updatedAt = new Date();
    }
  }

  /**
   * Remove a tag from the entry
   */
  public removeTag(tag: CacheTag): void {
    this._tags = this._tags.filter(t => !t.equals(tag));
    this._updatedAt = new Date();
  }

  /**
   * Update metadata
   */
  public updateMetadata(metadata: Record<string, any>): void {
    this._metadata = { ...this._metadata, ...metadata };
    this._updatedAt = new Date();
  }

  // Getters
  public get key(): CacheKey {
    return this._id;
  }

  public get value(): string {
    return this._value;
  }

  public get ttl(): CacheTTL {
    return this._ttl;
  }

  public get tags(): CacheTag[] {
    return [...this._tags];
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public get expiresAt(): Date | undefined {
    return this._expiresAt;
  }

  public get hitCount(): number {
    return this._hitCount;
  }

  public get metadata(): Record<string, any> | undefined {
    return this._metadata ? { ...this._metadata } : undefined;
  }

  /**
   * Get remaining time to live in seconds
   */
  public get remainingTTL(): number {
    if (!this._expiresAt) {
      return 0; // No expiration
    }
    const remaining = Math.max(0, Math.floor((this._expiresAt.getTime() - Date.now()) / 1000));
    return remaining;
  }

  /**
   * Get age of the cache entry in seconds
   */
  public get age(): number {
    return Math.floor((Date.now() - this._createdAt.getTime()) / 1000);
  }

  /**
   * Get time since last update in seconds
   */
  public get timeSinceUpdate(): number {
    return Math.floor((Date.now() - this._updatedAt.getTime()) / 1000);
  }

  /**
   * Check if the entry should be refreshed based on age
   */
  public shouldRefresh(thresholdSeconds: number): boolean {
    return this.timeSinceUpdate > thresholdSeconds;
  }

  /**
   * Get the cache key as a string
   */
  public getKeyString(): string {
    return this._id.getValue();
  }

  /**
   * Get the cache value as parsed JSON
   */
  public getValueAsJSON<T = any>(): T | null {
    try {
      return JSON.parse(this._value) as T;
    } catch {
      return null;
    }
  }

  /**
   * Check if the value is valid JSON
   */
  public isJSON(): boolean {
    try {
      JSON.parse(this._value);
      return true;
    } catch {
      return false;
    }
  }

  public toString(): string {
    return `CacheEntry(key=${this._id}, hits=${this._hitCount}, expired=${this.isExpired()})`;
  }
}
