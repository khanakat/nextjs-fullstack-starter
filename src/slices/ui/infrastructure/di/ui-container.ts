import { Container } from 'inversify';
import { TYPES } from '@/shared/infrastructure/di/types';
import { ComponentsApiController } from '../../presentation/api/components-api.controller';
import { PreferencesApiController } from '../../presentation/api/preferences-api.controller';
import { TemplatesApiController } from '../../presentation/api/templates-api.controller';
import { ThemesApiController } from '../../presentation/api/themes-api.controller';

/**
 * Configure UI slice dependencies
 */
export function configureUIContainer(container: Container) {
  // Controllers
  container
    .bind<ComponentsApiController>(TYPES.ComponentsApiController)
    .to(ComponentsApiController)
    .inSingletonScope();

  container
    .bind<PreferencesApiController>(TYPES.PreferencesApiController)
    .to(PreferencesApiController)
    .inSingletonScope();

  container
    .bind<TemplatesApiController>(TYPES.TemplatesApiController)
    .to(TemplatesApiController)
    .inSingletonScope();

  container
    .bind<ThemesApiController>(TYPES.ThemesApiController)
    .to(ThemesApiController)
    .inSingletonScope();
}
