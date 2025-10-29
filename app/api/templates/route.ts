import { NextRequest } from "next/server";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { logger } from "@/lib/logger";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { z } from "zod";

import { handleZodError } from "@/lib/error-handlers";

// Validation schemas
const createTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  config: z.object({
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
  }),
  isPublic: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
});

// GET /api/templates - List templates with pagination and filters
export async function GET(_request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return StandardErrorResponse.unauthorized("Authentication required");
    }

    const { searchParams } = new URL(_request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const isPublic = searchParams.get("isPublic");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      OR: [{ createdBy: userId }, { isPublic: true }],
    };

    if (search) {
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    if (categoryId) {
      where.AND = where.AND || [];
      where.AND.push({ categoryId });
    }

    if (isPublic !== null) {
      where.AND = where.AND || [];
      where.AND.push({ isPublic: isPublic === "true" });
    }

    // Get templates with relations
    const [templates, total] = await Promise.all([
      db.template.findMany({
        where,
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
        orderBy: [{ updatedAt: "desc" }],
        skip,
        take: limit,
      }),
      db.template.count({ where }),
    ]);

    return StandardSuccessResponse.ok({
      templates,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    logger.error("Error processing template request", "template", error);
    return StandardErrorResponse.internal("Failed to process template request");
  }
}

// POST /api/templates - Create a new template
export async function POST(_request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return StandardErrorResponse.unauthorized("Authentication required");
    }

    const body = await _request.json();
    const validatedData = createTemplateSchema.parse(body);

    // Verify category exists if provided
    if (validatedData.categoryId) {
      const category = await db.templateCategory.findUnique({
        where: { id: validatedData.categoryId },
      });

      if (!category) {
        return StandardErrorResponse.notFound("Category not found");
      }
    }

    // Create template
    const template = await db.template.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        ...(validatedData.categoryId && {
          categoryId: validatedData.categoryId,
        }),
        config: JSON.stringify(validatedData.config),
        isPublic: validatedData.isPublic,
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

    return StandardSuccessResponse.created(template);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error);
    }

    logger.error("Error processing templates request", "template", error);
    return StandardErrorResponse.internal(
      "Failed to process templates request",
    );
  }
}
