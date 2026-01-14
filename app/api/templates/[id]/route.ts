import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { container } from "@/shared/infrastructure/di/container";
import { ReportTypes } from "@/shared/infrastructure/di/reporting.types";
import { StandardErrorResponse, StandardSuccessResponse } from "@/lib/standardized-error-responses";
import { logger } from "@/lib/logger";
import { generateRequestId } from "@/lib/utils";
import { z } from "zod";

// Validation schema for updates
const updateTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  // Relax config validation to allow partial updates
  config: z.record(z.any()).optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

// GET /api/templates/[id] - Get a specific template
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();
    if (!userId) {
      return StandardErrorResponse.unauthorized(
        "Authentication required to access templates",
        requestId,
      );
    }

    logger.info("Fetching template by ID", "templates", {
      requestId,
      userId,
      templateId: params.id,
    });

    // Get controller from DI container
    const controller = container.get<any>(ReportTypes.ReportTemplatesApiController);

    const result = await controller.getTemplate(params.id);

    if (!result.success) {
      return StandardErrorResponse.internal(
        result.error || "Failed to fetch template",
        requestId,
      );
    }

    if (!result.data) {
      return StandardErrorResponse.notFound(
        "Template not found",
        requestId,
      );
    }

    return StandardSuccessResponse.ok({
      template: result.data,
    }, requestId);
  } catch (error) {
    logger.error("Error processing template request", "template", error);
    return StandardErrorResponse.internal("Failed to process template request", requestId);
  }
}

// PUT /api/templates/[id] - Update a template
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();
    if (!userId) {
      return StandardErrorResponse.unauthorized(
        "Authentication required to update templates",
        requestId,
      );
    }

    const body = await request.json();
    const validatedData = updateTemplateSchema.parse(body);

    logger.info("Updating template", "templates", {
      requestId,
      userId,
      templateId: params.id,
    });

    // Get controller from DI container
    const controller = container.get<any>(ReportTypes.ReportTemplatesApiController);

    const result = await controller.updateTemplate(
      params.id,
      userId,
      validatedData
    );

    if (!result.success) {
      return StandardErrorResponse.internal(
        result.error || "Failed to update template",
        requestId,
      );
    }

    return StandardSuccessResponse.ok({
      template: result.data,
    }, requestId);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return StandardErrorResponse.validation(error, requestId);
    }

    logger.error("Error updating template", "template", error);
    return StandardErrorResponse.internal("Failed to update template", requestId);
  }
}

// DELETE /api/templates/[id] - Delete a template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();
    if (!userId) {
      return StandardErrorResponse.unauthorized(
        "Authentication required to delete templates",
        requestId,
      );
    }

    logger.info("Deleting template", "templates", {
      requestId,
      userId,
      templateId: params.id,
    });

    // Get controller from DI container
    const controller = container.get<any>(ReportTypes.ReportTemplatesApiController);

    const result = await controller.deleteTemplate(params.id, userId);

    if (!result.success) {
      return StandardErrorResponse.internal(
        result.error || "Failed to delete template",
        requestId,
      );
    }

    return StandardSuccessResponse.ok({
      message: "Template deleted successfully",
    }, requestId);
  } catch (error) {
    logger.error("Error deleting template", "template", error);
    return StandardErrorResponse.internal("Failed to delete template", requestId);
  }
}
