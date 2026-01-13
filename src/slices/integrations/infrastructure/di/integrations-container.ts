import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from '../../../../shared/infrastructure/di/types';
import { PrismaIntegrationRepository } from '../repositories/prisma-integration-repository';
import { CreateIntegrationHandler } from '../../../integrations/application/handlers/create-integration-handler';
import { UpdateIntegrationHandler } from '../../../integrations/application/handlers/update-integration-handler';
import { DeleteIntegrationHandler } from '../../../integrations/application/handlers/delete-integration-handler';
import { GetIntegrationHandler } from '../../../integrations/application/handlers/get-integration-handler';
import { GetIntegrationsHandler } from '../../../integrations/application/handlers/get-integrations-handler';
import { CreateIntegrationUseCase } from '../../../integrations/application/use-cases/create-integration-use-case';
import { UpdateIntegrationUseCase } from '../../../integrations/application/use-cases/update-integration-use-case';
import { DeleteIntegrationUseCase } from '../../../integrations/application/use-cases/delete-integration-use-case';
import { GetIntegrationUseCase } from '../../../integrations/application/use-cases/get-integration-use-case';
import { GetIntegrationsUseCase } from '../../../integrations/application/use-cases/get-integrations-use-case';

/**
 * Configure Integrations slice dependencies in DI container
 */
export function configureIntegrationsContainer(container: Container): void {
  // Repositories
  container
    .bind(TYPES.IntegrationRepository)
    .to(PrismaIntegrationRepository)
    .inSingletonScope();

  // Handlers
  container
    .bind(TYPES.CreateIntegrationHandler)
    .to(CreateIntegrationHandler)
    .inTransientScope();

  container
    .bind(TYPES.UpdateIntegrationHandler)
    .to(UpdateIntegrationHandler)
    .inTransientScope();

  container
    .bind(TYPES.DeleteIntegrationHandler)
    .to(DeleteIntegrationHandler)
    .inTransientScope();

  container
    .bind(TYPES.GetIntegrationHandler)
    .to(GetIntegrationHandler)
    .inTransientScope();

  container
    .bind(TYPES.GetIntegrationsHandler)
    .to(GetIntegrationsHandler)
    .inTransientScope();

  // Use Cases
  container
    .bind(TYPES.CreateIntegrationUseCase)
    .to(CreateIntegrationUseCase)
    .inTransientScope();

  container
    .bind(TYPES.UpdateIntegrationUseCase)
    .to(UpdateIntegrationUseCase)
    .inTransientScope();

  container
    .bind(TYPES.DeleteIntegrationUseCase)
    .to(DeleteIntegrationUseCase)
    .inTransientScope();

  container
    .bind(TYPES.GetIntegrationUseCase)
    .to(GetIntegrationUseCase)
    .inTransientScope();

  container
    .bind(TYPES.GetIntegrationsUseCase)
    .to(GetIntegrationsUseCase)
    .inTransientScope();
}
