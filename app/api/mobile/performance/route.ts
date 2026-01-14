/**
 * Performance Metrics API Routes
 * Note: This route logs performance metrics but doesn't persist them yet
 * Keeping original logic as it's monitoring-specific
 */

import { NextRequest } from "next/server";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { logger } from "@/lib/logger";
import { generateRequestId } from "@/lib/utils";
import { handleZodError } from "@/lib/error-handlers";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

// Performance metrics schema
const performanceMetricsSchema = z.object({
  metrics: z.object({
    lcp: z.number().optional(), // Largest Contentful Paint
    fid: z.number().optional(), // First Input Delay
    cls: z.number().optional(), // Cumulative Layout Shift
    memory_used: z.number().optional(),
    memory_total: z.number().optional(),
    memory_limit: z.number().optional(),
  }),
  networkInfo: z
    .object({
      type: z.string(),
      effectiveType: z.string(),
      downlink: z.number(),
      rtt: z.number(),
      saveData: z.boolean(),
    })
    .optional(),
  userAgent: z.string(),
  timestamp: z.number(),
  url: z.string().optional(),
  deviceType: z.enum(["mobile", "tablet", "desktop"]).optional(),
});

const bundleMetricsSchema = z.object({
  bundleName: z.string(),
  size: z.number(),
  loadTime: z.number(),
  cached: z.boolean(),
  timestamp: z.number(),
});

/**
 * POST /api/mobile/performance
 * Report performance metrics from client
 */
export async function POST(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    logger.info("Processing performance metrics submission", "mobile", {
      requestId,
    });

    const { userId } = await auth();

    if (!userId) {
      logger.warn(
        "Unauthorized performance metrics submission attempt",
        "mobile",
        { requestId },
      );
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        requestId,
      );
    }

    const body = await _request.json();
    const data = performanceMetricsSchema.parse(body);

    // Log performance metrics (in production, you'd store these in a database)
    logger.info("Performance metrics received", "mobile", {
      requestId,
      userId,
      metrics: data.metrics,
      networkType: data.networkInfo?.type,
      deviceType: data.deviceType,
      url: data.url,
      ip: _request.ip,
      userAgent: _request.headers.get("user-agent"),
    });

    // In a real application, you would:
    // 1. Store metrics in a time-series database (e.g., InfluxDB, TimescaleDB)
    // 2. Aggregate metrics for analytics
    // 3. Set up alerts for performance degradation
    // 4. Generate performance reports

    logger.info("Performance metrics processed successfully", "mobile", {
      requestId,
      userId,
      metricsCount: Object.keys(data.metrics).length,
    });

    return StandardSuccessResponse.ok(
      {
        message: "Performance metrics received successfully",
        processed: true,
      },
      requestId,
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn("Invalid performance metrics data", "mobile", {
        requestId,
        validationErrors: error.errors,
      });
      return handleZodError(error, requestId);
    }

    logger.error("Error processing performance metrics", "mobile", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
      endpoint: "/api/mobile/performance",
    });

    return StandardErrorResponse.internal(
      "Failed to process performance metrics",
      requestId,
    );
  }
}

/**
 * PUT /api/mobile/performance
 * Report bundle performance metrics
 */
export async function PUT(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    logger.info("Processing bundle performance metrics submission", "mobile", {
      requestId,
    });

    const { userId } = await auth();

    if (!userId) {
      logger.warn("Unauthorized bundle metrics submission attempt", "mobile", {
        requestId,
      });
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        requestId,
      );
    }

    const body = await _request.json();
    const data = bundleMetricsSchema.parse(body);

    // Log bundle metrics
    logger.info("Bundle performance metrics received", "mobile", {
      requestId,
      userId,
      bundleName: data.bundleName,
      size: data.size,
      loadTime: data.loadTime,
      cached: data.cached,
      timestamp: data.timestamp,
    });

    // In production, store bundle metrics for analysis

    logger.info("Bundle performance metrics processed successfully", "mobile", {
      requestId,
      userId,
      bundleName: data.bundleName,
    });

    return StandardSuccessResponse.ok(
      {
        message: "Bundle metrics received successfully",
        processed: true,
      },
      requestId,
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn("Invalid bundle metrics data", "mobile", {
        requestId,
        validationErrors: error.errors,
      });
      return handleZodError(error, requestId);
    }

    logger.error("Error processing bundle metrics", "mobile", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
      endpoint: "/api/mobile/performance",
    });

    return StandardErrorResponse.internal(
      "Failed to process bundle metrics",
      requestId,
    );
  }
}

/**
 * GET /api/mobile/performance
 * Get performance analytics for the user
 */
export async function GET(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    logger.info("Processing performance analytics request", "mobile", {
      requestId,
    });

    const { userId } = await auth();

    if (!userId) {
      logger.warn("Unauthorized performance analytics request", "mobile", {
        requestId,
      });
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        requestId,
      );
    }

    const { searchParams } = new URL(_request.url);
    const timeRange = searchParams.get("timeRange") || "24h";
    const deviceType = searchParams.get("deviceType");

    logger.info("Performance analytics parameters", "mobile", {
      requestId,
      userId,
      timeRange,
      deviceType,
    });

    // In production, query actual metrics from database
    // For now, return mock analytics data
    const mockAnalytics = {
      summary: {
        avgLCP: 2.1,
        avgFID: 45,
        avgCLS: 0.08,
        totalPageViews: 156,
        uniqueDevices: 12,
      },
      trends: {
        lcp: [2.3, 2.1, 1.9, 2.0, 2.1],
        fid: [52, 48, 41, 43, 45],
        cls: [0.09, 0.08, 0.07, 0.08, 0.08],
      },
      deviceBreakdown: {
        mobile: { count: 89, avgLCP: 2.4 },
        tablet: { count: 34, avgLCP: 1.8 },
        desktop: { count: 33, avgLCP: 1.6 },
      },
      networkBreakdown: {
        "4g": { count: 98, avgLCP: 1.9 },
        "3g": { count: 45, avgLCP: 3.2 },
        "2g": { count: 13, avgLCP: 5.1 },
      },
      recommendations: [
        {
          type: "image_optimization",
          message: "Consider optimizing images for mobile devices",
          impact: "high",
          potentialImprovement: "0.8s LCP reduction",
        },
        {
          type: "code_splitting",
          message: "Some bundles are loading slowly on 3G connections",
          impact: "medium",
          potentialImprovement: "0.3s FID reduction",
        },
      ],
    };

    logger.info("Performance analytics retrieved successfully", "mobile", {
      requestId,
      userId,
      timeRange,
      deviceType,
      recommendationsCount: mockAnalytics.recommendations.length,
    });

    return StandardSuccessResponse.ok(mockAnalytics, requestId);
  } catch (error) {
    logger.error("Error retrieving performance analytics", "mobile", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
      endpoint: "/api/mobile/performance",
    });

    return StandardErrorResponse.internal(
      "Failed to retrieve performance analytics",
      requestId,
    );
  }
}
