import { Command } from '../../base/command';
import { CacheTTL } from '../../../domain/caching/value-objects/cache-ttl';
import { CacheTag } from '../../../domain/caching/value-objects/cache-tag';

/**
 * Set Cache Command
 * Command to set a value in cache
 */
export class SetCacheCommand extends Command {
  constructor(
    public readonly key: string,
    public readonly value: string,
    public readonly ttl?: number,
    public readonly tags?: string[],
    userId?: string
  ) {
    super(userId);
  }

  public validate(): void {
    if (!this.key || typeof this.key !== 'string') {
      throw new Error('Cache key is required and must be a string');
    }
    if (!this.value || typeof this.value !== 'string') {
      throw new Error('Cache value is required and must be a string');
    }
    if (this.ttl !== undefined && (typeof this.ttl !== 'number' || this.ttl < 0)) {
      throw new Error('Cache TTL must be a non-negative number');
    }
    if (this.tags && !Array.isArray(this.tags)) {
      throw new Error('Cache tags must be an array');
    }
  }

  public getTTL(): CacheTTL | undefined {
    return this.ttl !== undefined ? CacheTTL.fromSeconds(this.ttl) : undefined;
  }

  public getTags(): CacheTag[] {
    return this.tags?.map(tag => CacheTag.create(tag)) ?? [];
  }
}
