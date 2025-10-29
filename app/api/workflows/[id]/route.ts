import { NextRequest } from "next/server";
import { ApiError, errorResponse } from "@/lib/api-utils";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { logger } from "@/lib/logger";
import { auth } from "@/lib/auth";
import { workflowService } from "@/lib/services/workflow/index";
import { db } from "@/lib/db";
import { generateRequestId } from "@/lib/utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();

    if (!userId) {
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        "workflows",
        requestId,
      );
    }

    const { id } = params;

    logger.info("Fetching workflow by ID", "workflows", {
      requestId,
      userId,
      workflowId: id,
    });

    // Get user's primary organization (first organization they're a member of)
    const userMembership = await db.organizationMember.findFirst({
      where: { userId },
      include: { organization: true },
    });

    const organizationId = userMembership?.organizationId || "default-org";

    const workflow = await workflowService.getWorkflow(id, organizationId);

    if (!workflow) {
      logger.info("Workflow not found", "workflows", {
        requestId,
        userId,
        workflowId: id,
        organizationId,
      });

      return StandardErrorResponse.notFound("Workflow not found", requestId);
    }

    logger.info("Workflow retrieved successfully", "workflows", {
      requestId,
      userId,
      workflowId: id,
      workflowName: workflow.name,
    });

    return StandardSuccessResponse.ok(workflow, requestId);
  } catch (error) {
    logger.apiError("Error processing workflow request", "workflows", error, {
      requestId,
      resourceId: params.id,
      endpoint: "/api/workflows/:id",
    });

    if (error instanceof ApiError) {
      return errorResponse(error);
    }

    return StandardErrorResponse.internal(
      "Failed to retrieve workflow",
      { error: error instanceof Error ? error.message : "Unknown error" },
      requestId,
    );
  }
}

export async function PUT(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();

    if (!userId) {
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        "workflows",
        requestId,
      );
    }

    const { id } = params;
    const body = await _request.json();

    logger.info("Updating workflow", "workflows", {
      requestId,
      userId,
      workflowId: id,
    });

    // Get user's primary organization (first organization they're a member of)
    const userMembership = await db.organizationMember.findFirst({
      where: { userId },
      include: { organization: true },
    });

    const organizationId = userMembership?.organizationId || "default-org";

    const workflow = await workflowService.updateWorkflow(
      id,
      body,
      userId || "anonymous",
      organizationId,
    );

    logger.info("Workflow updated successfully", "workflows", {
      requestId,
      userId,
      workflowId: id,
      workflowName: workflow.name,
    });

    return StandardSuccessResponse.updated(workflow, requestId);
  } catch (error) {
    logger.apiError("Error processing workflow request", "workflows", error, {
      requestId,
      resourceId: params.id,
      endpoint: "/api/workflows/:id",
    });

    if (error instanceof ApiError) {
      return errorResponse(error);
    }

    return StandardErrorResponse.internal(
      "Failed to update workflow",
      { error: error instanceof Error ? error.message : "Unknown error" },
      requestId,
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();

    if (!userId) {
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        "workflows",
        requestId,
      );
    }

    const { id } = params;

    logger.info("Deleting workflow", "workflows", {
      requestId,
      userId,
      workflowId: id,
    });

    // Get user's primary organization (first organization they're a member of)
    const userMembership = await db.organizationMember.findFirst({
      where: { userId },
      include: { organization: true },
    });

    const organizationId = userMembership?.organizationId || "default-org";

    await workflowService.deleteWorkflow(
      id,
      userId || "anonymous",
      organizationId,
    );

    logger.info("Workflow deleted successfully", "workflows", {
      requestId,
      userId,
      workflowId: id,
    });

    return StandardSuccessResponse.deleted(requestId, {
      message: "Workflow deleted successfully",
      workflowId: id,
    });
  } catch (error) {
    logger.apiError("Error processing workflow request", "workflows", error, {
      requestId,
      resourceId: params.id,
      endpoint: "/api/workflows/:id",
    });

    if (error instanceof ApiError) {
      return errorResponse(error);
    }

    return StandardErrorResponse.internal(
      "Failed to delete workflow",
      { error: error instanceof Error ? error.message : "Unknown error" },
      requestId,
    );
  }
}
