import { WorkflowTask, WorkflowTaskStatus, TaskType, Priority } from '../entities/workflow-task';
import { WorkflowTaskId } from '../value-objects/workflow-task-id';

// Re-export for convenience
export { WorkflowTask };
export type { WorkflowTaskStatus, TaskType, Priority };

/**
 * Workflow Task Repository Interface
 */
export interface IWorkflowTaskRepository {
  /**
   * Save a workflow task (create or update)
   */
  save(task: WorkflowTask): Promise<void>;

  /**
   * Find workflow task by ID
   */
  findById(id: WorkflowTaskId): Promise<WorkflowTask | null>;

  /**
   * Find tasks by instance ID
   */
  findByInstanceId(instanceId: string, options?: {
    status?: WorkflowTaskStatus;
    taskType?: TaskType;
    limit?: number;
    offset?: number;
  }): Promise<WorkflowTask[]>;

  /**
   * Find tasks by assignee ID
   */
  findByAssigneeId(assigneeId: string, options?: {
    status?: WorkflowTaskStatus;
    taskType?: TaskType;
    isOverdue?: boolean;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ tasks: WorkflowTask[]; total: number }>;

  /**
   * Find tasks by status
   */
  findByStatus(status: WorkflowTaskStatus, options?: {
    organizationId?: string;
    limit?: number;
    offset?: number;
  }): Promise<WorkflowTask[]>;

  /**
   * Find all workflow tasks with filtering and pagination
   */
  findAll(options?: {
    instanceId?: string;
    assigneeId?: string;
    status?: WorkflowTaskStatus;
    taskType?: TaskType;
    priority?: Priority;
    isOverdue?: boolean;
    organizationId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ tasks: WorkflowTask[]; total: number }>;

  /**
   * Delete a workflow task
   */
  delete(id: WorkflowTaskId): Promise<void>;

  /**
   * Count tasks by status
   */
  countByStatus(status?: WorkflowTaskStatus, assigneeId?: string): Promise<number>;

  /**
   * Count tasks by instance
   */
  countByInstance(instanceId: string, status?: WorkflowTaskStatus): Promise<number>;

  /**
   * Find active tasks (pending or in progress)
   */
  findActive(assigneeId?: string, limit?: number): Promise<WorkflowTask[]>;

  /**
   * Find overdue tasks
   */
  findOverdue(assigneeId?: string, limit?: number): Promise<WorkflowTask[]>;

  /**
   * Find tasks exceeding SLA
   */
  findExceedingSLA(limit?: number): Promise<WorkflowTask[]>;

  /**
   * Update task status
   */
  updateStatus(id: WorkflowTaskId, status: WorkflowTaskStatus): Promise<void>;

  /**
   * Assign task to user
   */
  assignTo(id: WorkflowTaskId, assigneeId: string, assignedBy: string): Promise<void>;

  /**
   * Check if task exists
   */
  exists(id: WorkflowTaskId): Promise<boolean>;

  /**
   * Bulk save tasks
   */
  saveMany(tasks: WorkflowTask[]): Promise<void>;
}
