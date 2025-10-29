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

const createIntegrationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  provider: z.string().min(1, "Provider is required"),
  type: z.string().min(1, "Type is required"),
  category: z.string().min(1, "Category is required"),
  config: z.record(z.any()).optional(),
  settings: z.record(z.any()).optional(),
  description: z.string().optional(),
});

export async function GET(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();
    if (!userId) {
      logger.warn("Unauthorized access attempt to integrations list", "API", {
        requestId,
      });
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        requestId,
      );
    }

    const { searchParams } = new URL(_request.url);
    const organizationId = searchParams.get("organizationId");
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const provider = searchParams.get("provider");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!organizationId) {
      logger.warn("Missing organizationId parameter", "API", {
        requestId,
        userId,
      });
      return StandardErrorResponse.badRequest(
        "Organization ID is required",
        requestId,
      );
    }

    // Verify user has access to organization
    const organization = await db.organization.findFirst({
      where: {
        id: organizationId,
        members: {
          some: { userId },
        },
      },
    });

    if (!organization) {
      logger.warn(
        "User attempted to access unauthorized organization integrations",
        "API",
        {
          requestId,
          userId,
          organizationId,
        },
      );
      return StandardErrorResponse.forbidden(
        "Access denied to organization",
        requestId,
      );
    }

    // Build query filters
    const where: any = { organizationId };
    if (type) where.type = type;
    if (status) where.status = status;
    if (provider) where.provider = provider;

    const [integrations, total] = await Promise.all([
      db.integration.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { webhooks: true, connections: true },
          },
        },
      }),
      db.integration.count({ where }),
    ]);

    logger.info("Integrations retrieved successfully", "API", {
      requestId,
      userId,
      organizationId,
      count: integrations.length,
      total,
      page,
      limit,
    });

    return StandardSuccessResponse.ok(
      {
        integrations,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      requestId,
    );
  } catch (error) {
    logger.error("Failed to retrieve integrations", "API", {
      requestId,
      error,
    });
    return StandardErrorResponse.internal(
      "Failed to retrieve integrations",
      undefined,
      requestId,
    );
  }
}

export async function POST(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();
    if (!userId) {
      logger.warn("Unauthorized access attempt to create integration", "API", {
        requestId,
      });
      return StandardErrorResponse.unauthorized(
        "Authentication required",
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

    const { organizationId, ...integrationData } = body;

    if (!organizationId) {
      logger.warn("Missing organizationId in request body", "API", {
        requestId,
        userId,
      });
      return StandardErrorResponse.badRequest(
        "Organization ID is required",
        requestId,
      );
    }

    // Verify user has access to organization
    const organization = await db.organization.findFirst({
      where: {
        id: organizationId,
        members: {
          some: { userId },
        },
      },
    });

    if (!organization) {
      logger.warn(
        "User attempted to create integration for unauthorized organization",
        "API",
        {
          requestId,
          userId,
          organizationId,
        },
      );
      return StandardErrorResponse.forbidden(
        "Access denied to organization",
        requestId,
      );
    }

    // Validate integration data
    const validationResult = createIntegrationSchema.safeParse(integrationData);
    if (!validationResult.success) {
      logger.warn("Integration validation failed", "API", {
        requestId,
        userId,
        organizationId,
        errors: validationResult.error.errors,
      });
      return handleZodError(validationResult.error, requestId);
    }

    const validatedData = validationResult.data;

    // Create integration
    const integration = await db.integration.create({
      data: {
        ...validatedData,
        organizationId,
        status: "inactive",
        createdBy: userId,
        config: JSON.stringify(validatedData.config || {}),
        settings: JSON.stringify(validatedData.settings || {}),
      },
      include: {
        _count: {
          select: { webhooks: true, connections: true },
        },
      },
    });

    logger.info("Integration created successfully", "API", {
      requestId,
      userId,
      organizationId,
      integrationId: integration.id,
      integrationType: integration.type,
      provider: integration.provider,
    });

    return StandardSuccessResponse.created(integration, requestId);
  } catch (error) {
    logger.error("Failed to create integration", "API", { requestId, error });
    return StandardErrorResponse.internal(
      "Failed to create integration",
      undefined,
      requestId,
    );
  }
}
