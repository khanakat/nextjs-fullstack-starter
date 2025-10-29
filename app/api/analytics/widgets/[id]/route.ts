import { NextRequest } from "next/server";
import { ApiError } from "@/lib/api-utils";
import { logger } from "@/lib/logger";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AnalyticsService } from "@/lib/services/analytics-service";
import { z } from "zod";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { generateRequestId } from "@/lib/utils";

const updateWidgetSchema = z.object({
  title: z.string().min(1).optional(),
  position: z
    .object({
      x: z.number().min(0),
      y: z.number().min(0),
      width: z.number().min(1),
      height: z.number().min(1),
    })
    .optional(),
  config: z
    .object({
      colors: z.array(z.string()).optional(),
      showLegend: z.boolean().optional(),
      showTooltip: z.boolean().optional(),
      format: z
        .object({
          type: z.enum(["number", "currency", "percentage"]),
          decimals: z.number().optional(),
          prefix: z.string().optional(),
          suffix: z.string().optional(),
        })
        .optional(),
      thresholds: z
        .array(
          z.object({
            value: z.number(),
            color: z.string(),
            label: z.string().optional(),
          }),
        )
        .optional(),
    })
    .partial()
    .optional(),
  queryId: z.string().optional(),
});

// GET /api/analytics/widgets/[id] - Get widget by ID
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        "analytics",
      );
    }

    const { searchParams } = new URL(_request.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return StandardErrorResponse.badRequest(
        "Organization ID is required",
        "analytics",
      );
    }

    logger.info("Fetching widget by ID", "analytics", {
      requestId,
      userId: session.user.id,
      widgetId: params.id,
      organizationId,
    });

    const widget = await AnalyticsService.getWidgetData(
      params.id,
      session.user.id,
      { organizationId },
    );

    if (!widget) {
      return StandardErrorResponse.notFound("Widget not found", "analytics");
    }

    logger.info("Successfully fetched widget", "analytics", {
      requestId,
      userId: session.user.id,
      widgetId: params.id,
      organizationId,
    });

    return StandardSuccessResponse.ok({ widget }, requestId);
  } catch (error) {
    logger.apiError("Error processing widget request", "analytics", error, {
      requestId,
      resourceId: params.id,
      endpoint: "/api/analytics/widgets/:id",
    });

    if (error instanceof ApiError) {
      return StandardErrorResponse.fromApiError(error, requestId);
    }

    return StandardErrorResponse.internal(
      "Failed to process widget request",
      requestId,
    );
  }
}

// PUT /api/analytics/widgets/[id] - Update widget
export async function PUT(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        "analytics",
      );
    }

    const body = await _request.json();
    const { organizationId, ...updateData } = body;

    if (!organizationId) {
      return StandardErrorResponse.badRequest(
        "Organization ID is required",
        "analytics",
      );
    }

    // Validate request data
    const validatedData = updateWidgetSchema.parse(updateData);

    logger.info("Updating widget", "analytics", {
      requestId,
      userId: session.user.id,
      widgetId: params.id,
      organizationId,
    });

    // For now, return a mock updated widget
    const widget = {
      id: params.id,
      ...validatedData,
      updatedAt: new Date().toISOString(),
    };

    logger.info("Successfully updated widget", "analytics", {
      requestId,
      userId: session.user.id,
      widgetId: params.id,
      organizationId,
    });

    return StandardSuccessResponse.ok({ widget }, requestId);
  } catch (error) {
    logger.apiError("Error updating widget", "analytics", error, {
      requestId,
      widgetId: params.id,
      endpoint: "/api/analytics/widgets/:id",
    });

    if (error instanceof z.ZodError) {
      return StandardErrorResponse.badRequest(
        "Invalid request data",
        "analytics",
        error.errors,
      );
    }

    return StandardErrorResponse.internal("Failed to update widget", requestId);
  }
}

// DELETE /api/analytics/widgets/[id] - Delete widget
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        "analytics",
      );
    }

    const { searchParams } = new URL(_request.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return StandardErrorResponse.badRequest(
        "Organization ID is required",
        "analytics",
      );
    }

    logger.info("Deleting widget", "analytics", {
      requestId,
      userId: session.user.id,
      widgetId: params.id,
      organizationId,
    });

    // For now, just return success without actual deletion

    logger.info("Successfully deleted widget", "analytics", {
      requestId,
      userId: session.user.id,
      widgetId: params.id,
      organizationId,
    });

    return StandardSuccessResponse.ok({ success: true }, requestId);
  } catch (error) {
    logger.apiError("Error processing widget request", "analytics", error, {
      requestId,
      resourceId: params.id,
      endpoint: "/api/analytics/widgets/:id",
    });

    if (error instanceof ApiError) {
      return StandardErrorResponse.fromApiError(error, requestId);
    }

    return StandardErrorResponse.internal(
      "Failed to process widget request",
      requestId,
    );
  }
}
