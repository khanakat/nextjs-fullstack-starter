// External dependencies
import { db as prisma } from "@/lib/db";

// Internal types
import {
  WorkflowTask,
  CreateWorkflowTaskRequest,
  UpdateWorkflowTaskRequest,
  WorkflowTaskQueryRequest,
  CompleteWorkflowTaskRequest,
} from "@/lib/types/workflows";
import {
  AuditLogResource,
  AuditLogCategory,
  AuditLogSeverity,
} from "@/lib/types/audit";

// Services
import { AuditService } from "@/lib/services/audit";

// ============================================================================
// WORKFLOW TASK SERVICE - Manages workflow tasks
// ============================================================================

/**
 * Service for managing workflow tasks and their operations
 */
export class WorkflowTaskService {
  // ========================================
  // TASK CRUD OPERATIONS
  // ========================================

  /**
   * Create a new workflow task
   * @param data - Task creation data
   * @param userId - ID of the user creating the task
   * @param organizationId - Optional organization ID
   * @returns Promise resolving to the created task
   */
  async createWorkflowTask(
    data: CreateWorkflowTaskRequest,
    userId: string,
    _organizationId?: string,
  ): Promise<WorkflowTask> {
    try {
      const task = await prisma.workflowTask.create({
        data: {
          instanceId: data.instanceId,
          stepId: data.stepId,
          name: data.name,
          description: data.description,
          taskType: data.taskType || "manual",
          status: "pending",
          priority: data.priority || "normal",
          assignmentType: data.assignmentType || "manual",
          attachments: JSON.stringify(data.attachments || []),
          formData: JSON.stringify(data.formData || {}),
        },
      });

      // Log audit event
      await AuditService.log({
        resource: AuditLogResource.WORKFLOW_TASK,
        action: "create",
        resourceId: task.id,
        userId,
        category: AuditLogCategory.WORKFLOW,
        severity: AuditLogSeverity.INFO,
        metadata: {
          instanceId: data.instanceId,
          stepId: data.stepId,
          taskType: data.taskType,
          assignmentType: data.assignmentType,
        },
      });

      // Send notification to assignee if specified
      // Note: assignedTo is not available in the current schema

      return task as unknown as WorkflowTask;
    } catch (error) {
      throw new Error(
        `Failed to create workflow task: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get a workflow task by ID
   * @param id - Task ID
   * @returns Promise resolving to the workflow task or null if not found
   */
  async getWorkflowTask(id: string): Promise<WorkflowTask | null> {
    try {
      const task = await prisma.workflowTask.findUnique({
        where: { id },
        include: {
          instance: {
            include: {
              workflow: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
        },
      });

      if (!task) {
        return null;
      }

      return task as unknown as WorkflowTask;
    } catch (error) {
      throw new Error(
        `Failed to get workflow task: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get workflow tasks with filtering and pagination
   * @param query - Query parameters for filtering and pagination
   * @param organizationId - Optional organization ID for filtering
   * @returns Promise resolving to workflow tasks and total count
   */
  async getWorkflowTasks(
    query: WorkflowTaskQueryRequest,
    organizationId?: string,
  ): Promise<{ tasks: WorkflowTask[]; total: number }> {
    try {
      const where: any = {
        ...(organizationId && {
          instance: {
            organizationId,
          },
        }),
        ...(query.instanceId && { instanceId: query.instanceId }),
        ...(query.status && { status: query.status }),
        ...(query.taskType && { taskType: query.taskType }),
        ...(query.priority && { priority: query.priority }),
        ...(query.assigneeId && { assigneeId: query.assigneeId }),
        ...(query.isOverdue && {
          dueDate: {
            lt: new Date(),
          },
          status: {
            not: "completed",
          },
        }),
      };

      const [tasks, total] = await Promise.all([
        prisma.workflowTask.findMany({
          where,
          include: {
            instance: {
              include: {
                workflow: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                  },
                },
              },
            },
          },
          orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
          skip: (query.page - 1) * query.limit,
          take: query.limit,
        }),
        prisma.workflowTask.count({ where }),
      ]);

      return {
        tasks: tasks.map((task) => task as unknown as WorkflowTask),
        total,
      };
    } catch (error) {
      throw new Error(
        `Failed to get workflow tasks: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Update a workflow task
   * @param id - Task ID
   * @param data - Update data
   * @param userId - ID of the user updating the task
   * @returns Promise resolving to the updated workflow task
   */
  async updateWorkflowTask(
    id: string,
    data: UpdateWorkflowTaskRequest,
    userId: string,
  ): Promise<WorkflowTask> {
    try {
      const updateData: any = {};

      if (data.status !== undefined) {
        updateData.status = data.status;
        if (data.status === "completed") {
          updateData.completedAt = new Date();
        }
      }

      if (data.assigneeId !== undefined) {
        updateData.assigneeId = data.assigneeId;
      }

      if (data.dueDate !== undefined) {
        updateData.dueDate = data.dueDate;
      }

      if (data.formData !== undefined) {
        updateData.formData = JSON.stringify(data.formData);
      }

      if (data.attachments !== undefined) {
        updateData.attachments = JSON.stringify(data.attachments);
      }

      const task = await prisma.workflowTask.update({
        where: { id },
        data: updateData,
      });

      // Log audit event
      await AuditService.log({
        resource: AuditLogResource.WORKFLOW_TASK,
        action: "update",
        resourceId: id,
        userId,
        category: AuditLogCategory.WORKFLOW,
        severity: AuditLogSeverity.INFO,
        metadata: {
          changes: Object.keys(updateData),
          status: data.status,
        },
      });

      return task as unknown as WorkflowTask;
    } catch (error) {
      throw new Error(
        `Failed to update workflow task: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Complete a workflow task
   * @param id - Task ID
   * @param data - Completion data
   * @param userId - ID of the user completing the task
   * @param organizationId - Optional organization ID
   * @param _context - Optional request context
   * @returns Promise resolving to the completed workflow task
   */
  async completeWorkflowTask(
    id: string,
    data: CompleteWorkflowTaskRequest,
    userId: string,
    organizationId?: string,
    _context?: { ipAddress?: string; userAgent?: string },
  ): Promise<WorkflowTask> {
    try {
      const task = await this.getWorkflowTask(id);
      if (!task) {
        throw new Error("Workflow task not found");
      }

      if (task.status === "completed") {
        throw new Error("Task is already completed");
      }

      const updatedTask = await this.updateWorkflowTask(
        id,
        {
          status: "completed",
          formData: data.formData,
        },
        userId,
      );

      // Log audit event
      await AuditService.log({
        resource: AuditLogResource.WORKFLOW_TASK,
        action: "complete",
        resourceId: id,
        userId,
        organizationId,
        category: AuditLogCategory.WORKFLOW,
        severity: AuditLogSeverity.INFO,
        metadata: {
          instanceId: task.instanceId,
          stepId: task.stepId,
          completionData: data,
        },
      });

      return updatedTask;
    } catch (error) {
      throw new Error(
        `Failed to complete workflow task: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================
}

export const workflowTaskService = new WorkflowTaskService();
