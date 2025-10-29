import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuthenticatedUser } from "@/lib/auth-helpers";
import { workflowService } from "@/lib/services/workflow/index";
import {
  CreateWorkflowTaskRequestSchema,
  WorkflowTaskQueryRequestSchema,
} from "@/lib/types/workflows";
import { z } from "zod";

// ============================================================================
// GET /api/workflows/tasks - Get workflow tasks with filtering
// ============================================================================
export async function GET(_request: NextRequest) {
  try {
    const user = await getCurrentAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(_request.url);

    // Parse query parameters
    const queryData = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "10"),
      instanceId: searchParams.get("instanceId") || undefined,
      assigneeId: searchParams.get("assigneeId") || undefined,
      status: searchParams.get("status") || undefined,
      taskType: searchParams.get("taskType") || undefined,
      priority: searchParams.get("priority") || undefined,
      isOverdue: searchParams.get("isOverdue")
        ? searchParams.get("isOverdue") === "true"
        : undefined,
      sortBy: searchParams.get("sortBy") || "createdAt",
      sortOrder: (searchParams.get("sortOrder") || "desc") as "asc" | "desc",
    };

    // Validate query parameters
    const validatedQuery = WorkflowTaskQueryRequestSchema.parse(queryData);

    // Get organization ID from user
    const organizationId = user.organizationId || undefined;

    // Get workflow tasks
    const result = await workflowService.getWorkflowTasks(
      validatedQuery,
      organizationId,
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching workflow tasks:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch workflow tasks" },
      { status: 500 },
    );
  }
}

// ============================================================================
// POST /api/workflows/tasks - Create workflow task
// ============================================================================
export async function POST(_request: NextRequest) {
  try {
    const user = await getCurrentAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await _request.json();

    // Validate request body
    const validatedData = CreateWorkflowTaskRequestSchema.parse(body);

    // Create workflow task with actual user ID from session
    const task = await workflowService.createWorkflowTask(
      validatedData,
      user.id, // ✅ Fixed: Using actual user ID from session instead of hardcoded 'user-id'
    );

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating workflow task:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create workflow task" },
      { status: 500 },
    );
  }
}
