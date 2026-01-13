import { injectable, inject } from 'inversify';
import { Result } from '../../../../shared/application/base/result';
import { GetSettingQuery } from '../commands/create-setting-command';
import { Setting } from '../../domain/entities/setting';
import type { ISettingRepository } from '../../domain/repositories/setting-repository';
import { TYPES } from '../../../../shared/infrastructure/di/types';

/**
 * Get Setting Handler
 * Handles the retrieval of a setting
 */
@injectable()
export class GetSettingHandler {
  constructor(
    @inject(TYPES.SettingRepository)
    private readonly settingRepository: ISettingRepository,
  ) {}

  async handle(query: GetSettingQuery): Promise<Result<Setting>> {
    try {
      const setting = await this.settingRepository.findByKey(query.key);

      if (!setting) {
        return Result.failure<Setting>(new Error('Setting not found'));
      }

      return Result.success<Setting>(setting);
    } catch (error) {
      return Result.failure<Setting>(
        error instanceof Error ? error : new Error('Failed to get setting'),
      );
    }
  }
}
