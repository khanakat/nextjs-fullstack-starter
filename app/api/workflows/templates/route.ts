import { NextRequest } from "next/server";
import { getCurrentAuthenticatedUser } from "@/lib/auth-helpers";
import { workflowService } from "@/lib/services/workflow/index";
import {
  CreateWorkflowTemplateRequestSchema,
  WorkflowTemplateQueryRequestSchema,
} from "@/lib/types/workflows";

import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { logger } from "@/lib/logger";
import { generateRequestId } from "@/lib/utils";
import { handleZodError } from "@/lib/error-handlers";

// ============================================================================
// GET /api/workflows/templates - Get workflow templates with filtering
// ============================================================================
export async function GET(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    logger.info("Fetching workflow templates", "workflows", { requestId });

    const user = await getCurrentAuthenticatedUser();
    if (!user) {
      logger.warn("Unauthorized access attempt", "workflows", { requestId });
      return StandardErrorResponse.unauthorized(requestId);
    }

    const { searchParams } = new URL(_request.url);

    // Parse query parameters
    const queryData = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "10"),
      search: searchParams.get("search") || undefined,
      category: searchParams.get("category") || undefined,
      isBuiltIn: searchParams.get("isBuiltIn")
        ? searchParams.get("isBuiltIn") === "true"
        : undefined,
      isPublic: searchParams.get("isPublic")
        ? searchParams.get("isPublic") === "true"
        : undefined,
      tags: searchParams.get("tags")
        ? searchParams.get("tags")!.split(",")
        : undefined,
      sortBy: searchParams.get("sortBy") || "createdAt",
      sortOrder: (searchParams.get("sortOrder") || "desc") as "asc" | "desc",
    };

    // Validate query parameters
    const validationResult =
      WorkflowTemplateQueryRequestSchema.safeParse(queryData);
    if (!validationResult.success) {
      logger.warn("Invalid query parameters", "workflows", {
        requestId,
        errors: validationResult.error.errors,
      });
      return handleZodError(validationResult.error, requestId);
    }

    const validatedQuery = validationResult.data;

    // Get organization ID from user
    const organizationId = user.organizationId || undefined;

    // Get workflow templates
    const result = await workflowService.getWorkflowTemplates(
      validatedQuery,
      organizationId,
    );

    logger.info("Workflow templates fetched successfully", "workflows", {
      requestId,
      count: result.templates?.length || 0,
      total: result.total,
    });

    return StandardSuccessResponse.ok(result, requestId);
  } catch (error) {
    logger.error("Error fetching workflow templates", "workflows", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return StandardErrorResponse.internal(
      "Failed to fetch workflow templates",
      requestId,
    );
  }
}

// ============================================================================
// POST /api/workflows/templates - Create workflow template
// ============================================================================
export async function POST(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    logger.info("Creating workflow template", "workflows", { requestId });

    const user = await getCurrentAuthenticatedUser();
    if (!user) {
      logger.warn("Unauthorized access attempt", "workflows", { requestId });
      return StandardErrorResponse.unauthorized(requestId);
    }

    const body = await _request.json();

    // Validate request body
    const validationResult =
      CreateWorkflowTemplateRequestSchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn(
        "Invalid request data for workflow template creation",
        "workflows",
        {
          requestId,
          errors: validationResult.error.errors,
        },
      );
      return handleZodError(validationResult.error, requestId);
    }

    const validatedData = validationResult.data;

    // Get user ID and organization ID from authenticated user
    const userId = user.id;
    const organizationId = user.organizationId || undefined;

    // Create workflow template
    const template = await workflowService.createWorkflowTemplate(
      validatedData,
      userId,
      organizationId,
    );

    logger.info("Workflow template created successfully", "workflows", {
      requestId,
      templateId: template.id,
      templateName: template.name,
    });

    return StandardSuccessResponse.created(template, requestId);
  } catch (error) {
    logger.error("Error creating workflow template", "workflows", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return StandardErrorResponse.internal(
      "Failed to create workflow template",
      requestId,
    );
  }
}
