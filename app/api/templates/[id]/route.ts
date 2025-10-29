import { NextRequest } from "next/server";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { logger } from "@/lib/logger";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { generateRequestId } from "@/lib/utils";

// Validation schema for updates
const updateTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  config: z
    .object({
      title: z.string(),
      description: z.string().optional(),
      templateId: z.string().optional(),
      filters: z.record(z.any()),
      parameters: z.record(z.any()),
      layout: z.object({
        components: z.array(z.any()),
        grid: z.object({
          columns: z.number(),
          rows: z.number(),
          gap: z.number(),
        }),
      }),
      styling: z.object({
        theme: z.enum(["light", "dark"]),
        primaryColor: z.string(),
        secondaryColor: z.string(),
        fontFamily: z.string(),
        fontSize: z.number(),
      }),
    })
    .optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

// Helper function to check template permissions
async function checkTemplatePermission(
  templateId: string,
  userId: string,
  requiredPermission: "VIEW" | "EDIT",
) {
  const template = await db.template.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    return { hasPermission: false, template: null };
  }

  // Owner has all permissions
  if (template.createdBy === userId) {
    return { hasPermission: true, template };
  }

  // Public templates can be viewed
  if (template.isPublic && requiredPermission === "VIEW") {
    return { hasPermission: true, template };
  }

  return { hasPermission: false, template };
}

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

    const { hasPermission, template } = await checkTemplatePermission(
      params.id,
      userId,
      "VIEW",
    );

    if (!hasPermission || !template) {
      return StandardErrorResponse.notFound(
        "Template not found or access denied",
        requestId,
      );
    }

    // Get full template with relations
    const fullTemplate = await db.template.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        reports: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            createdBy: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    return StandardSuccessResponse.create({
      template: fullTemplate,
      requestId,
    });
  } catch (error) {
    logger.error("Error processing template request", "template", error);
    return StandardErrorResponse.internal("Failed to process template request");
  }
}

// PUT /api/templates/[id] - Update a template
export async function PUT(
  _request: NextRequest,
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

    logger.info("Updating template", "templates", {
      requestId,
      userId,
      templateId: params.id,
    });

    const { hasPermission, template } = await checkTemplatePermission(
      params.id,
      userId,
      "EDIT",
    );

    if (!hasPermission || !template) {
      return StandardErrorResponse.notFound(
        "Template not found or access denied",
        requestId,
      );
    }

    // Only owner can edit
    if (template.createdBy !== userId) {
      return StandardErrorResponse.forbidden(
        "Only the template owner can edit it",
        requestId,
      );
    }

    const body = await _request.json();
    const validatedData = updateTemplateSchema.parse(body);

    // Verify category exists if provided
    if (validatedData.categoryId) {
      const category = await db.templateCategory.findUnique({
        where: { id: validatedData.categoryId },
      });

      if (!category) {
        return StandardErrorResponse.notFound("Category not found", requestId);
      }
    }

    // Update template
    const updatedTemplate = await db.template.update({
      where: { id: params.id },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        categoryId: validatedData.categoryId,
        config: validatedData.config
          ? JSON.stringify(validatedData.config)
          : undefined,
        isPublic: validatedData.isPublic,
      },
      include: {
        category: true,
        reports: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            createdBy: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    return StandardSuccessResponse.updated({
      template: updatedTemplate,
      requestId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return StandardErrorResponse.badRequest(
        "Validation error",
        "validation",
        { details: error.errors },
        requestId,
      );
    }

    logger.error("Error processing template request", "template", error);
    return StandardErrorResponse.internal("Failed to process template request");
  }
}

// DELETE /api/templates/[id] - Delete a template
export async function DELETE(
  _request: NextRequest,
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

    const { hasPermission, template } = await checkTemplatePermission(
      params.id,
      userId,
      "EDIT",
    );

    if (!hasPermission || !template) {
      return StandardErrorResponse.notFound(
        "Template not found or access denied",
        requestId,
      );
    }

    // Only owner can delete
    if (template.createdBy !== userId) {
      return StandardErrorResponse.forbidden(
        "Only the template owner can delete it",
        requestId,
      );
    }

    // Check if template is being used by reports
    const reportsUsingTemplate = await db.report.count({
      where: { templateId: params.id },
    });

    if (reportsUsingTemplate > 0) {
      return StandardErrorResponse.badRequest(
        "Cannot delete template that is being used by reports",
        "template",
        { reportsCount: reportsUsingTemplate },
        requestId,
      );
    }

    // Delete template
    await db.template.delete({
      where: { id: params.id },
    });

    return StandardSuccessResponse.deleted(requestId, {
      message: "Template deleted successfully",
      templateId: params.id,
    });
  } catch (error) {
    logger.error("Error processing template request", "template", error);
    return StandardErrorResponse.internal("Failed to process template request");
  }
}

// POST /api/templates/[id]/use - Use a template to create a new report
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();
    if (!userId) {
      return StandardErrorResponse.unauthorized(
        "Authentication required to use templates",
        requestId,
      );
    }

    logger.info("Using template to create report", "templates", {
      requestId,
      userId,
      templateId: params.id,
    });

    const { hasPermission, template } = await checkTemplatePermission(
      params.id,
      userId,
      "VIEW",
    );

    if (!hasPermission || !template) {
      return StandardErrorResponse.notFound(
        "Template not found or access denied",
        requestId,
      );
    }

    const body = await _request.json();
    const { title, description } = body;

    if (!title) {
      return StandardErrorResponse.badRequest(
        "Title is required",
        "ui",
        { title: !!title },
        requestId,
      );
    }

    // Create report from template
    const report = await db.report.create({
      data: {
        name: title,
        description,
        templateId: params.id,
        config: template.config,
        isPublic: false,
        status: "draft",
        createdBy: userId,
      },
      include: {
        template: {
          include: {
            category: true,
          },
        },
      },
    });

    return StandardSuccessResponse.created({
      report,
      requestId,
    });
  } catch (error) {
    logger.error("Error processing template request", "template", error);
    return StandardErrorResponse.internal("Failed to process template request");
  }
}
