import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { generateRequestId } from "@/lib/utils";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { handleZodError } from "@/lib/error-handlers";

const updateIntegrationSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  config: z.record(z.any()).optional(),
  description: z.string().optional(),
  status: z.enum(["active", "inactive", "error"]).optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();
    if (!userId) {
      logger.warn("Unauthorized access attempt to integration details", "API", {
        requestId,
      });
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        requestId,
      );
    }

    const integrationId = params.id;
    if (!integrationId) {
      logger.warn("Missing integration ID parameter", "API", {
        requestId,
        userId,
      });
      return StandardErrorResponse.badRequest(
        "Integration ID is required",
        requestId,
      );
    }

    // Get integration with organization check
    const integration = await db.integration.findFirst({
      where: {
        id: integrationId,
        organization: {
          members: {
            some: { userId },
          },
        },
      },
      include: {
        organization: {
          select: { id: true, name: true },
        },
        webhooks: {
          select: { id: true, url: true, status: true },
        },
        _count: {
          select: { webhooks: true },
        },
      },
    });

    if (!integration) {
      logger.warn("Integration not found or access denied", "API", {
        requestId,
        userId,
        integrationId,
      });
      return StandardErrorResponse.notFound("Integration not found", requestId);
    }

    logger.info("Integration retrieved successfully", "API", {
      requestId,
      userId,
      integrationId,
      organizationId: integration.organization.id,
    });

    return StandardSuccessResponse.ok(integration, requestId);
  } catch (error) {
    logger.error("Failed to retrieve integration", "API", { requestId, error });
    return StandardErrorResponse.internal(
      "Failed to retrieve integration",
      undefined,
      requestId,
    );
  }
}

export async function PUT(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();
    if (!userId) {
      logger.warn("Unauthorized access attempt to update integration", "API", {
        requestId,
      });
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        requestId,
      );
    }

    const integrationId = params.id;
    if (!integrationId) {
      logger.warn("Missing integration ID parameter", "API", {
        requestId,
        userId,
      });
      return StandardErrorResponse.badRequest(
        "Integration ID is required",
        requestId,
      );
    }

    let body;
    try {
      body = await _request.json();
    } catch (error) {
      logger.warn("Invalid JSON in request body", "API", { requestId, userId });
      return StandardErrorResponse.badRequest(
        "Invalid JSON in request body",
        requestId,
      );
    }

    // Validate request body
    const validationResult = updateIntegrationSchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn("Integration update validation failed", "API", {
        requestId,
        userId,
        integrationId,
        errors: validationResult.error.errors,
      });
      return handleZodError(validationResult.error, requestId);
    }

    const validatedData = validationResult.data;

    // Check if integration exists and user has access
    const existingIntegration = await db.integration.findFirst({
      where: {
        id: integrationId,
        organization: {
          members: {
            some: { userId },
          },
        },
      },
    });

    if (!existingIntegration) {
      logger.warn("Integration not found or access denied for update", "API", {
        requestId,
        userId,
        integrationId,
      });
      return StandardErrorResponse.notFound("Integration not found", requestId);
    }

    // Update integration
    const updatedIntegration = await db.integration.update({
      where: { id: integrationId },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
      include: {
        organization: {
          select: { id: true, name: true },
        },
        webhooks: {
          select: { id: true, url: true, status: true },
        },
        _count: {
          select: { webhooks: true },
        },
      },
    });

    logger.info("Integration updated successfully", "API", {
      requestId,
      userId,
      integrationId,
      organizationId: updatedIntegration.organization.id,
      updatedFields: Object.keys(validatedData),
    });

    return StandardSuccessResponse.ok(updatedIntegration, requestId);
  } catch (error) {
    logger.error("Failed to update integration", "API", { requestId, error });
    return StandardErrorResponse.internal(
      "Failed to update integration",
      undefined,
      requestId,
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();
    if (!userId) {
      logger.warn("Unauthorized access attempt to delete integration", "API", {
        requestId,
      });
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        requestId,
      );
    }

    const integrationId = params.id;
    if (!integrationId) {
      logger.warn("Missing integration ID parameter", "API", {
        requestId,
        userId,
      });
      return StandardErrorResponse.badRequest(
        "Integration ID is required",
        requestId,
      );
    }

    // Check if integration exists and user has access
    const existingIntegration = await db.integration.findFirst({
      where: {
        id: integrationId,
        organization: {
          members: {
            some: { userId },
          },
        },
      },
      include: {
        organization: {
          select: { id: true, name: true },
        },
      },
    });

    if (!existingIntegration) {
      logger.warn(
        "Integration not found or access denied for deletion",
        "API",
        {
          requestId,
          userId,
          integrationId,
        },
      );
      return StandardErrorResponse.notFound("Integration not found", requestId);
    }

    // Delete integration (this should cascade to related records)
    await db.integration.delete({
      where: { id: integrationId },
    });

    logger.info("Integration deleted successfully", "API", {
      requestId,
      userId,
      integrationId,
      organizationId: existingIntegration.organization.id,
    });

    return StandardSuccessResponse.ok(
      {
        message: "Integration deleted successfully",
        integrationId,
      },
      requestId,
    );
  } catch (error) {
    logger.error("Failed to delete integration", "API", { requestId, error });
    return StandardErrorResponse.internal(
      "Failed to delete integration",
      undefined,
      requestId,
    );
  }
}
