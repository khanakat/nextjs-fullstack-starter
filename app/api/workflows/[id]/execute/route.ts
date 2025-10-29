import { NextRequest, NextResponse } from "next/server";
import { ApiError, errorResponse } from "@/lib/api-utils";
import { logger } from "@/lib/logger";
import { auth } from "@/lib/auth";
import { workflowService } from "@/lib/services/workflow";
import { db } from "@/lib/db";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await _request.json();
    const { inputs } = body;

    // Get user's primary organization (first organization they're a member of)
    const userMembership = await db.organizationMember.findFirst({
      where: { userId },
      include: { organization: true },
    });

    const organizationId = userMembership?.organizationId || "default-org";

    // Execute the workflow
    const result = await workflowService.executeWorkflow(
      {
        workflowId: id,
        data: inputs,
        variables: {},
        priority: "normal",
      },
      userId || "anonymous",
      organizationId,
    );

    return NextResponse.json(result);
  } catch (error) {
    logger.apiError("Error processing workflow request", "workflow", error, {
      resourceId: params.id,
      endpoint: "/api/workflows/:id/execute",
    });

    if (error instanceof ApiError) {
      return errorResponse(error);
    }

    return errorResponse("Failed to process workflow request", 500);
  }
}
