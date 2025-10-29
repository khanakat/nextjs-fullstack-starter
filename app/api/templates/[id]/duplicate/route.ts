import { NextRequest } from "next/server";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { logger } from "@/lib/logger";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

// POST /api/templates/[id]/duplicate - Duplicate a template
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return StandardErrorResponse.unauthorized("Authentication required");
    }

    const templateId = params.id;

    // Find the original template
    const originalTemplate = await db.template.findUnique({
      where: { id: templateId },
      include: {
        category: true,
      },
    });

    if (!originalTemplate) {
      return StandardErrorResponse.notFound("Template not found");
    }

    // Check if user has access to the template
    if (!originalTemplate.isPublic && originalTemplate.createdBy !== userId) {
      return StandardErrorResponse.forbidden("Access denied");
    }

    // Create duplicate template
    const duplicatedTemplate = await db.template.create({
      data: {
        name: `${originalTemplate.name} (Copy)`,
        description: originalTemplate.description,
        categoryId: originalTemplate.categoryId,
        config: originalTemplate.config,
        isPublic: false, // Duplicated templates are private by default
        createdBy: userId,
      },
      include: {
        category: true,
        reports: {
          select: {
            id: true,
            name: true,
            createdAt: true,
          },
          take: 3,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return StandardSuccessResponse.created(duplicatedTemplate);
  } catch (error) {
    logger.error("Error processing template request", "template", error);
    return StandardErrorResponse.internal("Failed to process template request");
  }
}
