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
import { handleZodError } from "@/lib/error-handlers";

// Validation schema for creating categories
const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
});

// GET /api/template-categories - List all template categories
export async function GET(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();
    if (!userId) {
      return StandardErrorResponse.unauthorized(
        "Authentication required to access template categories",
        requestId,
      );
    }

    logger.info("Fetching template categories", "templates", {
      requestId,
      userId,
    });

    const categories = await db.templateCategory.findMany({
      include: {
        templates: {
          select: {
            id: true,
            name: true,
            isPublic: true,
            createdBy: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Filter templates based on user access
    const filteredCategories = categories.map((category) => ({
      ...category,
      templates: category.templates.filter(
        (template) => template.isPublic || template.createdBy === userId,
      ),
      templateCount: category.templates.filter(
        (template) => template.isPublic || template.createdBy === userId,
      ).length,
    }));

    return StandardSuccessResponse.create({
      categories: filteredCategories,
      requestId,
    });
  } catch (error) {
    logger.error("Error processing template categories request", {
      requestId,
      endpoint: "/api/template-categories",
      error: error instanceof Error ? error.message : error,
    });

    return StandardErrorResponse.internal(
      "Failed to process template categories request",
      requestId,
    );
  }
}

// POST /api/template-categories - Create a new template category (admin only)
export async function POST(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();
    if (!userId) {
      return StandardErrorResponse.unauthorized(
        "Authentication required to create template categories",
        requestId,
      );
    }

    const roleHeader = _request.headers.get("x-user-role") || "";
    if (roleHeader.toLowerCase() !== "admin") {
      return StandardErrorResponse.forbidden(
        "Only admins can create template categories",
        requestId,
      );
    }

    const body = await _request.json();
    const validatedData = createCategorySchema.parse(body);

    logger.info("Creating template category", "templates", {
      requestId,
      userId,
      categoryName: validatedData.name,
    });

    // Check if category name already exists
    const existingCategory = await db.templateCategory.findFirst({
      where: { name: validatedData.name },
    });

    if (existingCategory) {
      return StandardErrorResponse.badRequest(
        "Category name already exists",
        "api",
        { name: validatedData.name },
        requestId,
      );
    }

    const category = await db.templateCategory.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
      },
      include: {
        templates: true,
      },
    });

    return StandardSuccessResponse.created({
      category,
      requestId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error, requestId);
    }

    logger.error("Error processing template categories request", {
      requestId,
      endpoint: "/api/template-categories",
      error: error instanceof Error ? error.message : error,
    });

    return StandardErrorResponse.internal(
      "Failed to process template categories request",
      requestId,
    );
  }
}
