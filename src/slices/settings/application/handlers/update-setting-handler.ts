import { injectable, inject } from 'inversify';
import { Result } from '../../../../shared/application/base/result';
import { UpdateSettingCommand } from '../commands/create-setting-command';
import { Setting } from '../../domain/entities/setting';
import type { ISettingRepository } from '../../domain/repositories/setting-repository';
import { TYPES } from '../../../../shared/infrastructure/di/types';

/**
 * Update Setting Handler
 * Handles the update of a setting
 */
@injectable()
export class UpdateSettingHandler {
  constructor(
    @inject(TYPES.SettingRepository)
    private readonly settingRepository: ISettingRepository,
  ) {}

  async handle(command: UpdateSettingCommand): Promise<Result<Setting>> {
    try {
      // Check if setting exists
      const existingSetting = await this.settingRepository.findByKey(command.key);
      if (!existingSetting) {
        return Result.failure<Setting>(new Error('Setting not found'));
      }

      // Update setting
      const updatedSetting = existingSetting.updateValue(command.value);
      if (command.description !== undefined) {
        updatedSetting.updateDescription(command.description);
      }

      // Save updated setting
      const savedSetting = await this.settingRepository.update(updatedSetting);

      return Result.success<Setting>(savedSetting);
    } catch (error) {
      return Result.failure<Setting>(
        error instanceof Error ? error : new Error('Failed to update setting'),
      );
    }
  }
}
