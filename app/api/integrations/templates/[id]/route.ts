import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import { db as prisma } from "@/lib/db";
import { z } from "zod";
import { generateRequestId } from "@/lib/utils";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { handleZodError } from "@/lib/error-handlers";

const UpdateTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  defaultConfig: z.record(z.any()).optional(),
  category: z.string().max(100).optional(),
});

/**
 * GET /api/integrations/templates/[id] - Get integration template by ID
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();

  try {
    logger.info("Getting integration template", "integrations", {
      requestId,
      templateId: params.id,
    });

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      logger.warn("Unauthorized access attempt", "integrations", { requestId });
      return StandardErrorResponse.unauthorized(
        "Unauthorized",
        "integrations",
        requestId,
      );
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organizationMemberships: { include: { organization: true } } },
    });

    if (!user?.organizationMemberships?.[0]) {
      logger.warn("No organization found for user", "integrations", {
        requestId,
        userId: session.user.id,
      });
      return StandardErrorResponse.badRequest(
        "No organization found",
        "integrations",
        null,
        requestId,
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;

    // Get template
    const template = await prisma.integrationTemplate.findFirst({
      where: {
        id: params.id,
        isPublic: true, // Only public templates are accessible
      },
    });

    if (!template) {
      logger.warn("Template not found", "integrations", {
        requestId,
        templateId: params.id,
      });
      return StandardErrorResponse.notFound("Template", requestId);
    }

    logger.info("Template retrieved successfully", "integrations", {
      requestId,
      templateId: params.id,
      organizationId,
    });

    return NextResponse.json({
      template: {
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.category,
        defaultConfig: template.defaultConfig,
        isPublic: template.isPublic,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      },
    });
  } catch (error) {
    logger.error("Error getting integration template", "integrations", error);
    return StandardErrorResponse.internal(
      "Failed to get template",
      null,
      requestId,
    );
  }
}

/**
 * PUT /api/integrations/templates/[id] - Update integration template
 */
export async function PUT(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();

  try {
    logger.info("Updating integration template", "integrations", {
      requestId,
      templateId: params.id,
    });

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      logger.warn("Unauthorized access attempt", "integrations", { requestId });
      return StandardErrorResponse.unauthorized(
        "Unauthorized",
        "integrations",
        requestId,
      );
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organizationMemberships: { include: { organization: true } } },
    });

    if (!user?.organizationMemberships?.[0]) {
      logger.warn("No organization found for user", "integrations", {
        requestId,
        userId: session.user.id,
      });
      return StandardErrorResponse.badRequest(
        "No organization found",
        "integrations",
        null,
        requestId,
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;

    const body = await _request.json();
    const validationResult = UpdateTemplateSchema.safeParse(body);

    if (!validationResult.success) {
      logger.warn("Validation failed for template update", "integrations", {
        requestId,
        errors: validationResult.error.errors,
      });
      return handleZodError(validationResult.error, requestId);
    }

    const updateData = validationResult.data;

    // Check if template exists and user has permission
    const existingTemplate = await prisma.integrationTemplate.findFirst({
      where: {
        id: params.id,
        // Note: Templates are global, but we might want to add organization-specific templates later
      },
    });

    if (!existingTemplate) {
      logger.warn("Template not found or access denied", "integrations", {
        requestId,
        templateId: params.id,
        organizationId,
      });
      return StandardErrorResponse.notFound("Template", requestId);
    }

    // Update template
    const updatedTemplate = await prisma.integrationTemplate.update({
      where: { id: params.id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });

    logger.info("Template updated successfully", "integrations", {
      requestId,
      templateId: params.id,
      organizationId,
    });

    return NextResponse.json({
      template: {
        id: updatedTemplate.id,
        name: updatedTemplate.name,
        description: updatedTemplate.description,
        category: updatedTemplate.category,
        defaultConfig: updatedTemplate.defaultConfig,
        isPublic: updatedTemplate.isPublic,
        createdAt: updatedTemplate.createdAt,
        updatedAt: updatedTemplate.updatedAt,
      },
    });
  } catch (error) {
    logger.error("Failed to update template", "integrations", error);
    return StandardErrorResponse.internal(
      "Failed to update template",
      null,
      requestId,
    );
  }
}

/**
 * DELETE /api/integrations/templates/[id] - Delete integration template
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();

  try {
    logger.info("Deleting integration template", "integrations", {
      requestId,
      templateId: params.id,
    });

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      logger.warn("Unauthorized access attempt", "integrations", { requestId });
      return StandardErrorResponse.unauthorized(
        "Unauthorized",
        "integrations",
        requestId,
      );
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organizationMemberships: { include: { organization: true } } },
    });

    if (!user?.organizationMemberships?.[0]) {
      logger.warn("No organization found for user", "integrations", {
        requestId,
        userId: session.user.id,
      });
      return StandardErrorResponse.badRequest(
        "No organization found",
        "integrations",
        null,
        requestId,
      );
    }

    const organizationId = user.organizationMemberships[0].organizationId;

    // Check if template exists and user has permission
    const existingTemplate = await prisma.integrationTemplate.findFirst({
      where: {
        id: params.id,
        // Note: Templates are global, but we might want to add organization-specific templates later
      },
    });

    if (!existingTemplate) {
      logger.warn("Template not found or access denied", "integrations", {
        requestId,
        templateId: params.id,
        organizationId,
      });
      return StandardErrorResponse.notFound("Template", requestId);
    }

    // Delete template
    await prisma.integrationTemplate.delete({
      where: { id: params.id },
    });

    logger.info("Template deleted successfully", "integrations", {
      requestId,
      templateId: params.id,
      organizationId,
    });

    return StandardSuccessResponse.ok({ success: true }, requestId);
  } catch (error) {
    logger.error("Failed to delete template", "integrations", error);
    return StandardErrorResponse.internal(
      "Failed to delete template",
      null,
      requestId,
    );
  }
}
