import { injectable } from 'inversify';
import { ICommandHandler } from '../../base/command-handler';
import { ClearCacheCommand } from '../commands/clear-cache-command';
import { CacheService } from '../../../domain/caching/services/cache-service';
import { Result } from '../../base/result';

/**
 * Clear Cache Handler
 * Handles clearing all cache entries
 */
@injectable()
export class ClearCacheHandler implements ICommandHandler<ClearCacheCommand, number> {
  constructor(private readonly cacheService: CacheService) {}

  async handle(command: ClearCacheCommand): Promise<Result<number>> {
    try {
      command.validate();

      const result = await this.cacheService.clear();

      if (result.isFailure) {
        return Result.failure(result.error);
      }

      return Result.success(result.value);
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
