import { injectable, inject } from 'inversify';
import { Result } from '../../../../shared/application/base/result';
import { ListSettingsQuery } from '../commands/create-setting-command';
import { Setting } from '../../domain/entities/setting';
import type { ISettingRepository } from '../../domain/repositories/setting-repository';
import { TYPES } from '../../../../shared/infrastructure/di/types';

/**
 * List Settings Handler
 * Handles listing of settings
 */
@injectable()
export class ListSettingsHandler {
  constructor(
    @inject(TYPES.SettingRepository)
    private readonly settingRepository: ISettingRepository,
  ) {}

  async handle(query: ListSettingsQuery): Promise<Result<Setting[]>> {
    try {
      const settings = await this.settingRepository.findAll();

      return Result.success<Setting[]>(settings);
    } catch (error) {
      return Result.failure<Setting[]>(
        error instanceof Error ? error : new Error('Failed to list settings'),
      );
    }
  }
}
