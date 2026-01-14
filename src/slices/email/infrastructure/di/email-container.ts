/**
 * Email Slice DI Container Configuration
 * Registers all email-related dependencies
 */

import { Container } from 'inversify';
import { TYPES } from '@/shared/infrastructure/di/types';
import { EmailApiController } from '../../presentation/api/email-api.controller';
import { EmailListsApiController } from '../../presentation/api/email-lists-api.controller';
import { EmailTemplatesApiController } from '../../presentation/api/email-templates-api.controller';

export function configureEmailContainer(container: Container): void {
  // Controllers
  container
    .bind<EmailApiController>(TYPES.EmailApiController)
    .to(EmailApiController)
    .inSingletonScope();

  container
    .bind<EmailListsApiController>(TYPES.EmailListsApiController)
    .to(EmailListsApiController)
    .inSingletonScope();

  container
    .bind<EmailTemplatesApiController>(TYPES.EmailTemplatesApiController)
    .to(EmailTemplatesApiController)
    .inSingletonScope();
}
