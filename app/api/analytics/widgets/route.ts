import { NextRequest } from "next/server";
import { ApiError } from "@/lib/api-utils";
import { logger } from "@/lib/logger";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { z } from "zod";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { generateRequestId } from "@/lib/utils";

const createWidgetSchema = z.object({
  title: z.string().min(1, "Widget title is required"),
  type: z.enum(["kpi", "line", "bar", "pie", "area", "scatter", "heatmap"]),
  position: z.object({
    x: z.number().min(0),
    y: z.number().min(0),
    width: z.number().min(1),
    height: z.number().min(1),
  }),
  config: z.object({
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
  }),
  queryId: z.string().min(1, "Query ID is required"),
  dashboardId: z.string().min(1, "Dashboard ID is required"),
});

// GET /api/analytics/widgets - List widgets for dashboard
export async function GET(_request: NextRequest) {
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
    const dashboardId = searchParams.get("dashboardId");
    const organizationId = searchParams.get("organizationId");

    if (!dashboardId || !organizationId) {
      return StandardErrorResponse.badRequest(
        "Dashboard ID and Organization ID are required",
        "analytics",
      );
    }

    logger.info("Fetching widgets for dashboard", "analytics", {
      requestId,
      userId: session.user.id,
      dashboardId,
      organizationId,
    });

    // Return empty widgets array for now
    const widgets: any[] = [];

    logger.info("Successfully fetched widgets", "analytics", {
      requestId,
      userId: session.user.id,
      dashboardId,
      organizationId,
      widgetCount: widgets.length,
    });

    return StandardSuccessResponse.ok({ widgets }, requestId);
  } catch (error) {
    logger.apiError("Error processing widget request", "analytics", error, {
      requestId,
      endpoint: "/api/analytics/widgets",
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

// POST /api/analytics/widgets - Create new widget
export async function POST(_request: NextRequest) {
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
    const { organizationId, ...widgetData } = body;

    if (!organizationId) {
      return StandardErrorResponse.badRequest(
        "Organization ID is required",
        "analytics",
      );
    }

    // Validate request data
    const validatedData = createWidgetSchema.parse(widgetData);

    logger.info("Creating new widget", "analytics", {
      requestId,
      userId: session.user.id,
      organizationId,
      widgetTitle: validatedData.title,
      widgetType: validatedData.type,
      dashboardId: validatedData.dashboardId,
    });

    // For now, return a mock created widget
    const widget = {
      id: `widget_${Date.now()}`,
      ...validatedData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    logger.info("Successfully created widget", "analytics", {
      requestId,
      userId: session.user.id,
      organizationId,
      widgetId: widget.id,
      widgetTitle: widget.title,
      dashboardId: widget.dashboardId,
    });

    return StandardSuccessResponse.created({ widget }, requestId);
  } catch (error) {
    logger.apiError("Error creating widget", "analytics", error, {
      requestId,
      endpoint: "/api/analytics/widgets",
    });

    if (error instanceof z.ZodError) {
      return StandardErrorResponse.badRequest(
        "Invalid request data",
        "analytics",
        error.errors,
      );
    }

    return StandardErrorResponse.internal("Failed to create widget", requestId);
  }
}
