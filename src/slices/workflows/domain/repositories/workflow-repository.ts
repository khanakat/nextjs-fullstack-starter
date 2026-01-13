import { Workflow, WorkflowStatus } from '../entities/workflow';
import { WorkflowId } from '../value-objects/workflow-id';

/**
 * Workflow Repository Interface
 * Defines the contract for workflow data access
 */
export interface IWorkflowRepository {
  /**
   * Save a new workflow
   */
  save(workflow: Workflow): Promise<void>;

  /**
   * Find workflow by ID
   */
  findById(id: WorkflowId): Promise<Workflow | null>;

  /**
   * Find all workflows
   */
  findAll(): Promise<Workflow[]>;

  /**
   * Find workflows by organization ID
   */
  findByOrganizationId(organizationId: string): Promise<Workflow[]>;

  /**
   * Find workflows by status
   */
  findByStatus(status: WorkflowStatus): Promise<Workflow[]>;

  /**
   * Find public workflows
   */
  findPublic(): Promise<Workflow[]>;

  /**
   * Find workflow templates
   */
  findTemplates(): Promise<Workflow[]>;

  /**
   * Update an existing workflow
   */
  update(workflow: Workflow): Promise<void>;

  /**
   * Delete a workflow by ID
   */
  delete(id: WorkflowId): Promise<void>;

  /**
   * Count workflows by organization
   */
  countByOrganization(organizationId: string): Promise<number>;

  /**
   * Count workflows by status
   */
  countByStatus(status: WorkflowStatus): Promise<number>;
}
