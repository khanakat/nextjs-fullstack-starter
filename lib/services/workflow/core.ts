// External dependencies
import { db as prisma } from "@/lib/db";

// Internal types
import {
  Workflow,
  WorkflowWithDetails,
  WorkflowDefinition,
  WorkflowStatus,
  CreateWorkflowRequest,
  UpdateWorkflowRequest,
  WorkflowQueryRequest,
} from "@/lib/types/workflows";
import {
  AuditLogResource,
  AuditLogCategory,
  AuditLogSeverity,
} from "@/lib/types/audit";

// Services
import { AuditService } from "@/lib/services/audit";

// ============================================================================
// WORKFLOW CORE SERVICE - Basic CRUD operations for workflows
// ============================================================================

/**
 * Service for managing workflow CRUD operations and basic functionality
 */
export class WorkflowCoreService {
  // ========================================
  // WORKFLOW CRUD OPERATIONS
  // ========================================

  /**
   * Create a new workflow
   * @param data - Workflow creation data
   * @param userId - ID of the user creating the workflow
   * @param organizationId - Optional organization ID
   * @param context - Optional request context
   * @returns Promise resolving to the created workflow
   */
  async createWorkflow(
    data: CreateWorkflowRequest,
    userId: string,
    organizationId?: string,
    context?: { ipAddress?: string; userAgent?: string },
  ): Promise<Workflow> {
    try {
      const workflow = await prisma.workflow.create({
        data: {
          name: data.name,
          description: data.description,
          definition: JSON.stringify(data.definition),
          status: "draft",
          settings: JSON.stringify(data.settings || {}),
          variables: JSON.stringify(data.variables || {}),
          organizationId,
          createdBy: userId,
        },
      });

      // Log audit event
      await AuditService.log({
        resource: AuditLogResource.WORKFLOW,
        action: "create",
        resourceId: workflow.id,
        userId,
        organizationId,
        category: AuditLogCategory.WORKFLOW,
        severity: AuditLogSeverity.INFO,
        metadata: {
          workflowId: workflow.id,
          workflowName: workflow.name,
          ...context,
        },
      });

      return {
        ...workflow,
        definition: JSON.parse(workflow.definition) as WorkflowDefinition,
        settings: JSON.parse(workflow.settings),
        variables: JSON.parse(workflow.variables),
        description: workflow.description ?? undefined,
        status: workflow.status as WorkflowStatus,
        organizationId: workflow.organizationId ?? undefined,
        publishedAt: workflow.publishedAt ?? undefined,
        successRate: workflow.successRate ?? undefined,
        avgDuration: workflow.avgDuration ?? undefined,
      };
    } catch (error) {
      throw new Error(
        `Failed to create workflow: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get a workflow by ID with detailed information
   * @param id - Workflow ID
   * @param organizationId - Optional organization ID for filtering
   * @returns Promise resolving to the workflow with details or null if not found
   */
  async getWorkflow(
    id: string,
    organizationId?: string,
  ): Promise<WorkflowWithDetails | null> {
    try {
      const workflow = await prisma.workflow.findFirst({
        where: {
          id,
          ...(organizationId && { organizationId }),
        },
        include: {
          instances: {
            select: {
              id: true,
              status: true,
            },
            orderBy: { id: "desc" },
            take: 10,
          },
          _count: {
            select: {
              instances: true,
            },
          },
        },
      });

      if (!workflow) {
        return null;
      }

      // Calculate statistics
      const successRate = 0; // Simplified for now

      const avgDuration = 0; // Simplified for now since we don't have createdAt/completedAt in select

      return {
        ...workflow,
        definition: JSON.parse(workflow.definition) as WorkflowDefinition,
        settings: JSON.parse(workflow.settings),
        variables: JSON.parse(workflow.variables),
        description: workflow.description ?? undefined,
        status: workflow.status as WorkflowStatus,
        organizationId: workflow.organizationId ?? undefined,
        publishedAt: workflow.publishedAt ?? undefined,
        successRate: Math.round(successRate * 100) / 100,
        avgDuration: Math.round(avgDuration),
        totalInstances: workflow._count.instances,
        recentInstances: workflow.instances as any[], // Simplified type for now
        steps: [],
        instances: [],
        templates: [],
        permissions: [],
      };
    } catch (error) {
      throw new Error(
        `Failed to get workflow: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get workflows with filtering and pagination
   * @param query - Query parameters for filtering and pagination
   * @param organizationId - Optional organization ID for filtering
   * @returns Promise resolving to workflows and total count
   */
  async getWorkflows(
    query: WorkflowQueryRequest,
    organizationId?: string,
  ): Promise<{ workflows: Workflow[]; total: number }> {
    try {
      const where: any = {
        ...(organizationId && { organizationId }),
        ...(query.status && { status: query.status }),
        ...(query.search && {
          OR: [
            { name: { contains: query.search, mode: "insensitive" as const } },
            {
              description: {
                contains: query.search,
                mode: "insensitive" as const,
              },
            },
          ],
        }),
        // Date filtering removed for now due to schema mismatch
      };

      const [workflows, total] = await Promise.all([
        prisma.workflow.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (query.page - 1) * query.limit || 0,
          take: query.limit || 10,
        }),
        prisma.workflow.count({ where }),
      ]);

      return {
        workflows: workflows.map((workflow) => ({
          ...workflow,
          definition: JSON.parse(workflow.definition) as WorkflowDefinition,
          settings: JSON.parse(workflow.settings),
          variables: JSON.parse(workflow.variables),
          description: workflow.description ?? undefined,
          status: workflow.status as WorkflowStatus,
          organizationId: workflow.organizationId ?? undefined,
          publishedAt: workflow.publishedAt ?? undefined,
          successRate: workflow.successRate ?? undefined,
          avgDuration: workflow.avgDuration ?? undefined,
        })),
        total,
      };
    } catch (error) {
      throw new Error(
        `Failed to get workflows: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Update a workflow
   * @param id - Workflow ID
   * @param data - Update data
   * @param userId - ID of the user updating the workflow
   * @param organizationId - Optional organization ID
   * @returns Promise resolving to the updated workflow
   */
  async updateWorkflow(
    id: string,
    data: UpdateWorkflowRequest,
    userId: string,
    organizationId?: string,
  ): Promise<Workflow> {
    try {
      const updateData: any = {};

      if (data.name !== undefined) {
        updateData.name = data.name;
      }

      if (data.description !== undefined) {
        updateData.description = data.description;
      }

      if (data.definition !== undefined) {
        updateData.definition = JSON.stringify(data.definition);
      }

      if (data.status !== undefined) {
        updateData.status = data.status;
        if (data.status === "active") {
          updateData.publishedAt = new Date();
        }
      }

      if (data.settings !== undefined) {
        updateData.settings = JSON.stringify(data.settings);
      }

      if (data.variables !== undefined) {
        updateData.variables = JSON.stringify(data.variables);
      }

      const workflow = await prisma.workflow.update({
        where: {
          id,
          ...(organizationId && { organizationId }),
        },
        data: updateData,
      });

      // Log audit event
      await AuditService.log({
        resource: AuditLogResource.WORKFLOW,
        action: "update",
        resourceId: id,
        userId,
        organizationId,
        category: AuditLogCategory.WORKFLOW,
        severity: AuditLogSeverity.INFO,
        metadata: {
          workflowId: id,
          changes: Object.keys(updateData),
          status: data.status,
        },
      });

      return {
        ...workflow,
        definition: JSON.parse(workflow.definition) as WorkflowDefinition,
        settings: JSON.parse(workflow.settings),
        variables: JSON.parse(workflow.variables),
        description: workflow.description ?? undefined,
        status: workflow.status as WorkflowStatus,
        organizationId: workflow.organizationId ?? undefined,
        publishedAt: workflow.publishedAt ?? undefined,
        successRate: workflow.successRate ?? undefined,
        avgDuration: workflow.avgDuration ?? undefined,
      };
    } catch (error) {
      throw new Error(
        `Failed to update workflow: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Delete a workflow
   * @param id - Workflow ID
   * @param userId - ID of the user deleting the workflow
   * @param organizationId - Optional organization ID
   * @returns Promise that resolves when workflow is deleted
   */
  async deleteWorkflow(
    id: string,
    userId: string,
    organizationId?: string,
  ): Promise<void> {
    try {
      await prisma.workflow.delete({
        where: {
          id,
          ...(organizationId && { organizationId }),
        },
      });

      // Log audit event
      await AuditService.log({
        resource: AuditLogResource.WORKFLOW,
        action: "delete",
        resourceId: id,
        userId,
        organizationId,
        category: AuditLogCategory.WORKFLOW,
        severity: AuditLogSeverity.MEDIUM,
        metadata: {
          workflowId: id,
        },
      });
    } catch (error) {
      throw new Error(
        `Failed to delete workflow: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}

export const workflowCoreService = new WorkflowCoreService();
