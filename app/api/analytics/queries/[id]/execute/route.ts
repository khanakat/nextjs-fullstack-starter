import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AnalyticsService } from "@/lib/services/analytics-service";
import { z } from "zod";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { logger } from "@/lib/logger";
import { generateRequestId } from "@/lib/utils";
import { handleZodError } from "@/lib/error-handlers";

const executeQuerySchema = z.object({
  parameters: z.record(z.any()).optional(),
  limit: z.number().min(1).max(10000).default(1000),
  offset: z.number().min(0).default(0),
});

// POST /api/analytics/queries/[id]/execute - Execute query
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();

  try {
    logger.info("Executing analytics query", "analytics", {
      requestId,
      queryId: params.id,
    });

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      logger.warn("Unauthorized access attempt", "analytics", { requestId });
      return StandardErrorResponse.unauthorized(requestId);
    }

    const body = await _request.json();
    const { organizationId, ...executeData } = body;

    if (!organizationId) {
      logger.warn("Missing organization ID", "analytics", { requestId });
      return StandardErrorResponse.badRequest(
        "Organization ID is required",
        requestId,
      );
    }

    // Validate request data
    const validationResult = executeQuerySchema.safeParse(executeData);
    if (!validationResult.success) {
      logger.warn("Validation failed for query execution", "analytics", {
        requestId,
        errors: validationResult.error.errors,
      });
      return handleZodError(validationResult.error, requestId);
    }

    const validatedData = validationResult.data;

    const result = await AnalyticsService.executeQuery(session.user.id, {
      queryId: params.id,
      parameters: validatedData.parameters || {},
      useCache: true,
    });

    logger.info("Query executed successfully", "analytics", {
      requestId,
      queryId: params.id,
      rowCount: result.data?.length || 0,
    });

    return StandardSuccessResponse.ok(
      {
        data: result.data,
        metadata: {
          queryId: params.id,
          executedAt: new Date().toISOString(),
          rowCount: result.data?.length || 0,
          columns: result.columns,
        },
      },
      requestId,
    );
  } catch (error) {
    logger.error("Error executing query", "analytics", {
      requestId,
      queryId: params.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return StandardErrorResponse.internal("Failed to execute query", requestId);
  }
}
