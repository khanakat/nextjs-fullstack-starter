import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { UpdateWebhookRequestSchema } from "../../../../../shared/schemas/integration";
import { z } from "zod";
import { generateRequestId } from "@/lib/utils";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { handleZodError } from "@/lib/error-handlers";
import { hasPermission } from "@/lib/permissions";

/**
 * GET /api/integrations/webhooks/[id] - Get webhook by ID
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
      logger.warn("Unauthorized access attempt to get webhook", "webhooks", {
        requestId,
      });
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        requestId,
      );
    }

    // Get user's organization
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { organizationMemberships: { include: { organization: true } } },
    });

    // Check permissions
    if (!hasPermission(user as any, "read", "organizations")) {
      logger.warn("Insufficient permissions to read webhook", "webhooks", {
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

    logger.info("Retrieving webhook by ID", "webhooks", {
      requestId,
      userId,
      webhookId,
      organizationId,
    });

    // Get webhook with organization check
    const webhook = await db.integrationWebhook.findFirst({
      where: {
        id: webhookId,
        integration: {
          organizationId,
        },
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

    if (!webhook) {
      logger.warn("Webhook not found or access denied", "webhooks", {
        requestId,
        userId,
        webhookId,
        organizationId,
      });
      return StandardErrorResponse.notFound("Webhook not found", requestId);
    }

    logger.info("Webhook retrieved successfully", "webhooks", {
      requestId,
      userId,
      webhookId,
      organizationId,
      integrationId: webhook.integrationId,
      status: webhook.status,
    });

    return StandardSuccessResponse.ok(
      {
        id: webhook.id,
        integrationId: webhook.integrationId,
        integration: webhook.integration,
        url: webhook.url,
        events: webhook.events,
        status: webhook.status,
        lastTriggered: webhook.lastTriggered,
        createdAt: webhook.createdAt,
        updatedAt: webhook.updatedAt,
        // Note: secret is not returned for security
      },
      requestId,
    );
  } catch (error) {
    logger.error("Failed to get webhook", "webhooks", {
      requestId,
      userId,
      webhookId: params.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return StandardErrorResponse.internal(
      "Failed to get webhook",
      undefined,
      requestId,
    );
  }
}

/**
 * PUT /api/integrations/webhooks/[id] - Update webhook
 */
