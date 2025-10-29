import { NextRequest } from "next/server";
import { ApiError } from "@/lib/api-utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AnalyticsService } from "@/lib/services/analytics-service";
import { logger } from "@/lib/logger";
import { z } from "zod";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { generateRequestId } from "@/lib/utils";

const updateDashboardSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  isDefault: z.boolean().optional(),
  layout: z
    .object({
      columns: z.number().min(1).max(24),
      rows: z.number().min(1).max(50),
    })
    .optional(),
  settings: z
    .object({
      refreshInterval: z.number().min(30000),
      theme: z.enum(["light", "dark", "auto"]),
      showFilters: z.boolean(),
    })
    .partial()
    .optional(),
});

// GET /api/analytics/dashboards/[id] - Get dashboard by ID
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

    logger.info("Fetching dashboard by ID", "analytics", {
      requestId,
      userId: session.user.id,
      dashboardId: params.id,
      organizationId,
    });

    const dashboard = await AnalyticsService.getDashboardById(
      params.id,
      session.user.id,
      organizationId,
    );

    if (!dashboard) {
      return StandardErrorResponse.notFound("Dashboard not found", "analytics");
    }

    logger.info("Successfully fetched dashboard", "analytics", {
      requestId,
      userId: session.user.id,
      dashboardId: params.id,
      organizationId,
    });

    return StandardSuccessResponse.ok({ dashboard }, requestId);
  } catch (error) {
    logger.apiError("Error fetching dashboard", "analytics", error, {
      requestId,
      dashboardId: params.id,
      endpoint: "/api/analytics/dashboards/:id",
    });

    if (error instanceof ApiError) {
      return StandardErrorResponse.fromApiError(error, requestId);
    }

    return StandardErrorResponse.internal(
      "Failed to fetch dashboard",
      requestId,
    );
  }
}

// PUT /api/analytics/dashboards/[id] - Update dashboard
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
    const validatedData = updateDashboardSchema.parse(updateData);

    logger.info("Updating dashboard", "analytics", {
      requestId,
      userId: session.user.id,
      dashboardId: params.id,
      organizationId,
    });

    const dashboard = await AnalyticsService.updateDashboard(
      params.id,
      session.user.id,
      validatedData,
      organizationId,
    );

    logger.info("Successfully updated dashboard", "analytics", {
      requestId,
      userId: session.user.id,
      dashboardId: params.id,
      organizationId,
    });

    return StandardSuccessResponse.ok({ dashboard }, requestId);
  } catch (error) {
    logger.apiError("Error updating dashboard", "analytics", error, {
      requestId,
      dashboardId: params.id,
      endpoint: "/api/analytics/dashboards/:id",
    });

    if (error instanceof z.ZodError) {
      return StandardErrorResponse.badRequest(
        "Invalid request data",
        "analytics",
        error.errors,
      );
    }

    if (error instanceof ApiError) {
      return StandardErrorResponse.fromApiError(error, requestId);
    }

    return StandardErrorResponse.internal(
      "Failed to update dashboard",
      requestId,
    );
  }
}

// DELETE /api/analytics/dashboards/[id] - Delete dashboard
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

    logger.info("Deleting dashboard", "analytics", {
      requestId,
      userId: session.user.id,
      dashboardId: params.id,
      organizationId,
    });

    await AnalyticsService.deleteDashboard(
      params.id,
      session.user.id,
      organizationId,
    );

    logger.info("Successfully deleted dashboard", "analytics", {
      requestId,
      userId: session.user.id,
      dashboardId: params.id,
      organizationId,
    });

    return StandardSuccessResponse.ok({ success: true }, requestId);
  } catch (error) {
    logger.apiError("Error deleting dashboard", "analytics", error, {
      requestId,
      dashboardId: params.id,
      endpoint: "/api/analytics/dashboards/:id",
    });

    if (error instanceof ApiError) {
      return StandardErrorResponse.fromApiError(error, requestId);
    }

    return StandardErrorResponse.internal(
      "Failed to delete dashboard",
      requestId,
    );
  }
}
