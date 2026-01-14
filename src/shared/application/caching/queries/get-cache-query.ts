import { Query } from '../../base/query';

/**
 * Get Cache Query
 * Query to get a value from cache
 */
export class GetCacheQuery extends Query {
  constructor(
    public readonly key: string,
    userId?: string
  ) {
    super(userId);
  }

  public validate(): void {
    if (!this.key || typeof this.key !== 'string') {
      throw new Error('Cache key is required and must be a string');
    }
  }
}
