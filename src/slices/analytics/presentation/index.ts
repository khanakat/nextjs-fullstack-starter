/**
 * Analytics Presentation Layer Index
 * Exports all presentation layer components for analytics slice
 */

// API Routes
export { POST as CreateDashboard } from './api/create-dashboard-api-route';
export { GET as GetDashboard } from './api/get-dashboard-api-route';
export { GET as GetDashboards } from './api/get-dashboards-api-route';
export { PUT as UpdateDashboard } from './api/update-dashboard-api-route';
export { DELETE as DeleteDashboard } from './api/delete-dashboard-api-route';
