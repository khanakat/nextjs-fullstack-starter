import { ICacheRepository, CacheStatistics } from '../repositories/cache-repository';
import { CacheEntry } from '../entities/cache-entry';
import { CacheKey } from '../value-objects/cache-key';
import { CacheTTL } from '../value-objects/cache-ttl';
import { CacheTag } from '../value-objects/cache-tag';
import { Result } from '@/shared/application/base/result';

/**
 * Cache Service
 * Provides high-level cache management operations
 */
export interface ICacheService {
  /**
   * Get a value from cache
   */
  get(key: CacheKey): Promise<Result<string>>;

  /**
   * Get a value from cache and parse as JSON
   */
  getJSON<T = any>(key: CacheKey): Promise<Result<T>>;

  /**
   * Set a value in cache
   */
  set(key: CacheKey, value: string, ttl?: CacheTTL, tags?: CacheTag[]): Promise<Result<void>>;

  /**
   * Set a JSON value in cache
   */
  setJSON<T>(key: CacheKey, value: T, ttl?: CacheTTL, tags?: CacheTag[]): Promise<Result<void>>;

  /**
   * Get or set a value (cache-aside pattern)
   */
  getOrSet(
    key: CacheKey,
    factory: () => Promise<string>,
    ttl?: CacheTTL,
    tags?: CacheTag[]
  ): Promise<Result<string>>;

  /**
   * Get or set a JSON value (cache-aside pattern)
   */
  getOrSetJSON<T>(
    key: CacheKey,
    factory: () => Promise<T>,
    ttl?: CacheTTL,
    tags?: CacheTag[]
  ): Promise<Result<T>>;

  /**
   * Delete a value from cache
   */
  delete(key: CacheKey): Promise<Result<void>>;

  /**
   * Delete values by tag
   */
  deleteByTag(tag: CacheTag): Promise<Result<number>>;

  /**
   * Delete values by tags (any match)
   */
  deleteByTags(tags: CacheTag[]): Promise<Result<number>>;

  /**
   * Delete values by pattern
   */
  deleteByPattern(pattern: string): Promise<Result<number>>;

  /**
   * Clear all cache
   */
  clear(): Promise<Result<number>>;

  /**
   * Check if a key exists
   */
  exists(key: CacheKey): Promise<Result<boolean>>;

  /**
   * Get cache statistics
   */
  getStatistics(): Promise<Result<CacheStatistics>>;

  /**
   * Invalidate expired entries
   */
  invalidateExpired(): Promise<Result<number>>;

  /**
   * Warm up cache with multiple entries
   */
  warmUp(entries: Array<{ key: CacheKey; value: string; ttl?: CacheTTL; tags?: CacheTag[] }>): Promise<Result<void>>;

  /**
   * Get multiple values
   */
  getMany(keys: CacheKey[]): Promise<Result<Map<string, string>>>;

  /**
   * Set multiple values
   */
  setMany(entries: Array<{ key: CacheKey; value: string; ttl?: CacheTTL; tags?: CacheTag[] }>): Promise<Result<void>>;
}

export class CacheService implements ICacheService {
  constructor(private readonly cacheRepository: ICacheRepository) {}

