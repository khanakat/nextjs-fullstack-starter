import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from '../../../../shared/infrastructure/di/types';

// Domain Repositories
import type { ISettingRepository } from '../../domain/repositories/setting-repository';
import { PrismaSettingRepository } from '../repositories/prisma-setting-repository';

// Application Handlers
import { CreateSettingHandler } from '../../application/handlers/create-setting-handler';
import { UpdateSettingHandler } from '../../application/handlers/update-setting-handler';
import { DeleteSettingHandler } from '../../application/handlers/delete-setting-handler';
import { GetSettingHandler } from '../../application/handlers/get-setting-handler';
import { ListSettingsHandler } from '../../application/handlers/list-settings-handler';
import { GetSettingsHandler } from '../../application/handlers/get-settings-handler';

/**
 * Settings Dependency Injection Container
 * Configures all dependencies for the settings vertical slice
 */
export function configureSettingsContainer(container: Container): void {
  // Domain Repositories
  container
    .bind<ISettingRepository>(TYPES.SettingRepository)
    .to(PrismaSettingRepository)
    .inRequestScope();

  // Application Handlers
  container
    .bind<CreateSettingHandler>(TYPES.CreateSettingHandler)
    .to(CreateSettingHandler)
    .inRequestScope();

  container
    .bind<UpdateSettingHandler>(TYPES.UpdateSettingHandler)
    .to(UpdateSettingHandler)
    .inRequestScope();

  container
    .bind<DeleteSettingHandler>(TYPES.DeleteSettingHandler)
    .to(DeleteSettingHandler)
    .inRequestScope();

  container
    .bind<GetSettingHandler>(TYPES.GetSettingHandler)
    .to(GetSettingHandler)
    .inRequestScope();

  container
    .bind<ListSettingsHandler>(TYPES.ListSettingsHandler)
    .to(ListSettingsHandler)
    .inRequestScope();

  container
    .bind<GetSettingsHandler>(TYPES.GetSettingsHandler)
    .to(GetSettingsHandler)
    .inRequestScope();
}
