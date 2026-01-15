import { CacheEntry } from '../entities/cache-entry';
import { CacheKey } from '../value-objects/cache-key';
import { CacheTTL } from '../value-objects/cache-ttl';
import { CacheTag } from '../value-objects/cache-tag';

export interface CacheSearchCriteria {
  tags?: CacheTag[];
  pattern?: string;
  expiredBefore?: Date;
  expiredAfter?: Date;
  createdBefore?: Date;
  createdAfter?: Date;
  minHitCount?: number;
}

export interface ICacheRepository {
  /**
   * Save a cache entry
   */
  save(entry: CacheEntry): Promise<void>;

  /**
   * Find cache entry by key
   */
  findByKey(key: CacheKey): Promise<CacheEntry | null>;

  /**
   * Find multiple cache entries by keys
   */
  findByKeys(keys: CacheKey[]): Promise<Map<string, CacheEntry>>;

  /**
   * Check if a cache entry exists
   */
  exists(key: CacheKey): Promise<boolean>;

  /**
   * Delete a cache entry by key
   */
  delete(key: CacheKey): Promise<void>;

  /**
   * Delete multiple cache entries by keys
   */
  deleteMany(keys: CacheKey[]): Promise<number>;

  /**
   * Delete cache entries by tag
   */
  deleteByTag(tag: CacheTag): Promise<number>;

  /**
   * Delete cache entries by tags (any match)
   */
  deleteByTags(tags: CacheTag[]): Promise<number>;

  /**
   * Delete cache entries by pattern
   */
  deleteByPattern(pattern: string): Promise<number>;

  /**
   * Clear all cache entries
   */
  clear(): Promise<number>;

  /**
   * Search cache entries with criteria
   */
  search(criteria: CacheSearchCriteria): Promise<CacheEntry[]>;

  /**
   * Find cache entries by tag
   */
  findByTag(tag: CacheTag): Promise<CacheEntry[]>;

  /**
   * Find cache entries by tags (any match)
   */
  findByTags(tags: CacheTag[]): Promise<CacheEntry[]>;

  /**
   * Find cache entries by pattern
   */
  findByPattern(pattern: string): Promise<CacheEntry[]>;

  /**
   * Find expired cache entries
   */
  findExpired(): Promise<CacheEntry[]>;

  /**
   * Find cache entries expiring before a date
   */
  findExpiringBefore(date: Date): Promise<CacheEntry[]>;

  /**
   * Count cache entries with criteria
   */
  count(criteria: CacheSearchCriteria): Promise<number>;

  /**
   * Count all cache entries
   */
  countAll(): Promise<number>;

  /**
   * Count expired cache entries
   */
  countExpired(): Promise<number>;

  /**
   * Get cache statistics
   */
  getStatistics(): Promise<CacheStatistics>;

  /**
   * Get cache keys by tag
   */
  getKeysByTag(tag: CacheTag): Promise<CacheKey[]>;

  /**
   * Get cache keys by pattern
   */
  getKeysByPattern(pattern: string): Promise<CacheKey[]>;

  /**
   * Get all cache keys
   */
  getAllKeys(): Promise<CacheKey[]>;

  /**
   * Increment a counter value in cache
   */
  increment(key: CacheKey, amount: number): Promise<number>;

  /**
   * Decrement a counter value in cache
   */
  decrement(key: CacheKey, amount: number): Promise<number>;

  /**
   * Get and set a value atomically
   */
  getAndSet(key: CacheKey, value: string, ttl?: CacheTTL): Promise<string | null>;

  /**
   * Set if not exists
   */
  setIfNotExists(key: CacheKey, value: string, ttl?: CacheTTL): Promise<boolean>;

  /**
   * Get and delete
   */
  getAndDelete(key: CacheKey): Promise<string | null>;

  /**
   * Set multiple values
   */
  setMany(entries: Array<{ key: CacheKey; value: string; ttl?: CacheTTL }>): Promise<void>;

  /**
   * Get multiple values
   */
  getMany(keys: CacheKey[]): Promise<Map<string, string>>;

  /**
   * Extend TTL for a key
   */
  extendTTL(key: CacheKey, ttl: CacheTTL): Promise<boolean>;

  /**
   * Get remaining TTL for a key
   */
  getTTL(key: CacheKey): Promise<number>;

  /**
   * Check if a key is expired
   */
  isExpired(key: CacheKey): Promise<boolean>;
}

export interface CacheStatistics {
  totalEntries: number;
  activeEntries: number;
  expiredEntries: number;
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  memoryUsage: number;
  oldestEntry?: Date;
  newestEntry?: Date;
  entriesByTag: Map<string, number>;
}
