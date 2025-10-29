import { NextRequest } from "next/server";
import { getCurrentAuthenticatedUser } from "@/lib/auth-helpers";
import { workflowService } from "@/lib/services/workflow/index";
import {
  CreateWorkflowRequestSchema,
  WorkflowQueryRequestSchema,
} from "@/lib/types/workflows";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { logger } from "@/lib/logger";
import { generateRequestId } from "@/lib/utils";
import { z } from "zod";

// ============================================================================
// GET /api/workflows - Get workflows with filtering and pagination
// ============================================================================
export async function GET(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const user = await getCurrentAuthenticatedUser();
    if (!user) {
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        "workflows",
        requestId,
      );
    }

    const { searchParams } = new URL(_request.url);

    // Parse query parameters
    const queryData = {
      page: searchParams.get("page")
        ? parseInt(searchParams.get("page")!)
        : undefined,
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : undefined,
      search: searchParams.get("search") || undefined,
      status: searchParams.get("status") || undefined,
      category: searchParams.get("category") || undefined,
      sortBy: searchParams.get("sortBy") || undefined,
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || undefined,
    };

    // Validate query parameters
    const validatedQuery = WorkflowQueryRequestSchema.parse(queryData);

    // Get organization ID from user
    const organizationId = user.organizationId || undefined;

    logger.info("Fetching workflows", "workflows", {
      requestId,
      userId: user.id,
      organizationId,
      queryParams: validatedQuery,
    });

    // Get workflows
    const result = await workflowService.getWorkflows(
      validatedQuery,
      organizationId,
    );

    logger.info("Workflows fetched successfully", "workflows", {
      requestId,
      userId: user.id,
      workflowCount: result.workflows?.length || 0,
      totalCount: result.total,
    });

    return StandardSuccessResponse.ok(result, requestId);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.apiError("Workflow query validation failed", "workflows", error, {
        requestId,
        validationErrors: error.errors,
      });

      return StandardErrorResponse.validation(error, requestId);
    }

    logger.apiError("Error fetching workflows", "workflows", error, {
      requestId,
    });

    return StandardErrorResponse.internal(
      "Failed to fetch workflows",
      { error: error instanceof Error ? error.message : "Unknown error" },
      requestId,
    );
  }
}

// ============================================================================
// POST /api/workflows - Create a new workflow
// ============================================================================
export async function POST(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const user = await getCurrentAuthenticatedUser();
    if (!user) {
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        "workflows",
        requestId,
      );
    }

    const body = await _request.json();

    // Validate request body
    const validatedData = CreateWorkflowRequestSchema.parse(body);

    // Get user and organization IDs
    const userId = user.id;
    const organizationId = user.organizationId || undefined;

    logger.info("Creating workflow", "workflows", {
      requestId,
      userId,
      organizationId,
      workflowName: validatedData.name,
    });

    // Create workflow
    const workflow = await workflowService.createWorkflow(
      validatedData,
      userId,
      organizationId,
    );

    logger.info("Workflow created successfully", "workflows", {
      requestId,
      userId,
      workflowId: workflow.id,
      workflowName: workflow.name,
    });

    return StandardSuccessResponse.created(workflow, requestId);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.apiError(
        "Workflow creation validation failed",
        "workflows",
        error,
        {
          requestId,
          validationErrors: error.errors,
        },
      );

      return StandardErrorResponse.validation(error, requestId);
    }

    logger.apiError("Error creating workflow", "workflows", error, {
      requestId,
    });

    return StandardErrorResponse.internal(
      "Failed to create workflow",
      { error: error instanceof Error ? error.message : "Unknown error" },
      requestId,
    );
  }
}
