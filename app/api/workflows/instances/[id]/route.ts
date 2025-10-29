import { NextRequest, NextResponse } from "next/server";
import { ApiError, errorResponse } from "@/lib/api-utils";
import { logger } from "@/lib/logger";
import { getCurrentAuthenticatedUser } from "@/lib/auth-helpers";
import { workflowService } from "@/lib/services/workflow/index";
import {
  UpdateWorkflowInstanceRequestSchema,
  WorkflowActionRequestSchema,
} from "@/lib/types/workflows";
import { z } from "zod";

// ============================================================================
// GET /api/workflows/instances/[id] - Get workflow instance by ID
// ============================================================================
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const instance = await workflowService.getWorkflowInstance(params.id);

    if (!instance) {
      return NextResponse.json(
        { error: "Workflow instance not found" },
        { status: 404 },
      );
    }

    // Check organization access
    if (
      user.organizationId &&
      instance.workflow.organizationId !== user.organizationId
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(instance);
  } catch (error) {
    logger.apiError("Error processing workflow request", "workflow", error, {
      resourceId: params.id,
      endpoint: "/api/workflows/instances/:id",
    });

    if (error instanceof ApiError) {
      return errorResponse(error);
    }

    return errorResponse("Failed to process workflow request", 500);
  }
}

// ============================================================================
// PUT /api/workflows/instances/[id] - Update workflow instance
// ============================================================================
export async function PUT(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await _request.json();

    // Validate request body
    const validatedData = UpdateWorkflowInstanceRequestSchema.parse(body);

    // Update workflow instance
    const instance = await workflowService.updateWorkflowInstance(
      params.id,
      validatedData,
    );

    return NextResponse.json(instance);
  } catch (error) {
    console.error("Error updating workflow instance:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to update workflow instance" },
      { status: 500 },
    );
  }
}

// ============================================================================
// POST /api/workflows/instances/[id]/action - Perform workflow action
// ============================================================================
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await _request.json();

    // Validate request body
    const validatedData = WorkflowActionRequestSchema.parse(body);

    // Get user and organization IDs
    const userId = user.id;
    const organizationId = user.organizationId || undefined;

    // Perform workflow action
    const instance = await workflowService.performWorkflowAction(
      params.id,
      validatedData,
      userId,
      organizationId,
    );

    return NextResponse.json(instance);
  } catch (error) {
    console.error("Error performing workflow action:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    if (error instanceof Error) {
      if (error.message === "Workflow instance not found") {
        return NextResponse.json(
          { error: "Workflow instance not found" },
          { status: 404 },
        );
      }
      if (error.message.includes("Can only")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: "Failed to perform workflow action" },
      { status: 500 },
    );
  }
}
