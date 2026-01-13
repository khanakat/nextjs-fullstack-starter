import { injectable, inject } from 'inversify';
import { Result } from '../../../../shared/application/base/result';
import { CreateSettingCommand } from '../commands/create-setting-command';
import { Setting } from '../../domain/entities/setting';
import type { ISettingRepository } from '../../domain/repositories/setting-repository';
import { TYPES } from '../../../../shared/infrastructure/di/types';

/**
 * Create Setting Handler
 * Handles the creation of a new setting
 */
@injectable()
export class CreateSettingHandler {
  constructor(
    @inject(TYPES.SettingRepository)
    private readonly settingRepository: ISettingRepository,
  ) {}

  async handle(command: CreateSettingCommand): Promise<Result<Setting>> {
    try {
      // Check if setting already exists
      const existingSetting = await this.settingRepository.findByKey(command.key);
      if (existingSetting) {
        return Result.failure<Setting>(new Error('Setting already exists'));
      }

      // Create new setting
      const setting = Setting.create({
        key: command.key,
        value: command.value,
        description: command.description,
      });

      // Save setting
      const savedSetting = await this.settingRepository.save(setting);

      return Result.success<Setting>(savedSetting);
    } catch (error) {
      return Result.failure<Setting>(
        error instanceof Error ? error : new Error('Failed to create setting'),
      );
    }
  }
}
