/**
 * Analytics Application Layer - Handlers Index
 * Exports all command and query handlers for the analytics slice
 */

// Command Handlers
export type { CreateDashboardHandler } from './create-dashboard-handler';
export type { UpdateDashboardHandler } from './update-dashboard-handler';
export type { DeleteDashboardHandler } from './delete-dashboard-handler';

// Query Handlers
export type { GetDashboardHandler } from './get-dashboard-handler';
export type { GetDashboardsHandler } from './get-dashboards-handler';
