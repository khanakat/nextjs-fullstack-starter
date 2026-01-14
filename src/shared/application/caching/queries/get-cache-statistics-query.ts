import { Query } from '../../base/query';

/**
 * Get Cache Statistics Query
 * Query to get cache statistics
 */
export class GetCacheStatisticsQuery extends Query {
  constructor(userId?: string) {
    super(userId);
  }

  public validate(): void {
    // No validation needed for statistics query
  }
}
