import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from '../../../../shared/infrastructure/di/types';

// Domain Repositories
import type { IAuditLogRepository } from '../../domain/repositories/audit-log-repository';
import { PrismaAuditLogRepository } from '../repositories/prisma-audit-log-repository';

// Application Handlers
import { CreateAuditLogHandler } from '../../application/handlers/create-audit-log-handler';
import { UpdateAuditLogHandler } from '../../application/handlers/update-audit-log-handler';
import { DeleteAuditLogHandler } from '../../application/handlers/delete-audit-log-handler';
import { GetAuditLogHandler } from '../../application/handlers/get-audit-log-handler';
import { ListAuditLogsHandler } from '../../application/handlers/list-audit-logs-handler';
import { GetAuditLogsHandler } from '../../application/handlers/get-audit-logs-handler';
import { GetAuditStatisticsHandler } from '../../application/handlers/get-audit-statistics-handler';

/**
 * Audit Dependency Injection Container
 * Configures all dependencies for the audit vertical slice
 */
export function configureAuditContainer(container: Container): void {
  // Domain Repositories
  container
    .bind<IAuditLogRepository>(TYPES.AuditLogRepository)
    .to(PrismaAuditLogRepository)
    .inRequestScope();

  // Application Handlers
  container
    .bind<CreateAuditLogHandler>(TYPES.CreateAuditLogHandler)
    .to(CreateAuditLogHandler)
    .inRequestScope();

  container
    .bind<UpdateAuditLogHandler>(TYPES.UpdateAuditLogHandler)
    .to(UpdateAuditLogHandler)
    .inRequestScope();

  container
    .bind<DeleteAuditLogHandler>(TYPES.DeleteAuditLogHandler)
    .to(DeleteAuditLogHandler)
    .inRequestScope();

  container
    .bind<GetAuditLogHandler>(TYPES.GetAuditLogHandler)
    .to(GetAuditLogHandler)
    .inRequestScope();

  container
    .bind<ListAuditLogsHandler>(TYPES.ListAuditLogsHandler)
    .to(ListAuditLogsHandler)
    .inRequestScope();

  container
    .bind<GetAuditLogsHandler>(TYPES.GetAuditLogsHandler)
    .to(GetAuditLogsHandler)
    .inRequestScope();

  container
    .bind<GetAuditStatisticsHandler>(TYPES.GetAuditStatisticsHandler)
    .to(GetAuditStatisticsHandler)
    .inRequestScope();
}
