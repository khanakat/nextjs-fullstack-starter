import { WorkflowInstance, WorkflowInstanceStatus, Priority } from '../entities/workflow-instance';
import { WorkflowInstanceId } from '../value-objects/workflow-instance-id';

// Re-export types for convenience
export type { WorkflowInstance, WorkflowInstanceStatus, Priority };

/**
 * Workflow Instance Repository Interface
 */
export interface IWorkflowInstanceRepository {
  /**
   * Save a workflow instance (create or update)
   */
  save(instance: WorkflowInstance): Promise<void>;

  /**
   * Find workflow instance by ID
   */
  findById(id: WorkflowInstanceId): Promise<WorkflowInstance | null>;

  /**
   * Find workflow instances by workflow ID
   */
  findByWorkflowId(workflowId: string, options?: {
    status?: WorkflowInstanceStatus;
    limit?: number;
    offset?: number;
  }): Promise<WorkflowInstance[]>;

  /**
   * Find workflow instances by status
   */
  findByStatus(status: WorkflowInstanceStatus, options?: {
    organizationId?: string;
    limit?: number;
    offset?: number;
  }): Promise<WorkflowInstance[]>;

  /**
   * Find all workflow instances with filtering and pagination
   */
  findAll(options?: {
    workflowId?: string;
    status?: WorkflowInstanceStatus;
    organizationId?: string;
    triggeredBy?: string;
    priority?: Priority;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ instances: WorkflowInstance[]; total: number }>;

  /**
   * Delete a workflow instance
   */
  delete(id: WorkflowInstanceId): Promise<void>;

  /**
   * Count workflow instances by status
   */
  countByStatus(status?: WorkflowInstanceStatus, organizationId?: string): Promise<number>;

  /**
   * Find active workflow instances (running or paused)
   */
  findActive(organizationId?: string, limit?: number): Promise<WorkflowInstance[]>;

  /**
   * Find failed workflow instances with retry count
   */
  findFailedWithRetryCount(maxRetryCount: number, limit?: number): Promise<WorkflowInstance[]>;

  /**
   * Find workflow instances exceeding SLA
   */
  findExceedingSLA(limit?: number): Promise<WorkflowInstance[]>;

  /**
   * Update workflow instance status
   */
  updateStatus(id: WorkflowInstanceId, status: WorkflowInstanceStatus): Promise<void>;

  /**
   * Check if workflow instance exists
   */
  exists(id: WorkflowInstanceId): Promise<boolean>;
}
