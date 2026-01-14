import { injectable } from 'inversify';
import { ICommandHandler } from '../../base/command-handler';
import { DeleteCacheCommand } from '../commands/delete-cache-command';
import { CacheService } from '../../../domain/caching/services/cache-service';
import { CacheKey } from '../../../domain/caching/value-objects/cache-key';
import { Result } from '../../base/result';

/**
 * Delete Cache Handler
 * Handles deleting a value from cache
 */
@injectable()
export class DeleteCacheHandler implements ICommandHandler<DeleteCacheCommand, void> {
  constructor(private readonly cacheService: CacheService) {}

  async handle(command: DeleteCacheCommand): Promise<Result<void>> {
    try {
      command.validate();

      const key = CacheKey.create(command.key);
      const result = await this.cacheService.delete(key);

      if (result.isFailure) {
        return Result.failure(result.error);
      }

      return Result.success(undefined);
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
