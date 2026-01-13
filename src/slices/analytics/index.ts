/**
 * Analytics Slice Index
 * Exports all components of the analytics slice
 */

// Domain Layer
export { Dashboard, DashboardStatus } from './domain/entities/dashboard';
export { DashboardId } from './domain/value-objects/dashboard-id';
export type { IDashboardRepository } from './domain/repositories/dashboard-repository';

// Application Layer
export { CreateDashboardCommand } from './application/commands/create-dashboard-command';
export type { CreateDashboardCommandProps } from './application/commands/create-dashboard-command';
export { UpdateDashboardCommand } from './application/commands/update-dashboard-command';
export type { UpdateDashboardCommandProps } from './application/commands/update-dashboard-command';
export { DeleteDashboardCommand } from './application/commands/delete-dashboard-command';
export { GetDashboardQuery } from './application/queries/get-dashboard-query';
export { GetDashboardsQuery } from './application/queries/get-dashboards-query';
export type { GetDashboardsQueryProps } from './application/queries/get-dashboards-query';
export { DashboardDto } from './application/dtos/dashboard-dto';
export type { CreateDashboardHandler } from './application/handlers/create-dashboard-handler';
export type { UpdateDashboardHandler } from './application/handlers/update-dashboard-handler';
export type { DeleteDashboardHandler } from './application/handlers/delete-dashboard-handler';
export type { GetDashboardHandler } from './application/handlers/get-dashboard-handler';
export type { GetDashboardsHandler } from './application/handlers/get-dashboards-handler';
export type { CreateDashboardUseCase } from './application/use-cases/create-dashboard-use-case';
export type { UpdateDashboardUseCase } from './application/use-cases/update-dashboard-use-case';
export type { DeleteDashboardUseCase } from './application/use-cases/delete-dashboard-use-case';
export type { GetDashboardUseCase } from './application/use-cases/get-dashboard-use-case';
export type { GetDashboardsUseCase } from './application/use-cases/get-dashboards-use-case';

// Infrastructure Layer
export { PrismaDashboardRepository } from './infrastructure/repositories/prisma-dashboard-repository';

// Presentation Layer
export { POST as CreateDashboard } from './presentation/api/create-dashboard-api-route';
export { GET as GetDashboard } from './presentation/api/get-dashboard-api-route';
export { GET as GetDashboards } from './presentation/api/get-dashboards-api-route';
export { PUT as UpdateDashboard } from './presentation/api/update-dashboard-api-route';
export { DELETE as DeleteDashboard } from './presentation/api/delete-dashboard-api-route';
