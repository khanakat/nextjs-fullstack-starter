import { injectable } from 'inversify';
import { CacheEntry } from '../../../domain/caching/entities/cache-entry';
import { CacheKey } from '../../../domain/caching/value-objects/cache-key';
import { CacheTTL } from '../../../domain/caching/value-objects/cache-ttl';
import { CacheTag } from '../../../domain/caching/value-objects/cache-tag';
import type { ICacheRepository, CacheSearchCriteria, CacheStatistics } from '../../../domain/caching/repositories/cache-repository';

/**
 * Redis Cache Repository
 * Implements cache data access using Redis
 * This is a placeholder implementation that can be extended with actual Redis integration
 */
@injectable()
export class RedisCacheRepository implements ICacheRepository {
  // In-memory storage for placeholder implementation
  private readonly storage = new Map<string, CacheEntry>();
  private readonly tagIndex = new Map<string, Set<string>>();

  async save(entry: CacheEntry): Promise<void> {
    const key = entry.key.getValue();
    this.storage.set(key, entry);

    // Update tag index
    for (const tag of entry.tags) {
      const tagKey = tag.getValue();
      if (!this.tagIndex.has(tagKey)) {
        this.tagIndex.set(tagKey, new Set());
      }
      this.tagIndex.get(tagKey)!.add(key);
    }
  }

  async findByKey(key: CacheKey): Promise<CacheEntry | null> {
    return this.storage.get(key.getValue()) ?? null;
  }

  async findByKeys(keys: CacheKey[]): Promise<Map<string, CacheEntry>> {
    const result = new Map<string, CacheEntry>();
    for (const key of keys) {
      const entry = await this.findByKey(key);
      if (entry) {
        result.set(key.getValue(), entry);
      }
    }
    return result;
  }

  async exists(key: CacheKey): Promise<boolean> {
    return this.storage.has(key.getValue());
  }

  async delete(key: CacheKey): Promise<void> {
    const keyStr = key.getValue();
    const entry = this.storage.get(keyStr);

    if (entry) {
      // Remove from tag index
      for (const tag of entry.tags) {
        const tagKey = tag.getValue();
        const keys = this.tagIndex.get(tagKey);
        if (keys) {
          keys.delete(keyStr);
          if (keys.size === 0) {
            this.tagIndex.delete(tagKey);
          }
        }
      }
    }

    this.storage.delete(keyStr);
  }

  async deleteMany(keys: CacheKey[]): Promise<number> {
    let count = 0;
    for (const key of keys) {
      await this.delete(key);
      count++;
    }
    return count;
  }

  async deleteByTag(tag: CacheTag): Promise<number> {
    const tagKey = tag.getValue();
    const keys = this.tagIndex.get(tagKey);

    if (!keys) {
      return 0;
    }

    let count = 0;
    for (const key of keys) {
      await this.delete(CacheKey.create(key));
      count++;
    }

    return count;
  }

  async deleteByTags(tags: CacheTag[]): Promise<number> {
    let count = 0;
    for (const tag of tags) {
      count += await this.deleteByTag(tag);
    }
    return count;
  }

  async deleteByPattern(pattern: string): Promise<number> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    let count = 0;

    for (const [key] of this.storage.entries()) {
      if (regex.test(key)) {
        await this.delete(CacheKey.create(key));
        count++;
      }
    }

