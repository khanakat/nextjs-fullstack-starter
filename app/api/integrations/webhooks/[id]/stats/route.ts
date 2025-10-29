import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db as prisma } from "@/lib/db";
import { WebhookService } from "../../../../../../api/services/integrations/WebhookService";
import { z } from "zod";
import { generateRequestId } from "@/lib/utils";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { handleZodError } from "@/lib/error-handlers";
import { hasPermission } from "@/lib/permissions";
import { logger } from "@/lib/logger";

const StatsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  period: z.enum(["1h", "24h", "7d", "30d"]).default("24h"),
});

/**
 * GET /api/integrations/webhooks/[id]/stats - Get webhook statistics
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();
  let userId: string | null = null;

  try {
    const authResult = auth();
    userId = authResult.userId;
    if (!userId) {
      logger.warn(
        "Unauthorized access attempt to get webhook stats",
        "webhooks",
        { requestId },
      );
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        requestId,
      );
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organizationMemberships: { include: { organization: true } } },
    });

    // Check permissions
    if (!hasPermission(user as any, "read", "organizations")) {
      logger.warn(
        "Insufficient permissions to read webhook stats",
        "webhooks",
        { requestId, userId },
      );
      return StandardErrorResponse.forbidden(
        "Insufficient permissions",
        requestId,
      );
    }

    if (!user?.organizationMemberships?.[0]) {
      logger.warn("No organization found for user", "webhooks", {
        requestId,
        userId,
      });
      return StandardErrorResponse.badRequest(
        "No organization found",
        requestId,
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;
    const webhookId = params.id;

    if (!webhookId) {
      logger.warn("Missing webhook ID parameter", "webhooks", {
        requestId,
        userId,
      });
      return StandardErrorResponse.badRequest(
        "Webhook ID is required",
        requestId,
      );
    }

    const { searchParams } = new URL(_request.url);

    // Parse query parameters
    const queryParams = {
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      period: searchParams.get("period") || "24h",
    };

    const validatedParams = StatsQuerySchema.parse(queryParams);

    logger.info("Retrieving webhook statistics", "webhooks", {
      requestId,
      userId,
      webhookId,
      organizationId,
      period: validatedParams.period,
      hasCustomDateRange: !!(
        validatedParams.startDate && validatedParams.endDate
      ),
    });

    // Verify webhook belongs to organization
    const webhook = await prisma.integrationWebhook.findFirst({
      where: {
        id: webhookId,
        integration: {
          organizationId,
        },
      },
      select: {
        id: true,
        url: true,
        status: true,
        integration: {
          select: {
            id: true,
            name: true,
            provider: true,
          },
        },
      },
    });

    if (!webhook) {
      logger.warn("Webhook not found for stats", "webhooks", {
        requestId,
        userId,
        webhookId,
        organizationId,
      });
      return StandardErrorResponse.notFound("Webhook not found", requestId);
    }

    // Calculate time range
    let startDate: Date;
    let endDate: Date = new Date();

    if (validatedParams.startDate && validatedParams.endDate) {
      startDate = new Date(validatedParams.startDate);
      endDate = new Date(validatedParams.endDate);
    } else {
      // Calculate based on period
      const now = new Date();
      switch (validatedParams.period) {
        case "1h":
          startDate = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case "24h":
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case "7d":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30d":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }
    }

    // Get webhook statistics
    const stats = await WebhookService.getWebhookStats(
      webhookId,
      organizationId,
      { start: startDate, end: endDate },
    );

    // Get recent deliveries for timeline
    const recentDeliveries = await WebhookService.getWebhookDeliveries(
      webhookId,
      organizationId,
      { page: 1, limit: 10 },
    );

    // Get event type breakdown
    const eventBreakdown = await prisma.integrationLog.groupBy({
      by: ["requestData"],
      where: {
        integrationId: webhook.integration.id,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        id: true,
      },
    });

    // Parse event types from request data
    const eventStats = eventBreakdown.reduce(
      (acc: Record<string, number>, item) => {
        try {
          const requestData = JSON.parse(item.requestData as string);
          const event = requestData.event || "unknown";
          acc[event] = (acc[event] || 0) + item._count.id;
        } catch {
          acc["unknown"] = (acc["unknown"] || 0) + item._count.id;
        }
        return acc;
      },
      {},
    );

    // Get hourly breakdown for the period
    const hourlyStats = await getHourlyBreakdown(
      webhookId,
      organizationId,
      startDate,
      endDate,
    );

    const responseData = {
      webhook: {
        id: webhook.id,
        url: webhook.url,
        status: webhook.status,
        integration: webhook.integration,
      },
      period: {
        start: startDate,
        end: endDate,
        duration: validatedParams.period,
      },
      summary: stats,
      eventBreakdown: Object.entries(eventStats).map(([event, count]) => ({
        event,
        count,
      })),
      hourlyBreakdown: hourlyStats,
      recentDeliveries: recentDeliveries.deliveries?.slice(0, 5) || [],
    };

    logger.info("Successfully retrieved webhook statistics", "webhooks", {
      requestId,
      userId,
      webhookId,
      organizationId,
      period: validatedParams.period,
      totalEvents: Object.values(eventStats).reduce(
        (sum, count) => sum + count,
        0,
      ),
      uniqueEventTypes: Object.keys(eventStats).length,
    });

    return StandardSuccessResponse.ok(responseData, requestId);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn("Invalid query parameters for webhook stats", "webhooks", {
        requestId,
        userId,
        errors: error.errors,
      });
      return handleZodError(error, requestId);
    }

    logger.error("Failed to get webhook stats", "webhooks", {
      requestId,
      userId,
      webhookId: params.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return StandardErrorResponse.internal(
      "Failed to get webhook stats",
      requestId,
    );
  }
}

/**
 * Get hourly breakdown of webhook deliveries
 */
async function getHourlyBreakdown(
  webhookId: string,
  _organizationId: string,
  startDate: Date,
  endDate: Date,
) {
  const logs = await prisma.integrationLog.findMany({
    where: {
      webhookId: webhookId,
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      timestamp: true,
      status: true,
    },
  });

  // Group by hour
  const hourlyData: Record<string, { success: number; error: number }> = {};

  logs.forEach((log) => {
    const hour =
      new Date(log.timestamp).toISOString().slice(0, 13) + ":00:00.000Z";

    if (!hourlyData[hour]) {
      hourlyData[hour] = { success: 0, error: 0 };
    }

    if (log.status === "success") {
      hourlyData[hour].success++;
    } else {
      hourlyData[hour].error++;
    }
  });

  // Fill in missing hours with zero values
  const result = [];
  const current = new Date(startDate);
  current.setMinutes(0, 0, 0);

  while (current <= endDate) {
    const hourKey = current.toISOString();
    result.push({
      hour: hourKey,
      success: hourlyData[hourKey]?.success || 0,
      error: hourlyData[hourKey]?.error || 0,
      total:
        (hourlyData[hourKey]?.success || 0) + (hourlyData[hourKey]?.error || 0),
    });

    current.setHours(current.getHours() + 1);
  }

  return result;
}
