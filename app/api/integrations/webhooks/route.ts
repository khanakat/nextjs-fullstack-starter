import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db as prisma } from "@/lib/db";
import {
  CreateWebhookRequestSchema,
  ListWebhooksRequestSchema,
} from "../../../../shared/schemas/integration";
import { z } from "zod";
import { generateRequestId } from "@/lib/utils";
import { logger } from "@/lib/logger";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { handleZodError } from "@/lib/error-handlers";
import { hasPermission } from "@/lib/permissions";

/**
 * GET /api/integrations/webhooks - List webhooks for organization
 */
export async function GET(_request: NextRequest) {
  const requestId = generateRequestId();
  let userId: string | null = null;

  try {
    const authResult = auth();
    userId = authResult.userId;
    if (!userId) {
      logger.warn("Unauthorized access attempt to list webhooks", "webhooks", {
        requestId,
      });
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
      logger.warn("Insufficient permissions to list webhooks", "webhooks", {
        requestId,
        userId,
      });
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
    const { searchParams } = new URL(_request.url);

    // Parse query parameters
    const queryParams = {
      integrationId: searchParams.get("integrationId") || undefined,
      status: searchParams.get("status") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
    };

    const validatedParams = ListWebhooksRequestSchema.parse(queryParams);

    logger.info("Listing webhooks for organization", "webhooks", {
      requestId,
      userId,
      organizationId,
      filters: validatedParams,
    });

    // Build where clause
    const where: any = {
      integration: {
        organizationId,
      },
    };
    if (validatedParams.integrationId) {
      where.integrationId = validatedParams.integrationId;
    }

    // Get webhooks with pagination
    const [webhooks, total] = await Promise.all([
      prisma.integrationWebhook.findMany({
        where,
        include: {
          integration: {
            select: {
              id: true,
              name: true,
              provider: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (validatedParams.page - 1) * validatedParams.limit,
        take: validatedParams.limit,
      }),
      prisma.integrationWebhook.count({ where }),
    ]);

    logger.info("Successfully retrieved webhooks", "webhooks", {
      requestId,
      userId,
      organizationId,
      count: webhooks.length,
      total,
    });

    return StandardSuccessResponse.ok(
      {
        webhooks: webhooks.map((webhook) => ({
          id: webhook.id,
          integrationId: webhook.integrationId,
          integration: webhook.integration,
          url: webhook.url,
          events: webhook.events,
          status: webhook.status,
          lastTriggered: webhook.lastTriggered,
          createdAt: webhook.createdAt,
          updatedAt: webhook.updatedAt,
        })),
        pagination: {
          page: validatedParams.page,
          limit: validatedParams.limit,
          total,
          pages: Math.ceil(total / validatedParams.limit),
        },
      },
      requestId,
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn("Invalid query parameters for webhook listing", "webhooks", {
        requestId,
        userId,
        errors: error.errors,
      });
      return handleZodError(error, requestId);
    }

    logger.error("Failed to list webhooks", "webhooks", {
      requestId,
      userId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return StandardErrorResponse.internal(
      "Failed to list webhooks",
      undefined,
      requestId,
    );
  }
}

/**
 * POST /api/integrations/webhooks - Create new webhook
 */
export async function POST(_request: NextRequest) {
  const requestId = generateRequestId();
  let userId: string | null = null;

  try {
    const authResult = auth();
    userId = authResult.userId;
    if (!userId) {
      logger.warn("Unauthorized access attempt to create webhook", "webhooks", {
        requestId,
      });
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
    if (!hasPermission(user as any, "create", "organizations")) {
      logger.warn("Insufficient permissions to create webhook", "webhooks", {
        requestId,
        userId,
      });
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
    const body = await _request.json();

    // Validate request body
    const validatedData = CreateWebhookRequestSchema.parse(body);

    logger.info("Creating webhook", "webhooks", {
      requestId,
      userId,
      organizationId,
      integrationId: validatedData.integrationId,
      url: validatedData.url,
      events: validatedData.events,
    });

    // Verify integration exists and belongs to organization
    const integration = await prisma.integration.findFirst({
      where: {
        id: validatedData.integrationId,
        organizationId,
      },
    });

    if (!integration) {
      logger.warn("Integration not found for webhook creation", "webhooks", {
        requestId,
        userId,
        integrationId: validatedData.integrationId,
        organizationId,
      });
      return StandardErrorResponse.notFound("Integration not found", requestId);
    }

    // Generate webhook secret
    const secret = require("crypto").randomBytes(32).toString("hex");

    // Create webhook
    const webhook = await prisma.integrationWebhook.create({
      data: {
        integrationId: validatedData.integrationId,
        name: validatedData.name,
        url: validatedData.url,
        method: validatedData.method,
        events: JSON.stringify(validatedData.events),
        filters: JSON.stringify(validatedData.filters),
        headers: JSON.stringify(validatedData.headers),
        retryPolicy: JSON.stringify(validatedData.retryPolicy),
        timeout: validatedData.timeout,
        secret,
        status: "active",
      },
      include: {
        integration: {
          select: {
            id: true,
            name: true,
            provider: true,
          },
        },
      },
    });

    // Log webhook creation
    await prisma.integrationLog.create({
      data: {
        integrationId: validatedData.integrationId,
        action: "webhook_created",
        status: "success",
        requestData: JSON.stringify({
          url: validatedData.url,
          events: validatedData.events,
        }),
        responseData: JSON.stringify({
          webhookId: webhook.id,
          secret: secret.substring(0, 8) + "...", // Log partial secret for debugging
        }),
        timestamp: new Date(),
      },
    });

    logger.info("Successfully created webhook", "webhooks", {
      requestId,
      userId,
      webhookId: webhook.id,
      integrationId: validatedData.integrationId,
      url: validatedData.url,
    });

    return StandardSuccessResponse.created(
      {
        id: webhook.id,
        integrationId: webhook.integrationId,
        integration: webhook.integration,
        url: webhook.url,
        events: webhook.events,
        secret, // Return full secret only on creation
        status: webhook.status,
        createdAt: webhook.createdAt,
      },
      requestId,
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn("Invalid request data for webhook creation", "webhooks", {
        requestId,
        userId,
        errors: error.errors,
      });
      return handleZodError(error, requestId);
    }

    logger.error("Failed to create webhook", "webhooks", {
      requestId,
      userId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return StandardErrorResponse.internal(
      "Failed to create webhook",
      undefined,
      requestId,
    );
  }
}
