// External dependencies
import { db as prisma } from "@/lib/db";

// Internal types
import {
  WorkflowInstance,
  WorkflowInstanceWithDetails,
  WorkflowNode,
  ExecuteWorkflowRequest,
  CreateWorkflowInstanceRequest,
  WorkflowInstanceQueryRequest,
  UpdateWorkflowInstanceRequest,
  WorkflowActionRequest,
  WorkflowInstanceStatus,
} from "@/lib/types/workflows";
import {
  AuditLogResource,
  AuditLogCategory,
  AuditLogSeverity,
} from "@/lib/types/audit";

// Services
import { AuditService } from "@/lib/services/audit";
import { getStepProcessor } from "./processors";

// ============================================================================
// WORKFLOW EXECUTION SERVICE - Handles workflow instance execution
// ============================================================================

/**
 * Service for managing workflow execution and instance lifecycle
 */
export class WorkflowExecutionService {
  // ========================================
  // WORKFLOW EXECUTION
  // ========================================

  /**
   * Execute a workflow by creating a new instance and starting execution
   * @param request - Workflow execution request
   * @param userId - ID of the user executing the workflow
   * @param organizationId - Optional organization ID
   * @param _context - Optional execution context
   * @returns Promise resolving to the created workflow instance
   */
  async executeWorkflow(
    request: ExecuteWorkflowRequest,
    userId: string,
    organizationId?: string,
    _context?: { ipAddress?: string; userAgent?: string },
  ): Promise<WorkflowInstance> {
    try {
      const workflow = await prisma.workflow.findFirst({
        where: {
          id: request.workflowId,
          ...(organizationId && { organizationId }),
        },
      });

      if (!workflow) {
        throw new Error("Workflow not found");
      }

      const instance = await this.createWorkflowInstance(
        {
          workflowId: request.workflowId,
          data: request.data,
          variables: request.variables,
          context: {},
          priority: request.priority,
          triggerType: "manual",
          triggerData: {},
          slaDeadline: request.slaDeadline,
        },
        userId,
        organizationId,
      );

      // Start processing the workflow
      await this.processWorkflowInstance(instance.id);

      return instance as unknown as WorkflowInstance;
    } catch (error) {
      throw new Error(
        `Failed to execute workflow: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Process a workflow instance by executing its current step
   * @param instanceId - ID of the workflow instance to process
   * @returns Promise that resolves when processing is complete
   */
  async processWorkflowInstance(instanceId: string): Promise<void> {
    try {
      const instance = await this.getWorkflowInstance(instanceId);
      if (!instance) {
        throw new Error("Workflow instance not found");
      }

      if (instance.status !== "running") {
        return;
      }

      // Process current step
      const currentStep = instance.workflow.definition.nodes.find(
        (node) => node.id === instance.currentStepId,
      );
      if (currentStep) {
        await this.processWorkflowStep(instance, currentStep);
      }
    } catch (error) {
      throw new Error(
        `Failed to process workflow instance: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Process a single workflow step
   * @param instance - Workflow instance with details
   * @param step - Workflow step to process
   * @returns Promise that resolves when step processing is complete
   */
  private async processWorkflowStep(
    instance: WorkflowInstanceWithDetails,
    step: WorkflowNode,
  ): Promise<void> {
    try {
      const processor = getStepProcessor(step.type);
      const result = await processor.process(instance, step);

      if (result.completed) {
        if (result.nextStepId) {
          await this.moveToNextStep(instance, step, result.nextStepId);
        } else {
          // Mark workflow as completed
          await prisma.workflowInstance.update({
            where: { id: instance.id },
            data: {
              status: "completed",
              completedAt: new Date(),
            },
          });
        }
      }
    } catch (error) {
      // Mark workflow as failed
      await prisma.workflowInstance.update({
        where: { id: instance.id },
        data: {
          status: "failed",
        },
      });
      throw error;
    }
  }

  /**
   * Move workflow instance to the next step
   * @param instance - Workflow instance with details
   * @param _currentStep - Current workflow step
   * @param nextStepId - ID of the next step to move to
   * @returns Promise that resolves when step transition is complete
   */
  private async moveToNextStep(
    instance: WorkflowInstanceWithDetails,
    _currentStep: WorkflowNode,
    nextStepId?: string,
  ): Promise<void> {
    await prisma.workflowInstance.update({
      where: { id: instance.id },
      data: {
        currentStepId: nextStepId,
      },
    });

    // Continue processing if there's a next step
    if (nextStepId) {
      await this.processWorkflowInstance(instance.id);
    }
  }

  // ========================================
  // WORKFLOW INSTANCE MANAGEMENT
  // ========================================

  /**
   * Create a new workflow instance
   * @param data - Instance creation data
   * @param userId - ID of the user creating the instance
   * @param organizationId - Optional organization ID
   * @returns Promise resolving to the created workflow instance
   */
  async createWorkflowInstance(
    data: CreateWorkflowInstanceRequest,
    userId: string,
    organizationId?: string,
  ): Promise<WorkflowInstance> {
    try {
      const workflow = await prisma.workflow.findFirst({
        where: {
          id: data.workflowId,
          ...(organizationId && { organizationId }),
        },
      });

      if (!workflow) {
        throw new Error("Workflow not found");
      }

      const definition =
        typeof workflow.definition === "string"
          ? JSON.parse(workflow.definition)
          : workflow.definition;

      const startNode = definition.nodes.find(
        (node: WorkflowNode) => node.type === "start",
      );
      if (!startNode) {
        throw new Error("Workflow must have a start node");
      }

      const instance = await prisma.workflowInstance.create({
        data: {
          workflowId: data.workflowId,
          status: "running",
          priority: data.priority || "normal",
          triggerType: data.triggerType || "manual",
          triggerData: JSON.stringify(data.triggerData || {}),
          data: JSON.stringify(data.data || {}),
          context: JSON.stringify(data.context || {}),
          variables: JSON.stringify(data.variables || {}),
          currentStepId: startNode.id,
          slaDeadline: data.slaDeadline,
          triggeredBy: userId,
          ...(organizationId && { organizationId }),
        },
      });

      // Log audit event
      await AuditService.log({
        resource: AuditLogResource.WORKFLOW_INSTANCE,
        action: "create",
        resourceId: instance.id,
        userId,
        organizationId,
        category: AuditLogCategory.WORKFLOW,
        severity: AuditLogSeverity.INFO,
        metadata: {
          workflowId: data.workflowId,
          priority: data.priority,
          triggerType: data.triggerType,
        },
      });

      return instance as unknown as WorkflowInstance;
    } catch (error) {
      throw new Error(
        `Failed to create workflow instance: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get a workflow instance with full details
   * @param id - ID of the workflow instance
   * @returns Promise resolving to the workflow instance with details or null if not found
   */
  async getWorkflowInstance(
    id: string,
  ): Promise<WorkflowInstanceWithDetails | null> {
    try {
      const instance = await prisma.workflowInstance.findUnique({
        where: { id },
        include: {
          workflow: true,
          tasks: true,
        },
      });

      if (!instance) {
        return null;
      }

      return instance as unknown as WorkflowInstanceWithDetails;
    } catch (error) {
      throw new Error(
        `Failed to get workflow instance: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get workflow instances with filtering and pagination
   * @param query - Query parameters for filtering and pagination
   * @param organizationId - Optional organization ID for filtering
   * @returns Promise resolving to workflow instances and total count
   */
  async getWorkflowInstances(
    query: WorkflowInstanceQueryRequest,
    organizationId?: string,
  ): Promise<{ instances: WorkflowInstance[]; total: number }> {
    try {
      const where: any = {
        ...(organizationId && { organizationId }),
        ...(query.workflowId && { workflowId: query.workflowId }),
        ...(query.status && { status: query.status }),
        ...(query.priority && { priority: query.priority }),

        ...(query.triggeredBy && { triggeredBy: query.triggeredBy }),
      };

      const [instances, total] = await Promise.all([
        prisma.workflowInstance.findMany({
          where,
          orderBy: { id: "desc" },
          skip: (query.page - 1) * query.limit || 0,
          take: query.limit || 50,
        }),
        prisma.workflowInstance.count({ where }),
      ]);

      return {
        instances: instances as unknown as WorkflowInstance[],
        total,
      };
    } catch (error) {
      throw new Error(
        `Failed to get workflow instances: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Update a workflow instance
   * @param id - ID of the workflow instance to update
   * @param data - Update data
   * @returns Promise resolving to the updated workflow instance
   */
  async updateWorkflowInstance(
    id: string,
    data: UpdateWorkflowInstanceRequest,
  ): Promise<WorkflowInstance> {
    try {
      const updateData: any = {};

      if (data.status !== undefined) {
        updateData.status = data.status;
        if (data.status === "completed") {
          updateData.completedAt = new Date();
        }
      }

      if (data.priority !== undefined) {
        updateData.priority = data.priority;
      }

      if (data.data !== undefined) {
        updateData.data = JSON.stringify(data.data);
      }

      if (data.context !== undefined) {
        updateData.context = JSON.stringify(data.context);
      }

      if (data.variables !== undefined) {
        updateData.variables = JSON.stringify(data.variables);
      }

      if (data.currentStepId !== undefined) {
        updateData.currentStepId = data.currentStepId;
      }

      if (data.errorMessage !== undefined) {
        updateData.errorMessage = data.errorMessage;
      }

      const instance = await prisma.workflowInstance.update({
        where: { id },
        data: updateData,
      });

      return instance as unknown as WorkflowInstance;
    } catch (error) {
      throw new Error(
        `Failed to update workflow instance: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Perform an action on a workflow instance (pause, resume, cancel)
   * @param instanceId - ID of the workflow instance
   * @param action - Action to perform
   * @param userId - ID of the user performing the action
   * @param organizationId - Optional organization ID
   * @returns Promise resolving to the updated workflow instance
   */
  async performWorkflowAction(
    instanceId: string,
    action: WorkflowActionRequest,
    userId: string,
    organizationId?: string,
  ): Promise<WorkflowInstance> {
    try {
      const instance = await this.getWorkflowInstance(instanceId);
      if (!instance) {
        throw new Error("Workflow instance not found");
      }

      let newStatus: WorkflowInstanceStatus;
      let completedAt: Date | null = null;

      switch (action.action) {
        case "pause":
          if (instance.status !== "running") {
            throw new Error("Can only pause running workflows");
          }
          newStatus = "paused";
          break;
        case "resume":
          if (instance.status !== "paused") {
            throw new Error("Can only resume paused workflows");
          }
          newStatus = "running";
          break;
        case "cancel":
          if (
            instance.status === "completed" ||
            instance.status === "cancelled"
          ) {
            throw new Error(
              "Cannot cancel completed or already cancelled workflows",
            );
          }
          newStatus = "cancelled";
          completedAt = new Date();
          break;
        default:
          throw new Error(`Unknown action type: ${action.action}`);
      }

      const updatedInstance = await this.updateWorkflowInstance(instanceId, {
        status: newStatus,
        ...(completedAt && { completedAt }),
      });

      // Log audit event
      await AuditService.log({
        resource: AuditLogResource.WORKFLOW_INSTANCE,
        action: action.action,
        resourceId: instanceId,
        userId,
        organizationId,
        category: AuditLogCategory.WORKFLOW,
        severity: AuditLogSeverity.INFO,
        metadata: {
          previousStatus: instance.status,
          newStatus,
          reason: action.reason,
        },
      });

      return updatedInstance;
    } catch (error) {
      throw new Error(
        `Failed to perform workflow action: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}

export const workflowExecutionService = new WorkflowExecutionService();
