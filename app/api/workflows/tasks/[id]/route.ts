import { NextRequest, NextResponse } from "next/server";
import { ApiError, errorResponse } from "@/lib/api-utils";
import { logger } from "@/lib/logger";
import { getCurrentAuthenticatedUser } from "@/lib/auth-helpers";
import { workflowService } from "@/lib/services/workflow/index";
import {
  UpdateWorkflowTaskRequestSchema,
  CompleteWorkflowTaskRequestSchema,
} from "@/lib/types/workflows";
import { z } from "zod";

// ============================================================================
// GET /api/workflows/tasks/[id] - Get workflow task by ID
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

    const task = await workflowService.getWorkflowTask(params.id);

    if (!task) {
      return NextResponse.json(
        { error: "Workflow task not found" },
        { status: 404 },
      );
    }

    // Check organization access - need to get instance first to get workflowId
    const instance = await workflowService.getWorkflowInstance(task.instanceId);
    if (!instance) {
      return NextResponse.json(
        { error: "Workflow instance not found" },
        { status: 404 },
      );
    }

    const workflow = await workflowService.getWorkflow(instance.workflowId);
    if (
      user.organizationId &&
      workflow &&
      workflow.organizationId !== user.organizationId
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(task);
  } catch (error) {
    logger.apiError("Error processing workflow request", "workflow", error, {
      resourceId: params.id,
      endpoint: "/api/workflows/tasks/:id",
    });

    if (error instanceof ApiError) {
      return errorResponse(error);
    }

    return errorResponse("Failed to process workflow request", 500);
  }
}

// ============================================================================
// PUT /api/workflows/tasks/[id] - Update workflow task
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
    const validatedData = UpdateWorkflowTaskRequestSchema.parse(body);

    // Update workflow task
    const task = await workflowService.updateWorkflowTask(
      params.id,
      validatedData,
      user.id, // ✅ Fixed: Using actual user ID from session instead of hardcoded 'user-id'
    );

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error updating workflow task:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to update workflow task" },
      { status: 500 },
    );
  }
}

// ============================================================================
// POST /api/workflows/tasks/[id]/complete - Complete workflow task
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
    const validatedData = CompleteWorkflowTaskRequestSchema.parse(body);

    // Complete workflow task
    const task = await workflowService.completeWorkflowTask(
      params.id,
      validatedData,
      user.id, // ✅ Fixed: Using actual user ID from session instead of hardcoded 'user-id'
    );

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error completing workflow task:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    if (error instanceof Error) {
      if (error.message === "Task not found") {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }
      if (
        error.message.includes("not assigned to you") ||
        error.message.includes("already completed")
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: "Failed to complete workflow task" },
      { status: 500 },
    );
  }
}