    return count;
  }

  async clear(): Promise<number> {
    const count = this.storage.size;
    this.storage.clear();
    this.tagIndex.clear();
    return count;
  }

  async search(criteria: CacheSearchCriteria): Promise<CacheEntry[]> {
    let results = Array.from(this.storage.values());

    if (criteria.tags && criteria.tags.length > 0) {
      results = results.filter(entry =>
        entry.hasAnyTag(criteria.tags)
      );
    }

    if (criteria.pattern) {
      const regex = new RegExp(criteria.pattern.replace(/\*/g, '.*'));
      results = results.filter(entry => regex.test(entry.key.getValue()));
    }

    if (criteria.expiredBefore) {
      results = results.filter(entry =>
        entry.expiresAt && entry.expiresAt < criteria.expiredBefore!
      );
    }

    if (criteria.expiredAfter) {
      results = results.filter(entry =>
        entry.expiresAt && entry.expiresAt! > criteria.expiredAfter!
      );
    }

    if (criteria.createdBefore) {
      results = results.filter(entry => entry.createdAt < criteria.createdBefore!);
    }

    if (criteria.createdAfter) {
      results = results.filter(entry => entry.createdAt > criteria.createdAfter!);
    }

    if (criteria.minHitCount !== undefined) {
      results = results.filter(entry => entry.hitCount >= criteria.minHitCount!);
    }

    return results;
  }

  async findByTag(tag: CacheTag): Promise<CacheEntry[]> {
    const tagKey = tag.getValue();
    const keys = this.tagIndex.get(tagKey);

    if (!keys) {
      return [];
    }

    const entries: CacheEntry[] = [];
    for (const key of keys) {
      const entry = this.storage.get(key);
      if (entry) {
        entries.push(entry);
      }
    }

    return entries;
  }

  async findByTags(tags: CacheTag[]): Promise<CacheEntry[]> {
    const allEntries = Array.from(this.storage.values());
    return allEntries.filter(entry => entry.hasAnyTag(tags));
  }

  async findByPattern(pattern: string): Promise<CacheEntry[]> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return Array.from(this.storage.entries())
      .filter(([key]) => regex.test(key))
      .map(([, entry]) => entry);
  }

  async findExpired(): Promise<CacheEntry[]> {
    const now = new Date();
    return Array.from(this.storage.values()).filter(entry => entry.isExpired());
  }

  async findExpiringBefore(date: Date): Promise<CacheEntry[]> {
    return Array.from(this.storage.values()).filter(entry =>
      entry.expiresAt && entry.expiresAt < date
    );
  }

  async count(criteria: CacheSearchCriteria): Promise<number> {
    const results = await this.search(criteria);
    return results.length;
  }

  async countAll(): Promise<number> {
    return this.storage.size;
  }

  async countExpired(): Promise<number> {
    const expired = await this.findExpired();
    return expired.length;
  }

  async getStatistics(): Promise<CacheStatistics> {
    const entries = Array.from(this.storage.values());
    const now = new Date();

    const activeEntries = entries.filter(e => !e.isExpired());
    const expiredEntries = entries.filter(e => e.isExpired());

    const totalHits = entries.reduce((sum, e) => sum + e.hitCount, 0);
    const totalMisses = 0; // Would need to track misses separately

    const hitRate = totalHits + totalMisses > 0
      ? totalHits / (totalHits + totalMisses)
      : 0;

    const memoryUsage = JSON.stringify(Array.from(this.storage.entries())).length;

    const sortedByCreated = [...entries].sort((a, b) =>
      a.createdAt.getTime() - b.createdAt.getTime()
    );
    const oldestEntry = sortedByCreated[0]?.createdAt;
    const newestEntry = sortedByCreated[sortedByCreated.length - 1]?.createdAt;

    const entriesByTag = new Map<string, number>();
    for (const entry of entries) {
      for (const tag of entry.tags) {
        const tagKey = tag.getValue();
        entriesByTag.set(tagKey, (entriesByTag.get(tagKey) ?? 0) + 1);
      }
    }

    return {
      totalEntries: entries.length,
      activeEntries: activeEntries.length,
      expiredEntries: expiredEntries.length,
      totalHits,
      totalMisses,
      hitRate,
      memoryUsage,
      oldestEntry,
      newestEntry,
      entriesByTag,
    };
  }

  async getKeysByTag(tag: CacheTag): Promise<CacheKey[]> {
    const tagKey = tag.getValue();
    const keys = this.tagIndex.get(tagKey);

    if (!keys) {
      return [];
    }

    return Array.from(keys).map(k => CacheKey.create(k));
  }

  async getKeysByPattern(pattern: string): Promise<CacheKey[]> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return Array.from(this.storage.keys())
      .filter(key => regex.test(key))
      .map(k => CacheKey.create(k));
  }

  async getAllKeys(): Promise<CacheKey[]> {
    return Array.from(this.storage.keys()).map(k => CacheKey.create(k));
  }

  async increment(key: CacheKey, amount: number = 1): Promise<number> {
    const entry = await this.findByKey(key);

    if (!entry) {
      // Create new entry with counter value
      const newEntry = CacheEntry.create({
        key,
        value: amount.toString(),
        ttl: CacheTTL.NO_EXPIRATION,
        tags: [],
      });
      await this.save(newEntry);
      return amount;
    }

    const currentValue = parseInt(entry.value, 10);
    const newValue = currentValue + amount;
    entry.update(newValue.toString());
    await this.save(entry);
    return newValue;
  }

  async decrement(key: CacheKey, amount: number = 1): Promise<number> {
    return this.increment(key, -amount);
  }

  async getAndSet(key: CacheKey, value: string, ttl?: CacheTTL): Promise<string | null> {
    const existing = await this.findByKey(key);

    if (existing) {
      existing.incrementHitCount();
      await this.save(existing);
      return existing.value;
    }

    const newEntry = CacheEntry.create({
      key,
      value,
      ttl: ttl ?? CacheTTL.ONE_HOUR,
      tags: [],
    });
    await this.save(newEntry);
    return null;
  }

  async setIfNotExists(key: CacheKey, value: string, ttl?: CacheTTL): Promise<boolean> {
    const exists = await this.exists(key);

    if (exists) {
      return false;
    }

    const newEntry = CacheEntry.create({
      key,
      value,
      ttl: ttl ?? CacheTTL.ONE_HOUR,
      tags: [],
    });
    await this.save(newEntry);
    return true;
  }

  async getAndDelete(key: CacheKey): Promise<string | null> {
    const entry = await this.findByKey(key);

    if (!entry) {
      return null;
    }

    const value = entry.value;
    await this.delete(key);
    return value;
  }

  async setMany(entries: Array<{ key: CacheKey; value: string; ttl?: CacheTTL }>): Promise<void> {
    for (const { key, value, ttl } of entries) {
      const newEntry = CacheEntry.create({
        key,
        value,
        ttl: ttl ?? CacheTTL.ONE_HOUR,
        tags: [],
      });
      await this.save(newEntry);
    }
  }

  async getMany(keys: CacheKey[]): Promise<Map<string, string>> {
    const result = new Map<string, string>();
    for (const key of keys) {
      const entry = await this.findByKey(key);
      if (entry) {
        result.set(key.getValue(), entry.value);
      }
    }
    return result;
  }

  async extendTTL(key: CacheKey, ttl: CacheTTL): Promise<boolean> {
    const entry = await this.findByKey(key);

    if (!entry) {
      return false;
    }

    entry.update(ttl.isSet() ? entry.value : entry.value, ttl);
    await this.save(entry);
    return true;
  }

  async getTTL(key: CacheKey): Promise<number> {
    const entry = await this.findByKey(key);

    if (!entry) {
      return -1;
    }

    return entry.remainingTTL;
  }

  async isExpired(key: CacheKey): Promise<boolean> {
    const entry = await this.findByKey(key);

    if (!entry) {
      return true;
    }

    return entry.isExpired();
  }
}
