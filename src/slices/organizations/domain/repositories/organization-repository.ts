import { Organization } from '../entities/organization';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';

/**
 * Organization repository interface
 * Defines the contract for organization data access
 */
export interface IOrganizationRepository {
  /**
   * Save a new organization
   */
  save(organization: Organization): Promise<void>;

  /**
   * Update an existing organization
   */
  update(organization: Organization): Promise<void>;

  /**
   * Delete an organization
   */
  delete(id: UniqueId): Promise<void>;

  /**
   * Find organization by ID
   */
  findById(id: UniqueId): Promise<Organization | null>;

  /**
   * Find organization by slug
   */
  findBySlug(slug: string): Promise<Organization | null>;

  /**
   * Find organization by owner ID
   */
  findByOwnerId(ownerId: string): Promise<Organization[]>;

  /**
   * Find all organizations
   */
  findAll(): Promise<Organization[]>;

  /**
   * Find organizations by status
   */
  findByStatus(status: string): Promise<Organization[]>;

  /**
   * Check if slug exists
   */
  existsBySlug(slug: string): Promise<boolean>;

  /**
   * Count organizations
   */
  count(): Promise<number>;

  /**
   * Find organizations with pagination
   */
  findPaginated(page: number, limit: number): Promise<{ organizations: Organization[]; total: number }>;
}
