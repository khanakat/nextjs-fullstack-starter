import { UniqueId } from '../../value-objects/unique-id';
import { ReportTemplate, TemplateType, TemplateCategory } from '../entities/report-template';

export interface TemplateSearchCriteria {
  name?: string;
  type?: TemplateType;
  category?: TemplateCategory;
  createdBy?: UniqueId;
  organizationId?: UniqueId;
  isActive?: boolean;
  isSystem?: boolean;
  tags?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface TemplateSearchOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'usageCount';
  sortOrder?: 'asc' | 'desc';
}

export interface TemplateSearchResult {
  templates: ReportTemplate[];
  total: number;
  hasMore: boolean;
}

/**
 * Repository interface for ReportTemplate aggregate
 * Defines data access operations for report templates
 */
export interface IReportTemplateRepository {
  /**
   * Save a report template (create or update)
   */
  save(template: ReportTemplate): Promise<void>;

  /**
   * Find a template by its unique identifier
   */
  findById(id: UniqueId): Promise<ReportTemplate | null>;

  /**
   * Find templates by multiple IDs
   */
  findByIds(ids: UniqueId[]): Promise<ReportTemplate[]>;

  /**
   * Find templates by creator
   */
  findByCreator(createdBy: UniqueId, options?: TemplateSearchOptions): Promise<TemplateSearchResult>;

  /**
   * Find templates by organization
   */
  findByOrganization(organizationId: UniqueId, options?: TemplateSearchOptions): Promise<TemplateSearchResult>;

  /**
   * Find system templates (built-in templates)
   */
  findSystemTemplates(options?: TemplateSearchOptions): Promise<TemplateSearchResult>;

  /**
   * Find active templates
   */
  findActiveTemplates(options?: TemplateSearchOptions): Promise<TemplateSearchResult>;

  /**
   * Find templates by type
   */
  findByType(type: TemplateType, options?: TemplateSearchOptions): Promise<TemplateSearchResult>;

  /**
   * Find templates by category
   */
  findByCategory(category: TemplateCategory, options?: TemplateSearchOptions): Promise<TemplateSearchResult>;

  /**
   * Search templates with complex criteria
   */
  search(criteria: TemplateSearchCriteria, options?: TemplateSearchOptions): Promise<TemplateSearchResult>;

  /**
   * Find popular templates (most used)
   */
  findPopularTemplates(limit?: number, organizationId?: UniqueId): Promise<ReportTemplate[]>;

  /**
   * Find recently created templates
   */
  findRecentTemplates(limit?: number, organizationId?: UniqueId): Promise<ReportTemplate[]>;

  /**
   * Count templates by criteria
   */
  count(criteria?: TemplateSearchCriteria): Promise<number>;

  /**
   * Check if a template exists by ID
   */
  exists(id: UniqueId): Promise<boolean>;

  /**
   * Check if a template with the same name exists for a user/organization
   */
  existsByName(name: string, createdBy: UniqueId, organizationId?: UniqueId): Promise<boolean>;

  /**
   * Delete a template (soft delete - mark as inactive)
   */
  delete(id: UniqueId): Promise<void>;

  /**
   * Permanently delete a template (hard delete)
   */
  permanentlyDelete(id: UniqueId): Promise<void>;

  /**
   * Get templates available to a user (own + organization + system)
   */
  getAvailableTemplates(
    userId: UniqueId, 
    organizationId?: UniqueId, 
    options?: TemplateSearchOptions
  ): Promise<TemplateSearchResult>;

  /**
   * Get template usage statistics
   */
  getTemplateUsageStats(templateId: UniqueId): Promise<{
    totalUsage: number;
    usageThisMonth: number;
    usageThisWeek: number;
    lastUsedAt?: Date;
  }>;

  /**
   * Increment template usage count
   */
  incrementUsage(templateId: UniqueId): Promise<void>;

  /**
   * Bulk update templates (for batch operations)
   */
  bulkUpdate(templates: ReportTemplate[]): Promise<void>;

  /**
   * Get template statistics for analytics
   */
  getTemplateStatistics(organizationId?: UniqueId): Promise<{
    totalTemplates: number;
    activeTemplates: number;
    systemTemplates: number;
    customTemplates: number;
    templatesThisMonth: number;
    templatesThisWeek: number;
    averageUsagePerTemplate: number;
  }>;

  /**
   * Find templates that haven't been used recently (for cleanup)
   */
  findUnusedTemplates(unusedSince: Date, excludeSystem?: boolean): Promise<ReportTemplate[]>;

  /**
   * Clone a template (create a copy)
   */
  clone(templateId: UniqueId, newName: string, createdBy: UniqueId): Promise<ReportTemplate>;
}