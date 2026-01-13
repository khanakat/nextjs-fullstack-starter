import { injectable, inject } from 'inversify';
import { Result } from '../../../../shared/application/base/result';
import { DeleteSettingCommand } from '../commands/create-setting-command';
import type { ISettingRepository } from '../../domain/repositories/setting-repository';
import { TYPES } from '../../../../shared/infrastructure/di/types';

/**
 * Delete Setting Handler
 * Handles the deletion of a setting
 */
@injectable()
export class DeleteSettingHandler {
  constructor(
    @inject(TYPES.SettingRepository)
    private readonly settingRepository: ISettingRepository,
  ) {}

  async handle(command: DeleteSettingCommand): Promise<Result<boolean>> {
    try {
      // Delete setting
      const deleted = await this.settingRepository.delete(command.key);

      if (!deleted) {
        return Result.failure<boolean>(new Error('Setting not found'));
      }

      return Result.success<boolean>(deleted);
    } catch (error) {
      return Result.failure<boolean>(
        error instanceof Error ? error : new Error('Failed to delete setting'),
      );
    }
  }
}
