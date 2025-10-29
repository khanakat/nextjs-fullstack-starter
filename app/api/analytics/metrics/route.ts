import { NextRequest } from "next/server";
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

const metricsQuerySchema = z.object({
  metrics: z.array(z.string()).optional(),
  dateRange: z
    .object({
      from: z.string(),
      to: z.string(),
    })
    .optional(),
  groupBy: z.enum(["hour", "day", "week", "month"]).default("day"),
  filters: z.record(z.any()).optional(),
});

// GET /api/analytics/metrics - Get analytics metrics
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

    // Parse query parameters
    const queryParams = {
      metrics: searchParams.get("metrics")?.split(","),
      dateRange:
        searchParams.get("from") && searchParams.get("to")
          ? {
              from: searchParams.get("from")!,
              to: searchParams.get("to")!,
            }
          : undefined,
      groupBy:
        (searchParams.get("groupBy") as "hour" | "day" | "week" | "month") ||
        "day",
      filters: searchParams.get("filters")
        ? JSON.parse(searchParams.get("filters")!)
        : undefined,
    };

    const validatedParams = metricsQuerySchema.parse(queryParams);

    logger.info("Fetching analytics metrics", "analytics", {
      requestId,
      userId: session.user.id,
      organizationId,
      metricsRequested: validatedParams.metrics,
      dateRange: validatedParams.dateRange,
      groupBy: validatedParams.groupBy,
    });

    // Generate mock metrics data based on parameters
    await AnalyticsService.recordMetric("api_request", "system", 1, {
      organizationId,
      dimensions: validatedParams,
    });

    const responseData = {
      metrics: [],
      metadata: {
        organizationId,
        dateRange: validatedParams.dateRange,
        groupBy: validatedParams.groupBy,
        totalCount: 0,
        generatedAt: new Date().toISOString(),
      },
    };

    logger.info("Successfully fetched analytics metrics", "analytics", {
      requestId,
      userId: session.user.id,
      organizationId,
      metricsCount: responseData.metrics.length,
      groupBy: validatedParams.groupBy,
    });

    return StandardSuccessResponse.ok(responseData, requestId);
  } catch (error) {
    logger.apiError("Error fetching metrics", "analytics", error, {
      requestId,
      endpoint: "/api/analytics/metrics",
    });

    if (error instanceof z.ZodError) {
      return StandardErrorResponse.badRequest(
        "Invalid query parameters",
        "analytics",
        error.errors,
      );
    }

    return StandardErrorResponse.internal("Failed to fetch metrics", requestId);
  }
}

// POST /api/analytics/metrics/custom - Create custom metric calculation
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
    const { organizationId, metricName, calculation, filters } = body;

    if (!organizationId || !metricName || !calculation) {
      return StandardErrorResponse.badRequest(
        "Organization ID, metric name, and calculation are required",
        "analytics",
      );
    }

    logger.info("Creating custom analytics metric", "analytics", {
      requestId,
      userId: session.user.id,
      organizationId,
      metricName,
      calculationType: calculation.type,
    });

    // Create custom metric (mock implementation)
    const customMetric = {
      id: `custom-${Date.now()}`,
      name: metricName,
      calculation,
      filters: filters || {},
      organizationId,
      createdAt: new Date().toISOString(),
      value: Math.floor(Math.random() * 10000), // Mock value
    };

    logger.info("Successfully created custom analytics metric", "analytics", {
      requestId,
      userId: session.user.id,
      organizationId,
      metricId: customMetric.id,
      metricName,
    });

    return StandardSuccessResponse.created(
      {
        metric: customMetric,
        message: "Custom metric created successfully",
      },
      requestId,
    );
  } catch (error) {
    logger.apiError("Error creating custom metric", "analytics", error, {
      requestId,
      endpoint: "/api/analytics/metrics",
    });

    return StandardErrorResponse.internal(
      "Failed to create custom metric",
      requestId,
    );
  }
}
