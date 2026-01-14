import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from '../../../../shared/infrastructure/di/types';
import { PrismaIntegrationRepository } from '../repositories/prisma-integration-repository';
import { PrismaIntegrationTemplateRepository } from '../repositories/prisma-integration-template-repository';
import { PrismaWebhookRepository } from '../repositories/prisma-webhook-repository';
import { PrismaWebhookEventRepository } from '../repositories/prisma-webhook-event-repository';
import { CreateIntegrationHandler } from '../../../integrations/application/handlers/create-integration-handler';
import { UpdateIntegrationHandler } from '../../../integrations/application/handlers/update-integration-handler';
import { DeleteIntegrationHandler } from '../../../integrations/application/handlers/delete-integration-handler';
import { GetIntegrationHandler } from '../../../integrations/application/handlers/get-integration-handler';
import { GetIntegrationsHandler } from '../../../integrations/application/handlers/get-integrations-handler';
import { SyncIntegrationHandler } from '../../../integrations/application/handlers/sync-integration-handler';
import { ListTemplatesHandler } from '../../../integrations/application/handlers/list-templates-handler';
import { CreateIntegrationFromTemplateHandler } from '../../../integrations/application/handlers/create-integration-from-template-handler';
import { TestWebhookHandler } from '../../../integrations/application/handlers/test-webhook-handler';
import { GetWebhookStatsHandler } from '../../../integrations/application/handlers/get-webhook-stats-handler';
import { ListWebhooksHandler } from '../../../integrations/application/handlers/list-webhooks-handler';
import { CreateWebhookHandler } from '../../../integrations/application/handlers/create-webhook-handler';
import { UpdateWebhookHandler } from '../../../integrations/application/handlers/update-webhook-handler';
import { DeleteWebhookHandler } from '../../../integrations/application/handlers/delete-webhook-handler';
import { GetWebhookHandler } from '../../../integrations/application/handlers/get-webhook-handler';
import { GetWebhookDeliveriesHandler } from '../../../integrations/application/handlers/get-webhook-deliveries-handler';
import { ProcessWebhookHandler } from '../../../integrations/application/handlers/process-webhook-handler';
import { ConnectIntegrationHandler } from '../../../integrations/application/handlers/connect-integration-handler';
import { DisconnectIntegrationHandler } from '../../../integrations/application/handlers/disconnect-integration-handler';
import { HandleOAuthCallbackHandler } from '../../../integrations/application/handlers/handle-oauth-callback-handler';
import { GetConnectionStatusHandler } from '../../../integrations/application/handlers/get-connection-status-handler';
import { TestIntegrationHandler } from '../../../integrations/application/handlers/test-integration-handler';
import { GetTestHistoryHandler } from '../../../integrations/application/handlers/get-test-history-handler';
import { CreateIntegrationUseCase } from '../../../integrations/application/use-cases/create-integration-use-case';
import { UpdateIntegrationUseCase } from '../../../integrations/application/use-cases/update-integration-use-case';
import { DeleteIntegrationUseCase } from '../../../integrations/application/use-cases/delete-integration-use-case';
import { GetIntegrationUseCase } from '../../../integrations/application/use-cases/get-integration-use-case';
import { GetIntegrationsUseCase } from '../../../integrations/application/use-cases/get-integrations-use-case';
import { IntegrationsApiController } from '../../presentation/api/integrations-api.controller';
import { IntegrationTemplatesApiController } from '../../presentation/api/integration-templates-api.controller';
import { WebhooksApiController } from '../../presentation/api/webhooks-api.controller';

/**
 * Configure Integrations slice dependencies in DI container
 */
export function configureIntegrationsContainer(container: Container): void {
  // Repositories
  container
    .bind(TYPES.IntegrationRepository)
    .to(PrismaIntegrationRepository)
    .inSingletonScope();

  container
    .bind(TYPES.IntegrationTemplateRepository)
    .to(PrismaIntegrationTemplateRepository)
    .inSingletonScope();

  container
    .bind(TYPES.WebhookRepository)
    .to(PrismaWebhookRepository)
    .inSingletonScope();

  container
    .bind(TYPES.WebhookEventRepository)
    .to(PrismaWebhookEventRepository)
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

  container
    .bind(TYPES.SyncIntegrationHandler)
    .to(SyncIntegrationHandler)
    .inTransientScope();

  container
    .bind(TYPES.ListTemplatesHandler)
    .to(ListTemplatesHandler)
    .inTransientScope();

  container
    .bind(TYPES.CreateIntegrationFromTemplateHandler)
    .to(CreateIntegrationFromTemplateHandler)
    .inTransientScope();

  container
    .bind(TYPES.TestWebhookHandler)
    .to(TestWebhookHandler)
    .inTransientScope();

  container
    .bind(TYPES.GetWebhookStatsHandler)
    .to(GetWebhookStatsHandler)
    .inTransientScope();

  container
    .bind(TYPES.ListWebhooksHandler)
    .to(ListWebhooksHandler)
    .inTransientScope();

  container
    .bind(TYPES.CreateWebhookHandler)
    .to(CreateWebhookHandler)
    .inTransientScope();

  container
    .bind(TYPES.UpdateWebhookHandler)
    .to(UpdateWebhookHandler)
    .inTransientScope();

  container
    .bind(TYPES.DeleteWebhookHandler)
    .to(DeleteWebhookHandler)
    .inTransientScope();

  container
    .bind(TYPES.GetWebhookHandler)
    .to(GetWebhookHandler)
    .inTransientScope();

  container
    .bind(TYPES.GetWebhookDeliveriesHandler)
    .to(GetWebhookDeliveriesHandler)
    .inTransientScope();

  container
    .bind(TYPES.ProcessWebhookHandler)
    .to(ProcessWebhookHandler)
    .inTransientScope();

  container
    .bind(TYPES.ConnectIntegrationHandler)
    .to(ConnectIntegrationHandler)
    .inTransientScope();

  container
    .bind(TYPES.DisconnectIntegrationHandler)
    .to(DisconnectIntegrationHandler)
    .inTransientScope();

  container
    .bind(TYPES.HandleOAuthCallbackHandler)
    .to(HandleOAuthCallbackHandler)
    .inTransientScope();

  container
    .bind(TYPES.GetConnectionStatusHandler)
    .to(GetConnectionStatusHandler)
    .inTransientScope();

  container
    .bind(TYPES.TestIntegrationHandler)
    .to(TestIntegrationHandler)
    .inTransientScope();

  container
    .bind(TYPES.GetTestHistoryHandler)
    .to(GetTestHistoryHandler)
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

  // Presentation Controllers
  container
    .bind(TYPES.IntegrationsApiController)
    .to(IntegrationsApiController)
    .inSingletonScope();

  container
    .bind(TYPES.IntegrationTemplatesApiController)
    .to(IntegrationTemplatesApiController)
    .inSingletonScope();

  container
    .bind(TYPES.WebhooksApiController)
    .to(WebhooksApiController)
    .inSingletonScope();
}
