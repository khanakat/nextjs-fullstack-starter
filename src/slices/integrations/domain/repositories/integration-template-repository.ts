import { IntegrationTemplate } from '../entities/integration-template';
import { IntegrationTemplateId } from '../value-objects/integration-template-id';

/**
 * Integration Template Repository Interface
 */
export interface IIntegrationTemplateRepository {
  /**
   * Save integration template (create or update)
   */
  save(template: IntegrationTemplate): Promise<void>;

  /**
   * Find template by ID
   */
  findById(id: IntegrationTemplateId): Promise<IntegrationTemplate | null>;

  /**
   * Find all templates with optional filters
   */
  findAll(options?: {
    organizationId?: string;
    provider?: string;
    category?: string;
    includeBuiltIn?: boolean;
    includePublic?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ templates: IntegrationTemplate[]; total: number }>;

  /**
   * Find templates by provider
   */
  findByProvider(provider: string): Promise<IntegrationTemplate[]>;

  /**
   * Find templates by category
   */
  findByCategory(category: string): Promise<IntegrationTemplate[]>;

  /**
   * Delete template by ID
   */
  delete(id: IntegrationTemplateId): Promise<void>;

  /**
   * Check if template exists
   */
  exists(id: IntegrationTemplateId): Promise<boolean>;
}
