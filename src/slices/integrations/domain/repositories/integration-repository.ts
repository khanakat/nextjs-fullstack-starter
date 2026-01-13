import { Integration, IntegrationStatus } from '../entities/integration';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';

/**
 * Integration Repository Interface
 * Defines the contract for integration data access
 */
export interface IIntegrationRepository {
  /**
   * Save an integration (create or update)
   */
  save(integration: Integration): Promise<void>;

  /**
   * Find integration by ID
   */
  findById(id: UniqueId): Promise<Integration | null>;

  /**
   * Find integrations by organization ID
   */
  findByOrganizationId(organizationId: UniqueId): Promise<Integration[]>;

  /**
   * Find integrations by type
   */
  findByType(type: string): Promise<Integration[]>;

  /**
   * Find integrations by provider
   */
  findByProvider(provider: string): Promise<Integration[]>;

  /**
   * Find integrations by status
   */
  findByStatus(status: IntegrationStatus): Promise<Integration[]>;

  /**
   * Find all integrations with pagination
   */
  findAll(options?: {
    limit?: number;
    offset?: number;
    organizationId?: string;
    type?: string;
    provider?: string;
    status?: IntegrationStatus;
  }): Promise<Integration[]>;

  /**
   * Count integrations
   */
  count(options?: {
    organizationId?: string;
    type?: string;
    provider?: string;
    status?: IntegrationStatus;
  }): Promise<number>;

  /**
   * Delete an integration
   */
  delete(id: UniqueId): Promise<void>;

  /**
   * Check if integration exists
   */
  exists(id: UniqueId): Promise<boolean>;

  /**
   * Find integration by name within an organization
   */
  findByName(organizationId: UniqueId, name: string): Promise<Integration | null>;
}
