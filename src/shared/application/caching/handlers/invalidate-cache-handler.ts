import { injectable } from 'inversify';
import { ICommandHandler } from '../../base/command-handler';
import { InvalidateCacheCommand } from '../commands/invalidate-cache-command';
import { CacheService } from '../../../domain/caching/services/cache-service';
import { CacheTag } from '../../../domain/caching/value-objects/cache-tag';
import { Result } from '../../base/result';

/**
 * Invalidate Cache Handler
 * Handles invalidating cache entries by tag or pattern
 */
@injectable()
export class InvalidateCacheHandler implements ICommandHandler<InvalidateCacheCommand, number> {
  constructor(private readonly cacheService: CacheService) {}

  async handle(command: InvalidateCacheCommand): Promise<Result<number>> {
    try {
      command.validate();

      let result: Result<number>;

      if (command.tag) {
        const tag = CacheTag.create(command.tag);
        result = await this.cacheService.deleteByTag(tag);
      } else if (command.pattern) {
        result = await this.cacheService.deleteByPattern(command.pattern);
      } else {
        return Result.failure(new Error('Either tag or pattern must be specified'));
      }

      if (result.isFailure) {
        return Result.failure(result.error);
      }

      return Result.success(result.value);
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
