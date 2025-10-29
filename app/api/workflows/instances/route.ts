import { NextRequest } from "next/server";
import { workflowService } from "@/lib/services/workflow/index";
import {
  getCurrentAuthenticatedUser,
  validateOrganizationAccess,
} from "@/lib/auth-helpers";
import { hasPermission } from "@/lib/permissions";
import { CreateWorkflowInstanceRequestSchema } from "@/lib/types/workflows";
import { z } from "zod";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { logger } from "@/lib/logger";
import { generateRequestId } from "@/lib/utils";
import { handleZodError } from "@/lib/error-handlers";

// Define the query parameters schema
const instancesQuerySchema = z.object({
  status: z
    .enum(["running", "completed", "failed", "cancelled", "paused"])
    .optional(),
  workflowId: z.string().optional(),
  organizationId: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

/**
 * GET /api/workflows/instances
 * Get workflow instances with optional filtering
 */
export async function GET(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    logger.info("Fetching workflow instances", "workflows", { requestId });

    const user = await getCurrentAuthenticatedUser();

    if (!user) {
      logger.warn(
        "Unauthorized access attempt to workflow instances",
        "workflows",
        { requestId },
      );
      return StandardErrorResponse.unauthorized(requestId);
    }

    // Check if user has permission to read workflows
    if (!hasPermission(user, "read", "templates")) {
      logger.warn(
        "Forbidden access attempt to workflow instances",
        "workflows",
        {
          requestId,
          userId: user.id,
        },
      );
      return StandardErrorResponse.forbidden(requestId);
    }

    // Parse and validate query parameters
    const url = new URL(_request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());

    const validationResult = instancesQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      logger.warn(
        "Invalid query parameters for workflow instances",
        "workflows",
        {
          requestId,
          errors: validationResult.error.errors,
        },
      );
      return handleZodError(validationResult.error, requestId);
    }

    const validatedQuery = validationResult.data;

    // Validate organization access and get the appropriate organization ID
    let organizationId: string | null;
    try {
      organizationId = await validateOrganizationAccess(
        validatedQuery.organizationId,
      );
    } catch (error) {
      logger.warn(
        "Access denied to organization for workflow instances",
        "workflows",
        {
          requestId,
          userId: user.id,
          requestedOrganizationId: validatedQuery.organizationId,
        },
      );
      return StandardErrorResponse.forbidden(requestId);
    }

    // Get workflow instances for the organization
    const result = await workflowService.getWorkflowInstances(
      {
        page: Math.floor(validatedQuery.offset / validatedQuery.limit) + 1,
        limit: validatedQuery.limit,
        workflowId: validatedQuery.workflowId,
        status: validatedQuery.status,
        sortBy: "startedAt",
        sortOrder: "desc",
      },
      organizationId || undefined,
    );

    logger.info("Workflow instances fetched successfully", "workflows", {
      requestId,
      userId: user.id,
      organizationId,
      count: result.instances?.length || 0,
      total: result.total,
    });

    return StandardSuccessResponse.ok(result, requestId);
  } catch (error) {
    logger.error("Error fetching workflow instances", "workflows", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return StandardErrorResponse.internal(
      "Failed to fetch workflow instances",
      requestId,
    );
  }
}

// ============================================================================
// POST /api/workflows/instances - Create workflow instance
// ============================================================================
export async function POST(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    logger.info("Creating workflow instance", "workflows", { requestId });

    const user = await getCurrentAuthenticatedUser();

    if (!user) {
      logger.warn(
        "Unauthorized access attempt to create workflow instance",
        "workflows",
        { requestId },
      );
      return StandardErrorResponse.unauthorized(requestId);
    }

    // Check if user has permission to create workflow instances
    if (!hasPermission(user, "create", "templates")) {
      logger.warn(
        "Forbidden access attempt to create workflow instance",
        "workflows",
        {
          requestId,
          userId: user.id,
        },
      );
      return StandardErrorResponse.forbidden(requestId);
    }

    const body = await _request.json();

    // Validate request body
    const validationResult =
      CreateWorkflowInstanceRequestSchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn(
        "Invalid request data for workflow instance creation",
        "workflows",
        {
          requestId,
          errors: validationResult.error.errors,
        },
      );
      return handleZodError(validationResult.error, requestId);
    }

    const validatedData = validationResult.data;

    // Create workflow instance
    const instance = await workflowService.createWorkflowInstance(
      validatedData,
      user.id,
      user.organizationId || undefined,
    );

    logger.info("Workflow instance created successfully", "workflows", {
      requestId,
      userId: user.id,
      instanceId: instance.id,
      workflowId: validatedData.workflowId,
    });

    return StandardSuccessResponse.created(instance, requestId);
  } catch (error) {
    logger.error("Error creating workflow instance", "workflows", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return StandardErrorResponse.internal(
      "Failed to create workflow instance",
      requestId,
    );
  }
}
