import { NextRequest } from "next/server";
import { ApiError } from "@/lib/api-utils";
import { logger } from "@/lib/logger";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AnalyticsService } from "@/lib/services/analytics-service";
import { CreateDashboardRequest } from "@/lib/types/analytics";
import { z } from "zod";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { generateRequestId } from "@/lib/utils";

const createDashboardSchema = z.object({
  name: z.string().min(1, "Dashboard name is required"),
  description: z.string().optional(),
  isDefault: z.boolean().default(false),
  layout: z.object({
    columns: z.number().min(1).max(24),
    rows: z.number().min(1).max(50),
  }),
  settings: z
    .object({
      refreshInterval: z.number().min(30000).default(300000),
      theme: z.enum(["light", "dark", "auto"]).default("light"),
      showFilters: z.boolean().default(true),
    })
    .optional(),
});

// GET /api/analytics/dashboards - List dashboards for organization
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
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return StandardErrorResponse.badRequest(
        "Organization ID is required",
        "analytics",
      );
    }

    logger.info("Fetching dashboards for organization", "analytics", {
      requestId,
      userId: session.user.id,
      organizationId,
    });

    const dashboards = await AnalyticsService.getDashboards(
      session.user.id,
      organizationId,
    );

    logger.info("Successfully fetched dashboards", "analytics", {
      requestId,
      userId: session.user.id,
      organizationId,
      dashboardCount: dashboards.dashboards.length,
      totalCount: dashboards.total,
    });

    return StandardSuccessResponse.ok({ dashboards }, requestId);
  } catch (error) {
    logger.apiError("Error processing dashboard request", "analytics", error, {
      requestId,
      endpoint: "/api/analytics/dashboards",
    });

    if (error instanceof ApiError) {
      return StandardErrorResponse.fromApiError(error, requestId);
    }

    return StandardErrorResponse.internal(
      "Failed to process dashboard request",
      requestId,
    );
  }
}

// POST /api/analytics/dashboards - Create new dashboard
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
    const { organizationId, ...dashboardData } = body;

    if (!organizationId) {
      return StandardErrorResponse.badRequest(
        "Organization ID is required",
        "analytics",
      );
    }

    // Validate request data
    const validatedData = createDashboardSchema.parse(dashboardData);

    logger.info("Creating new dashboard", "analytics", {
      requestId,
      userId: session.user.id,
      organizationId,
      dashboardName: validatedData.name,
    });

    const dashboard = await AnalyticsService.createDashboard(session.user.id, {
      ...validatedData,
      organizationId,
    } as CreateDashboardRequest);

    logger.info("Successfully created dashboard", "analytics", {
      requestId,
      userId: session.user.id,
      organizationId,
      dashboardId: dashboard.id,
      dashboardName: dashboard.name,
    });

    return StandardSuccessResponse.created({ dashboard }, requestId);
  } catch (error) {
    logger.apiError("Error creating dashboard", "analytics", error, {
      requestId,
      endpoint: "/api/analytics/dashboards",
    });

    if (error instanceof z.ZodError) {
      return StandardErrorResponse.badRequest(
        "Invalid request data",
        "analytics",
        error.errors,
      );
    }

    return StandardErrorResponse.internal(
      "Failed to create dashboard",
      requestId,
    );
  }
}