  async get(key: CacheKey): Promise<Result<string>> {
    try {
      const entry = await this.cacheRepository.findByKey(key);

      if (!entry) {
        return Result.success('');
      }

      if (entry.isExpired()) {
        await this.cacheRepository.delete(key);
        return Result.success('');
      }

      entry.incrementHitCount();
      await this.cacheRepository.save(entry);

      return Result.success(entry.value);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  async getJSON<T = any>(key: CacheKey): Promise<Result<T>> {
    const result = await this.get(key);

    if (result.isFailure) {
      return Result.failure(result.error);
    }

    const value = result.value;
    if (!value) {
      return Result.success(null as any);
    }

    try {
      const parsed = JSON.parse(value) as T;
      return Result.success(parsed);
    } catch (error) {
      return Result.failure(new Error('Failed to parse cached value as JSON'));
    }
  }

  async set(key: CacheKey, value: string, ttl?: CacheTTL, tags: CacheTag[] = []): Promise<Result<void>> {
    try {
      const entry = CacheEntry.create({
        key,
        value,
        ttl: ttl ?? CacheTTL.ONE_HOUR,
        tags,
      });

      await this.cacheRepository.save(entry);
      return Result.success(undefined);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  async setJSON<T>(key: CacheKey, value: T, ttl?: CacheTTL, tags: CacheTag[] = []): Promise<Result<void>> {
    try {
      const jsonValue = JSON.stringify(value);
      return this.set(key, jsonValue, ttl, tags);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  async getOrSet(
    key: CacheKey,
    factory: () => Promise<string>,
    ttl?: CacheTTL,
    tags: CacheTag[] = []
  ): Promise<Result<string>> {
    try {
      const cachedResult = await this.get(key);

      if (cachedResult.isSuccess && cachedResult.value) {
        return cachedResult;
      }

      const value = await factory();
      return this.set(key, value, ttl, tags).then(() => Result.success(value));
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  async getOrSetJSON<T>(
    key: CacheKey,
    factory: () => Promise<T>,
    ttl?: CacheTTL,
    tags: CacheTag[] = []
  ): Promise<Result<T>> {
    try {
      const cachedResult = await this.getJSON<T>(key);

      if (cachedResult.isSuccess && cachedResult.value !== null) {
        return cachedResult;
      }

      const value = await factory();
      return this.setJSON(key, value, ttl, tags).then(() => Result.success(value));
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  async delete(key: CacheKey): Promise<Result<void>> {
    try {
      await this.cacheRepository.delete(key);
      return Result.success(undefined);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  async deleteByTag(tag: CacheTag): Promise<Result<number>> {
    try {
      const count = await this.cacheRepository.deleteByTag(tag);
      return Result.success(count);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  async deleteByTags(tags: CacheTag[]): Promise<Result<number>> {
    try {
      const count = await this.cacheRepository.deleteByTags(tags);
      return Result.success(count);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  async deleteByPattern(pattern: string): Promise<Result<number>> {
    try {
      const count = await this.cacheRepository.deleteByPattern(pattern);
      return Result.success(count);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  async clear(): Promise<Result<number>> {
    try {
      const count = await this.cacheRepository.clear();
      return Result.success(count);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  async exists(key: CacheKey): Promise<Result<boolean>> {
    try {
      const exists = await this.cacheRepository.exists(key);
      return Result.success(exists);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  async getStatistics(): Promise<Result<CacheStatistics>> {
    try {
      const stats = await this.cacheRepository.getStatistics();
      return Result.success(stats);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  async invalidateExpired(): Promise<Result<number>> {
    try {
      const expiredEntries = await this.cacheRepository.findExpired();

      let count = 0;
      for (const entry of expiredEntries) {
        await this.cacheRepository.delete(entry.key);
        count++;
      }

      return Result.success(count);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  async warmUp(
    entries: Array<{ key: CacheKey; value: string; ttl?: CacheTTL; tags?: CacheTag[] }>
  ): Promise<Result<void>> {
    try {
      const cacheEntries = entries.map(entry => ({
        key: entry.key,
        value: entry.value,
        ttl: entry.ttl ?? CacheTTL.ONE_HOUR,
        tags: entry.tags ?? [],
      }));

      await this.cacheRepository.setMany(cacheEntries);
      return Result.success(undefined);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  async getMany(keys: CacheKey[]): Promise<Result<Map<string, string>>> {
    try {
      const values = await this.cacheRepository.getMany(keys);
      return Result.success(values);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  async setMany(
    entries: Array<{ key: CacheKey; value: string; ttl?: CacheTTL; tags?: CacheTag[] }>
  ): Promise<Result<void>> {
    try {
      await this.cacheRepository.setMany(entries);
      return Result.success(undefined);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }
}

export type { CacheStatistics } from '../repositories/cache-repository';
