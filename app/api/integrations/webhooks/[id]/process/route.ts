import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { logger } from "@/lib/logger";
import { WebhookService } from "../../../../../../api/services/integrations/WebhookService";
import { db as prisma } from "@/lib/db";
import { generateRequestId } from "@/lib/utils";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { hasPermission } from "@/lib/permissions";

/**
 * POST /api/integrations/webhooks/[id]/process - Process incoming webhook
 * This endpoint receives webhook events from external providers
 * Note: This endpoint is typically called by external services, so authentication may be optional
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();

  try {
    const webhookId = params.id;

    if (!webhookId) {
      logger.warn("Missing webhook ID parameter for processing", "webhooks", {
        requestId,
      });
      return StandardErrorResponse.badRequest(
        "Webhook ID is required",
        requestId,
      );
    }

    logger.info("Processing incoming webhook", "webhooks", {
      requestId,
      webhookId,
      userAgent: _request.headers.get("user-agent"),
      contentType: _request.headers.get("content-type"),
    });

    // Get webhook to find organization
    const webhook = await prisma.integrationWebhook.findUnique({
      where: { id: webhookId },
      select: {
        status: true,
        url: true,
        secret: true,
        integration: {
          select: {
            organizationId: true,
            name: true,
            provider: true,
          },
        },
      },
    });

    if (!webhook) {
      logger.warn("Webhook not found for processing", "webhooks", {
        requestId,
        webhookId,
      });
      return StandardErrorResponse.notFound("Webhook not found", requestId);
    }

    if (webhook.status !== "active") {
      logger.warn("Webhook is not active", "webhooks", {
        requestId,
        webhookId,
        status: webhook.status,
        organizationId: webhook.integration.organizationId,
      });
      return StandardErrorResponse.badRequest(
        "Webhook is not active",
        requestId,
      );
    }

    // Get request body and headers
    const payload = await _request.json();
    const headers: Record<string, string> = {};

    // Convert Headers to plain object
    _request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    logger.info("Processing webhook payload", "webhooks", {
      requestId,
      webhookId,
      organizationId: webhook.integration.organizationId,
      provider: webhook.integration.provider,
      payloadSize: JSON.stringify(payload).length,
      hasSignature: !!(
        headers["x-signature"] ||
        headers["x-hub-signature"] ||
        headers["stripe-signature"]
      ),
    });

    // Process webhook
    const result = await WebhookService.processWebhook(
      webhookId,
      payload,
      headers,
      webhook.integration.organizationId,
    );

    if (!result.success) {
      logger.warn("Webhook processing failed", "webhooks", {
        requestId,
        webhookId,
        organizationId: webhook.integration.organizationId,
        error: result.error,
        shouldRetry: result.shouldRetry,
      });

      // Schedule retry if needed
      if (result.shouldRetry) {
        await WebhookService.scheduleWebhookRetry(
          webhookId,
          payload,
          headers,
          webhook.integration.organizationId,
        );

        logger.info("Webhook retry scheduled", "webhooks", {
          requestId,
          webhookId,
          organizationId: webhook.integration.organizationId,
        });
      }

      return StandardErrorResponse.badRequest(
        "Webhook processing failed",
        requestId,
        {
          error: result.error,
          retryScheduled: result.shouldRetry,
        },
      );
    }

    logger.info("Webhook processed successfully", "webhooks", {
      requestId,
      webhookId,
      organizationId: webhook.integration.organizationId,
      provider: webhook.integration.provider,
    });

    return StandardSuccessResponse.ok({ success: true }, requestId);
  } catch (error) {
    logger.error("Failed to process webhook", "webhooks", {
      requestId,
      webhookId: params.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return StandardErrorResponse.internal(
      "Failed to process webhook",
      undefined,
      requestId,
    );
  }
}

/**
 * GET /api/integrations/webhooks/[id]/process - Get webhook processing status
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
        "Unauthorized access attempt to get webhook processing status",
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
        "Insufficient permissions to read webhook processing status",
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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status") || undefined;
    const event = searchParams.get("event") || undefined;

    logger.info("Retrieving webhook processing status", "webhooks", {
      requestId,
      userId,
      webhookId,
      organizationId,
      page,
      limit,
      status,
      event,
    });

    // Get webhook to find organization and verify access
    const webhook = await prisma.integrationWebhook.findFirst({
      where: {
        id: webhookId,
        integration: {
          organizationId,
        },
      },
      select: {
        integration: {
          select: {
            organizationId: true,
            name: true,
            provider: true,
          },
        },
      },
    });

    if (!webhook) {
      logger.warn(
        "Webhook not found or access denied for processing status",
        "webhooks",
        {
          requestId,
          userId,
          webhookId,
          organizationId,
        },
      );
      return StandardErrorResponse.notFound("Webhook not found", requestId);
    }

    // Get webhook delivery history
    const deliveries = await WebhookService.getWebhookDeliveries(
      webhookId,
      webhook.integration.organizationId,
      { page, limit, status, event },
    );

    logger.info(
      "Successfully retrieved webhook processing status",
      "webhooks",
      {
        requestId,
        userId,
        webhookId,
        organizationId: webhook.integration.organizationId,
        totalDeliveries: deliveries.pagination.total || 0,
      },
    );

    return StandardSuccessResponse.ok(deliveries, requestId);
  } catch (error) {
    logger.error("Failed to get webhook processing status", "webhooks", {
      requestId,
      userId,
      webhookId: params.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return StandardErrorResponse.internal(
      "Failed to get webhook processing status",
      requestId,
    );
  }
}