export async function PUT(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();
  let userId: string | null = null;

  try {
    const authResult = auth();
    userId = authResult.userId;
    if (!userId) {
      logger.warn("Unauthorized access attempt to update webhook", "webhooks", {
        requestId,
      });
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        requestId,
      );
    }

    // Get user's organization
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { organizationMemberships: { include: { organization: true } } },
    });

    // Check permissions
    if (!hasPermission(user as any, "update", "organizations")) {
      logger.warn("Insufficient permissions to update webhook", "webhooks", {
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

    let body;
    try {
      body = await _request.json();
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn("Invalid request data for webhook update", "webhooks", {
          requestId,
          userId,
          errors: error.errors,
        });
        return handleZodError(error, requestId);
      }
      logger.warn("Invalid JSON in request body", "webhooks", {
        requestId,
        userId,
        error,
      });
      return StandardErrorResponse.badRequest(
        "Invalid JSON in request body",
        requestId,
      );
    }

    const validatedData = UpdateWebhookRequestSchema.parse(body);

    logger.info("Updating webhook", "webhooks", {
      requestId,
      userId,
      webhookId,
      organizationId,
      hasUrl: !!validatedData.url,
      hasEvents: !!validatedData.events,
      isEnabled: validatedData.isEnabled,
    });

    // Check if webhook exists with organization check
    const existingWebhook = await db.integrationWebhook.findFirst({
      where: {
        id: webhookId,
        integration: {
          organizationId,
        },
      },
    });

    if (!existingWebhook) {
      logger.warn("Webhook not found or access denied for update", "webhooks", {
        requestId,
        userId,
        webhookId,
        organizationId,
      });
      return StandardErrorResponse.notFound("Webhook not found", requestId);
    }

    // Update webhook
    const webhook = await db.integrationWebhook.update({
      where: { id: webhookId },
      data: {
        ...(validatedData.url && { url: validatedData.url }),
        ...(validatedData.events && {
          events: JSON.stringify(validatedData.events),
        }),
        ...(validatedData.isEnabled !== undefined && {
          isEnabled: validatedData.isEnabled,
        }),
        updatedAt: new Date(),
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

    // Log webhook update
    await db.integrationLog.create({
      data: {
        integrationId: webhook.integrationId,
        action: "webhook_updated",
        status: "success",
        requestData: JSON.stringify(validatedData),
        responseData: JSON.stringify({
          webhookId: webhook.id,
          updated: true,
        }),
      },
    });

    logger.info("Webhook updated successfully", "webhooks", {
      requestId,
      userId,
      webhookId,
      organizationId,
      integrationId: webhook.integrationId,
      updatedFields: Object.keys(validatedData),
    });

    return StandardSuccessResponse.ok(
      {
        id: webhook.id,
        integrationId: webhook.integrationId,
        integration: webhook.integration,
        url: webhook.url,
        events: webhook.events,
        status: webhook.status,
        lastTriggered: webhook.lastTriggered,
        createdAt: webhook.createdAt,
        updatedAt: webhook.updatedAt,
      },
      requestId,
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn("Validation error in update webhook request", "webhooks", {
        requestId,
        userId,
        errors: error.errors,
      });
      return handleZodError(error, requestId);
    }

    logger.error("Failed to update webhook", "webhooks", {
      requestId,
      userId,
      webhookId: params.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return StandardErrorResponse.internal(
      "Failed to update webhook",
      undefined,
      requestId,
    );
  }
}

/**
 * DELETE /api/integrations/webhooks/[id] - Delete webhook
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();
  let userId: string | null = null;

  try {
    const authResult = auth();
    userId = authResult.userId;
    if (!userId) {
      logger.warn("Unauthorized access attempt to delete webhook", "webhooks", {
        requestId,
      });
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        requestId,
      );
    }

    // Get user's organization
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { organizationMemberships: { include: { organization: true } } },
    });

    // Check permissions
    if (!hasPermission(user as any, "delete", "organizations")) {
      logger.warn("Insufficient permissions to delete webhook", "webhooks", {
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
        organizationId,
      });
      return StandardErrorResponse.badRequest(
        "Webhook ID is required",
        requestId,
      );
    }

    logger.info("Deleting webhook", "webhooks", {
      requestId,
      userId,
      webhookId,
      organizationId,
    });

    // Check if webhook exists with organization check
    const webhook = await db.integrationWebhook.findFirst({
      where: {
        id: webhookId,
        integration: {
          organizationId,
        },
      },
    });

    if (!webhook) {
      logger.warn(
        "Webhook not found or access denied for deletion",
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

    // Delete webhook
    await db.integrationWebhook.delete({
      where: { id: webhookId },
    });

    // Log webhook deletion
    await db.integrationLog.create({
      data: {
        integrationId: webhook.integrationId,
        action: "webhook_deleted",
        status: "success",
        requestData: JSON.stringify({ webhookId }),
        responseData: JSON.stringify({ deleted: true }),
      },
    });

    logger.info("Webhook deleted successfully", "webhooks", {
      requestId,
      userId,
      webhookId,
      organizationId,
      integrationId: webhook.integrationId,
    });

    return StandardSuccessResponse.ok({ success: true }, requestId);
  } catch (error) {
    logger.error("Failed to delete webhook", "webhooks", {
      requestId,
      userId,
      webhookId: params.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return StandardErrorResponse.internal(
      "Failed to delete webhook",
      undefined,
      requestId,
    );
  }
}
