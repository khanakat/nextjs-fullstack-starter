import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from '../../../../shared/infrastructure/di/types';
import { PrismaDashboardRepository } from '../repositories/prisma-dashboard-repository';
import { CreateDashboardHandler } from '../../../analytics/application/handlers/create-dashboard-handler';
import { UpdateDashboardHandler } from '../../../analytics/application/handlers/update-dashboard-handler';
import { DeleteDashboardHandler } from '../../../analytics/application/handlers/delete-dashboard-handler';
import { GetDashboardHandler } from '../../../analytics/application/handlers/get-dashboard-handler';
import { GetDashboardsHandler } from '../../../analytics/application/handlers/get-dashboards-handler';
import { CreateDashboardUseCase } from '../../../analytics/application/use-cases/create-dashboard-use-case';
import { UpdateDashboardUseCase } from '../../../analytics/application/use-cases/update-dashboard-use-case';
import { DeleteDashboardUseCase } from '../../../analytics/application/use-cases/delete-dashboard-use-case';
import { GetDashboardUseCase } from '../../../analytics/application/use-cases/get-dashboard-use-case';
import { GetDashboardsUseCase } from '../../../analytics/application/use-cases/get-dashboards-use-case';

/**
 * Configure Analytics slice dependencies in DI container
 */
export function configureAnalyticsContainer(container: Container): void {
  // Repositories
  container
    .bind(TYPES.DashboardRepository)
    .to(PrismaDashboardRepository)
    .inSingletonScope();

  // Handlers
  container
    .bind(TYPES.CreateDashboardHandler)
    .to(CreateDashboardHandler)
    .inTransientScope();

  container
    .bind(TYPES.UpdateDashboardHandler)
    .to(UpdateDashboardHandler)
    .inTransientScope();

  container
    .bind(TYPES.DeleteDashboardHandler)
    .to(DeleteDashboardHandler)
    .inTransientScope();

  container
    .bind(TYPES.GetDashboardHandler)
    .to(GetDashboardHandler)
    .inTransientScope();

  container
    .bind(TYPES.GetDashboardsHandler)
    .to(GetDashboardsHandler)
    .inTransientScope();

  // Use Cases
  container
    .bind(TYPES.CreateDashboardUseCase)
    .to(CreateDashboardUseCase)
    .inTransientScope();

  container
    .bind(TYPES.UpdateDashboardUseCase)
    .to(UpdateDashboardUseCase)
    .inTransientScope();

  container
    .bind(TYPES.DeleteDashboardUseCase)
    .to(DeleteDashboardUseCase)
    .inTransientScope();

  container
    .bind(TYPES.GetDashboardUseCase)
    .to(GetDashboardUseCase)
    .inTransientScope();

  container
    .bind(TYPES.GetDashboardsUseCase)
    .to(GetDashboardsUseCase)
    .inTransientScope();
}
