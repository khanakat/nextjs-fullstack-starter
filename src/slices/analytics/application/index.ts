/**
 * Analytics Application Layer Index
 * Exports all application layer components for the analytics slice
 */

// Commands
export { CreateDashboardCommand } from './commands/create-dashboard-command';
export type { CreateDashboardCommandProps } from './commands/create-dashboard-command';
export { UpdateDashboardCommand } from './commands/update-dashboard-command';
export type { UpdateDashboardCommandProps } from './commands/update-dashboard-command';
export { DeleteDashboardCommand } from './commands/delete-dashboard-command';

// Queries
export { GetDashboardQuery } from './queries/get-dashboard-query';
export { GetDashboardsQuery } from './queries/get-dashboards-query';
export type { GetDashboardsQueryProps } from './queries/get-dashboards-query';

// DTOs
export { DashboardDto } from './dtos/dashboard-dto';

// Handlers
export type { CreateDashboardHandler } from './handlers/create-dashboard-handler';
export type { UpdateDashboardHandler } from './handlers/update-dashboard-handler';
export type { DeleteDashboardHandler } from './handlers/delete-dashboard-handler';
export type { GetDashboardHandler } from './handlers/get-dashboard-handler';
export type { GetDashboardsHandler } from './handlers/get-dashboards-handler';

// Use Cases
export type { CreateDashboardUseCase } from './use-cases/create-dashboard-use-case';
export type { UpdateDashboardUseCase } from './use-cases/update-dashboard-use-case';
export type { DeleteDashboardUseCase } from './use-cases/delete-dashboard-use-case';
export type { GetDashboardUseCase } from './use-cases/get-dashboard-use-case';
export type { GetDashboardsUseCase } from './use-cases/get-dashboards-use-case';
