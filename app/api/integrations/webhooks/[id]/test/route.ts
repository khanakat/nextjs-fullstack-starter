import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { logger } from "@/lib/logger";
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

const TestWebhookSchema = z.object({
  event: z.string().optional(),
});

/**
 * POST /api/integrations/webhooks/[id]/test - Test webhook endpoint
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();
  let userId: string | null = null;

  try {
    const authResult = auth();
    userId = authResult.userId;
    if (!userId) {
      logger.warn("Unauthorized access attempt to test webhook", "webhooks", {
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
    if (!hasPermission(user as any, "update", "organizations")) {
      logger.warn("Insufficient permissions to test webhook", "webhooks", {
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

    logger.info("Testing webhook endpoint", "webhooks", {
      requestId,
      userId,
      webhookId,
      organizationId,
    });

    // Verify webhook belongs to organization
    const webhook = await prisma.integrationWebhook.findFirst({
      where: {
        id: webhookId,
        integration: {
          organizationId,
        },
      },
    });

    if (!webhook) {
      logger.warn("Webhook not found for testing", "webhooks", {
        requestId,
        userId,
        webhookId,
        organizationId,
      });
      return StandardErrorResponse.notFound("Webhook not found", requestId);
    }

    const body = await _request.json();
    const validatedData = TestWebhookSchema.parse(body);

    // Test webhook endpoint
    const result = await WebhookService.testWebhookEndpoint(
      webhookId,
      organizationId,
      validatedData.event,
    );

    if (!result.success) {
      logger.warn("Webhook test failed", "webhooks", {
        requestId,
        userId,
        webhookId,
        error: result.error,
        response: result.response,
      });

      return StandardErrorResponse.badRequest(
        "Webhook test failed",
        requestId,
        {
          error: result.error,
          response: result.response,
        },
      );
    }

    logger.info("Webhook test completed successfully", "webhooks", {
      requestId,
      userId,
      webhookId,
      responseStatus: result.response?.status,
    });

    return StandardSuccessResponse.ok(
      {
        success: true,
        response: result.response,
      },
      requestId,
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn("Invalid request data for webhook test", "webhooks", {
        requestId,
        userId,
        errors: error.errors,
      });
      return handleZodError(error, requestId);
    }

    logger.error("Failed to test webhook", "webhooks", {
      requestId,
      userId,
      webhookId: params.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return StandardErrorResponse.internal("Failed to test webhook", requestId);
  }
}

/**
 * GET /api/integrations/webhooks/[id]/test - Get webhook test history
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
        "Unauthorized access attempt to get webhook test history",
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
        "Insufficient permissions to read webhook test history",
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

    logger.info("Retrieving webhook test history", "webhooks", {
      requestId,
      userId,
      webhookId,
      organizationId,
      page,
      limit,
    });

    // Verify webhook belongs to organization
    const webhook = await prisma.integrationWebhook.findFirst({
      where: {
        id: webhookId,
        integration: {
          organizationId,
        },
      },
    });

    if (!webhook) {
      logger.warn("Webhook not found for test history", "webhooks", {
        requestId,
        userId,
        webhookId,
        organizationId,
      });
      return StandardErrorResponse.notFound("Webhook not found", requestId);
    }

    // Get test history
    const testHistory = await WebhookService.getWebhookDeliveries(
      webhookId,
      organizationId,
      {
        page,
        limit,
        status: "test_sent", // Only get test events
      },
    );

    logger.info("Successfully retrieved webhook test history", "webhooks", {
      requestId,
      userId,
      webhookId,
      totalResults: testHistory.pagination.total || 0,
    });

    return StandardSuccessResponse.ok(testHistory, requestId);
  } catch (error) {
    logger.error("Failed to get webhook test history", "webhooks", {
      requestId,
      userId,
      webhookId: params.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return StandardErrorResponse.internal(
      "Failed to get webhook test history",
      requestId,
    );
  }
}
