import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from '../../../../shared/infrastructure/di/types';

// Application Handlers
import { ListApiKeysHandler } from '../../application/handlers/list-api-keys-handler';
import { CreateApiKeyHandler } from '../../application/handlers/create-api-key-handler';
import { GetPermissionAnalyticsHandler } from '../../application/handlers/audit-handlers';
import { GetViolationsHandler } from '../../application/handlers/audit-handlers';
import { AuditUserPermissionsHandler } from '../../application/handlers/audit-handlers';
import { GetComplianceReportHandler } from '../../application/handlers/audit-handlers';
import { ResolveViolationHandler } from '../../application/handlers/audit-handlers';
import { LogPermissionCheckHandler } from '../../application/handlers/audit-handlers';
import { CreateViolationHandler } from '../../application/handlers/audit-handlers';
import { ListSecurityEventsHandler } from '../../application/handlers/security-events-handlers';
import { UpdateSecurityEventHandler } from '../../application/handlers/security-events-handlers';
import { GetSecurityMetricsHandler } from '../../application/handlers/security-metrics-handler';

// Presentation Controllers
import { SecurityApiController } from '../../presentation/api/security-api.controller';

/**
 * Security Dependency Injection Container
 * Configures all dependencies for the security vertical slice
 */
export function configureSecurityContainer(container: Container): void {
  // Application Handlers - API Keys
  container
    .bind<ListApiKeysHandler>(TYPES.ListApiKeysHandler)
    .to(ListApiKeysHandler)
    .inRequestScope();

  container
    .bind<CreateApiKeyHandler>(TYPES.CreateApiKeyHandler)
    .to(CreateApiKeyHandler)
    .inRequestScope();

  // Application Handlers - Audit
  container
    .bind<GetPermissionAnalyticsHandler>(TYPES.GetPermissionAnalyticsHandler)
    .to(GetPermissionAnalyticsHandler)
    .inRequestScope();

  container
    .bind<GetViolationsHandler>(TYPES.GetViolationsHandler)
    .to(GetViolationsHandler)
    .inRequestScope();

  container
    .bind<AuditUserPermissionsHandler>(TYPES.AuditUserPermissionsHandler)
    .to(AuditUserPermissionsHandler)
    .inRequestScope();

  container
    .bind<GetComplianceReportHandler>(TYPES.GetComplianceReportHandler)
    .to(GetComplianceReportHandler)
    .inRequestScope();

  container
    .bind<ResolveViolationHandler>(TYPES.ResolveViolationHandler)
    .to(ResolveViolationHandler)
    .inRequestScope();

  container
    .bind<LogPermissionCheckHandler>(TYPES.LogPermissionCheckHandler)
    .to(LogPermissionCheckHandler)
    .inRequestScope();

  container
    .bind<CreateViolationHandler>(TYPES.CreateViolationHandler)
    .to(CreateViolationHandler)
    .inRequestScope();

  // Application Handlers - Security Events
  container
    .bind<ListSecurityEventsHandler>(TYPES.ListSecurityEventsHandler)
    .to(ListSecurityEventsHandler)
    .inRequestScope();

  container
    .bind<UpdateSecurityEventHandler>(TYPES.UpdateSecurityEventHandler)
    .to(UpdateSecurityEventHandler)
    .inRequestScope();

  // Application Handlers - Security Metrics
  container
    .bind<GetSecurityMetricsHandler>(TYPES.GetSecurityMetricsHandler)
    .to(GetSecurityMetricsHandler)
    .inRequestScope();

  // Presentation Controllers
  container
    .bind<SecurityApiController>(TYPES.SecurityApiController)
    .to(SecurityApiController)
    .inSingletonScope();
}
