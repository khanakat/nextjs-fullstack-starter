import { Dashboard, DashboardStatus } from '../entities/dashboard';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';

/**
 * Dashboard repository interface
 * Defines contract for dashboard data access
 * 
 * Note: The Prisma AnalyticsDashboard model does not have a slug field.
 * Status is stored in the settings JSON field as a nested property.
 */
export interface IDashboardRepository {
  /**
   * Save a new dashboard
   */
  save(dashboard: Dashboard): Promise<void>;

  /**
   * Update an existing dashboard
   */
  update(dashboard: Dashboard): Promise<void>;

  /**
   * Delete a dashboard
   */
  delete(id: UniqueId): Promise<void>;

  /**
   * Find dashboard by ID
   */
  findById(id: UniqueId): Promise<Dashboard | null>;

  /**
   * Find dashboards by organization ID
   */
  findByOrganizationId(organizationId: string): Promise<Dashboard[]>;

  /**
   * Find all dashboards
   */
  findAll(): Promise<Dashboard[]>;

  /**
   * Find dashboards by status
   * Note: This filters by status stored in settings JSON field
   */
  findByStatus(status: DashboardStatus): Promise<Dashboard[]>;

  /**
   * Find dashboards by creator ID
   */
  findByCreatedBy(createdBy: string): Promise<Dashboard[]>;

  /**
   * Find public dashboards
   */
  findPublic(): Promise<Dashboard[]>;

  /**
   * Find template dashboards
   */
  findTemplates(): Promise<Dashboard[]>;

  /**
   * Count dashboards
   */
  count(): Promise<number>;

  /**
   * Find dashboards with pagination
   */
  findPaginated(page: number, limit: number): Promise<{ dashboards: Dashboard[]; total: number }>;

  /**
   * Increment view count for a dashboard
   */
  incrementViewCount(id: UniqueId): Promise<void>;
}
