/**
 * Analytics Domain Layer Index
 * Exports all domain entities, value objects, and repository interfaces
 */

// Value Objects
export { DashboardId } from './value-objects/dashboard-id';

// Entities
export { Dashboard, DashboardStatus } from './entities/dashboard';

// Repository Interfaces
export type { IDashboardRepository } from './repositories/dashboard-repository';
