import { injectable } from 'inversify';
import { IQueryHandler } from '../../base/query-handler';
import { GetCacheStatisticsQuery } from '../queries/get-cache-statistics-query';
import { CacheService } from '../../../domain/caching/services/cache-service';
import { CacheStatisticsDto } from '../dtos/cache-statistics-dto';
import { Result } from '../../base/result';

/**
 * Get Cache Statistics Handler
 * Handles getting cache statistics
 */
@injectable()
export class GetCacheStatisticsHandler implements IQueryHandler<GetCacheStatisticsQuery, CacheStatisticsDto> {
  constructor(private readonly cacheService: CacheService) {}

  async handle(query: GetCacheStatisticsQuery): Promise<Result<CacheStatisticsDto>> {
    try {
      query.validate();

      const result = await this.cacheService.getStatistics();

      if (result.isFailure) {
        return Result.failure(result.error);
      }

      const stats = result.value;

      const dto = new CacheStatisticsDto(
        crypto.randomUUID(),
        new Date(),
        stats.totalEntries,
        stats.activeEntries,
        stats.expiredEntries,
        stats.totalHits,
        stats.totalMisses,
        stats.hitRate,
        stats.memoryUsage,
        stats.oldestEntry,
        stats.newestEntry,
        Object.fromEntries(stats.entriesByTag.entries())
      );

      return Result.success(dto);
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
