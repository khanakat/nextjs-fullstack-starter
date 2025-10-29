// External dependencies
import { db as prisma } from "@/lib/db";

// Internal types
import {
  WorkflowTemplate,
  CreateWorkflowTemplateRequest,
  WorkflowTemplateQueryRequest,
} from "@/lib/types/workflows";
import {
  AuditLogResource,
  AuditLogCategory,
  AuditLogSeverity,
} from "@/lib/types/audit";

// Services
import { AuditService } from "@/lib/services/audit";

// ============================================================================
// WORKFLOW TEMPLATE SERVICE - Manages workflow templates
// ============================================================================

/**
 * Service for managing workflow templates
 */
export class WorkflowTemplateService {
  // ========================================
  // TEMPLATE CRUD OPERATIONS
  // ========================================

  /**
   * Create a new workflow template
   * @param data - Template creation data
   * @param userId - ID of the user creating the template
   * @param organizationId - Optional organization ID
   * @returns Promise resolving to the created template
   */
  async createWorkflowTemplate(
    data: CreateWorkflowTemplateRequest,
    userId: string,
    organizationId?: string,
  ): Promise<WorkflowTemplate> {
    try {
      const template = await prisma.workflowTemplate.create({
        data: {
          name: data.name,
          description: data.description,
          category: data.category,
          tags: JSON.stringify(data.tags || []),
          template: JSON.stringify(data.template),
          variables: JSON.stringify(data.variables || {}),
          settings: JSON.stringify(data.settings || {}),
          isPublic: data.isPublic || false,
          createdBy: userId,
          organizationId,
        },
      });

      // Log audit event
      await AuditService.log({
        resource: AuditLogResource.WORKFLOW_TEMPLATE,
        action: "create",
        resourceId: template.id,
        userId,
        organizationId,
        category: AuditLogCategory.WORKFLOW,
        severity: AuditLogSeverity.INFO,
        metadata: {
          templateId: template.id,
          templateName: template.name,
          category: template.category,
          isPublic: template.isPublic,
        },
      });

      return {
        ...template,
        description: template.description ?? undefined,
        organizationId: template.organizationId ?? undefined,
        workflowId: template.workflowId ?? undefined,
        rating: template.rating ?? undefined,
        createdBy: template.createdBy ?? undefined,
        tags: JSON.parse(template.tags),
        template: JSON.parse(template.template),
        variables: JSON.parse(template.variables),
        settings: JSON.parse(template.settings),
      };
    } catch (error) {
      throw new Error(
        `Failed to create workflow template: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get workflow templates with filtering and pagination
   * @param query - Query parameters for filtering and pagination
   * @param organizationId - Optional organization ID for filtering
   * @returns Promise resolving to workflow templates and total count
   */
  async getWorkflowTemplates(
    query: WorkflowTemplateQueryRequest,
    organizationId?: string,
  ): Promise<{ templates: WorkflowTemplate[]; total: number }> {
    try {
      const where: any = {
        OR: [
          { isPublic: true },
          ...(organizationId ? [{ organizationId }] : []),
        ],
        ...(query.category && { category: query.category }),
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
        ...(query.tags &&
          query.tags.length > 0 && {
            tags: {
              contains: JSON.stringify(query.tags),
            },
          }),
      };

      const [templates, total] = await Promise.all([
        prisma.workflowTemplate.findMany({
          where,
          orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
          skip: (query.page - 1) * query.limit,
          take: query.limit,
        }),
        prisma.workflowTemplate.count({ where }),
      ]);

      return {
        templates: templates.map((template) => ({
          ...template,
          description: template.description ?? undefined,
          organizationId: template.organizationId ?? undefined,
          workflowId: template.workflowId ?? undefined,
          rating: template.rating ?? undefined,
          createdBy: template.createdBy ?? undefined,
          tags: JSON.parse(template.tags),
          template: JSON.parse(template.template),
          variables: JSON.parse(template.variables),
          settings: JSON.parse(template.settings),
        })),
        total,
      };
    } catch (error) {
      throw new Error(
        `Failed to get workflow templates: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get a workflow template by ID
   * @param id - Template ID
   * @param organizationId - Optional organization ID for filtering
   * @returns Promise resolving to the workflow template or null if not found
   */
  async getWorkflowTemplate(
    id: string,
    organizationId?: string,
  ): Promise<WorkflowTemplate | null> {
    try {
      const template = await prisma.workflowTemplate.findFirst({
        where: {
          id,
          OR: [
            { isPublic: true },
            ...(organizationId ? [{ organizationId }] : []),
          ],
        },
      });

      if (!template) {
        return null;
      }

      return {
        ...template,
        description: template.description ?? undefined,
        organizationId: template.organizationId ?? undefined,
        workflowId: template.workflowId ?? undefined,
        rating: template.rating ?? undefined,
        createdBy: template.createdBy ?? undefined,
        tags: JSON.parse(template.tags),
        template: JSON.parse(template.template),
        variables: JSON.parse(template.variables),
        settings: JSON.parse(template.settings),
      };
    } catch (error) {
      throw new Error(
        `Failed to get workflow template: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Update a workflow template
   * @param id - Template ID
   * @param data - Update data
   * @param userId - ID of the user updating the template
   * @param organizationId - Optional organization ID
   * @returns Promise resolving to the updated workflow template
   */
  async updateWorkflowTemplate(
    id: string,
    data: Partial<CreateWorkflowTemplateRequest>,
    userId: string,
    organizationId?: string,
  ): Promise<WorkflowTemplate> {
    try {
      const updateData: any = {};

      if (data.name !== undefined) {
        updateData.name = data.name;
      }

      if (data.description !== undefined) {
        updateData.description = data.description;
      }

      if (data.category !== undefined) {
        updateData.category = data.category;
      }

      if (data.tags !== undefined) {
        updateData.tags = JSON.stringify(data.tags);
      }

      if (data.template !== undefined) {
        updateData.template = JSON.stringify(data.template);
      }

      if (data.variables !== undefined) {
        updateData.variables = JSON.stringify(data.variables);
      }

      if (data.settings !== undefined) {
        updateData.settings = JSON.stringify(data.settings);
      }

      if (data.isPublic !== undefined) {
        updateData.isPublic = data.isPublic;
      }

      const template = await prisma.workflowTemplate.update({
        where: {
          id,
          ...(organizationId && { organizationId }),
        },
        data: updateData,
      });

      // Log audit event
      await AuditService.log({
        resource: AuditLogResource.WORKFLOW_TEMPLATE,
        action: "update",
        resourceId: id,
        userId,
        organizationId,
        category: AuditLogCategory.WORKFLOW,
        severity: AuditLogSeverity.INFO,
        metadata: {
          templateId: id,
          changes: Object.keys(updateData),
        },
      });

      return {
        ...template,
        description: template.description ?? undefined,
        organizationId: template.organizationId ?? undefined,
        workflowId: template.workflowId ?? undefined,
        rating: template.rating ?? undefined,
        createdBy: template.createdBy ?? undefined,
        tags: JSON.parse(template.tags),
        template: JSON.parse(template.template),
        variables: JSON.parse(template.variables),
        settings: JSON.parse(template.settings),
      };
    } catch (error) {
      throw new Error(
        `Failed to update workflow template: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Delete a workflow template
   * @param id - Template ID
   * @param userId - ID of the user deleting the template
   * @param organizationId - Optional organization ID
   * @returns Promise that resolves when template is deleted
   */
  async deleteWorkflowTemplate(
    id: string,
    userId: string,
    organizationId?: string,
  ): Promise<void> {
    try {
      await prisma.workflowTemplate.delete({
        where: {
          id,
          ...(organizationId && { organizationId }),
        },
      });

      // Log audit event
      await AuditService.log({
        resource: AuditLogResource.WORKFLOW_TEMPLATE,
        action: "delete",
        resourceId: id,
        userId,
        organizationId,
        category: AuditLogCategory.WORKFLOW,
        severity: AuditLogSeverity.MEDIUM,
        metadata: {
          templateId: id,
        },
      });
    } catch (error) {
      throw new Error(
        `Failed to delete workflow template: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}

export const workflowTemplateService = new WorkflowTemplateService();
