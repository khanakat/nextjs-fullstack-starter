import { injectable } from 'inversify';
import { IQueryHandler } from '../../base/query-handler';
import { GetCacheQuery } from '../queries/get-cache-query';
import { CacheService } from '../../../domain/caching/services/cache-service';
import { CacheKey } from '../../../domain/caching/value-objects/cache-key';
import { Result } from '../../base/result';

/**
 * Get Cache Handler
 * Handles getting a value from cache
 */
@injectable()
export class GetCacheHandler implements IQueryHandler<GetCacheQuery, string> {
  constructor(private readonly cacheService: CacheService) {}

  async handle(query: GetCacheQuery): Promise<Result<string>> {
    try {
      query.validate();

      const key = CacheKey.create(query.key);
      const result = await this.cacheService.get(key);

      if (result.isFailure) {
        return Result.failure(result.error);
      }

      return Result.success(result.value);
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
