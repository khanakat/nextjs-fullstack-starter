import { injectable } from 'inversify';
import { ICommandHandler } from '../../base/command-handler';
import { SetCacheCommand } from '../commands/set-cache-command';
import { CacheService } from '../../../domain/caching/services/cache-service';
import { CacheKey } from '../../../domain/caching/value-objects/cache-key';
import { Result } from '../../base/result';

/**
 * Set Cache Handler
 * Handles setting a value in cache
 */
@injectable()
export class SetCacheHandler implements ICommandHandler<SetCacheCommand, void> {
  constructor(private readonly cacheService: CacheService) {}

  async handle(command: SetCacheCommand): Promise<Result<void>> {
    try {
      command.validate();

      const key = CacheKey.create(command.key);
      const ttl = command.getTTL();
      const tags = command.getTags();

      const result = await this.cacheService.set(key, command.value, ttl, tags);

      if (result.isFailure) {
        return Result.failure(result.error);
      }

      return Result.success(undefined);
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
