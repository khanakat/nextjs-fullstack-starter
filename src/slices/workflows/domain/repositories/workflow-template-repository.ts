import { WorkflowTemplate } from '../entities/workflow-template';
import { WorkflowTemplateId } from '../value-objects/workflow-template-id';

// Re-export for convenience
export { WorkflowTemplate };

/**
 * Workflow Template Repository Interface
 */
export interface IWorkflowTemplateRepository {
  /**
   * Save a workflow template (create or update)
   */
  save(template: WorkflowTemplate): Promise<void>;

  /**
   * Find workflow template by ID
   */
  findById(id: WorkflowTemplateId): Promise<WorkflowTemplate | null>;

  /**
   * Find templates by category
   */
  findByCategory(category: string, options?: {
    organizationId?: string;
    isBuiltIn?: boolean;
    isPublic?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<WorkflowTemplate[]>;

  /**
   * Find templates by organization
   */
  findByOrganization(organizationId: string, options?: {
    category?: string;
    isBuiltIn?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<WorkflowTemplate[]>;

  /**
   * Find templates by creator
   */
  findByCreator(createdBy: string, options?: {
    limit?: number;
    offset?: number;
  }): Promise<WorkflowTemplate[]>;

  /**
   * Find templates by tags
   */
  findByTags(tags: string[], options?: {
    organizationId?: string;
    isPublic?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<WorkflowTemplate[]>;

  /**
   * Find built-in templates
   */
  findBuiltIn(options?: {
    limit?: number;
    offset?: number;
  }): Promise<WorkflowTemplate[]>;

  /**
   * Find public templates
   */
  findPublic(options?: {
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<WorkflowTemplate[]>;

  /**
   * Find all workflow templates with filtering and pagination
   */
  findAll(options?: {
    workflowId?: string;
    organizationId?: string;
    category?: string;
    isBuiltIn?: boolean;
    isPublic?: boolean;
    search?: string;
    tags?: string[];
    createdBy?: string;
    minUsageCount?: number;
    minRating?: number;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ templates: WorkflowTemplate[]; total: number }>;

  /**
   * Search templates by name or description
   */
  search(query: string, options?: {
    organizationId?: string;
    category?: string;
    isPublic?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ templates: WorkflowTemplate[]; total: number }>;

  /**
   * Delete a workflow template
   */
  delete(id: WorkflowTemplateId): Promise<void>;

  /**
   * Count templates by category
   */
  countByCategory(category: string, organizationId?: string): Promise<number>;

  /**
   * Count templates by organization
   */
  countByOrganization(organizationId: string): Promise<number>;

  /**
   * Get popular templates (by usage count)
   */
  findPopular(options?: {
    organizationId?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<WorkflowTemplate[]>;

  /**
   * Get top-rated templates
   */
  findTopRated(options?: {
    organizationId?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<WorkflowTemplate[]>;

  /**
   * Update template usage count
   */
  incrementUsageCount(id: WorkflowTemplateId): Promise<void>;

  /**
   * Update template rating
   */
  updateRating(id: WorkflowTemplateId, rating: number): Promise<void>;

  /**
   * Check if template exists
   */
  exists(id: WorkflowTemplateId): Promise<boolean>;

  /**
   * Find templates for workflow (by workflowId)
   */
  findByWorkflowId(workflowId: string): Promise<WorkflowTemplate[]>;
}
