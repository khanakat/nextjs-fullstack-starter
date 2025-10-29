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
import { hasPermission, UserRole } from "@/lib/permissions";

// Zod schemas
const GetPostsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => parseInt(val || "1")),
  limit: z
    .string()
    .optional()
    .transform((val) => Math.min(parseInt(val || "10"), 50)),
  search: z.string().optional(),
  published: z
    .string()
    .optional()
    .transform((val) =>
      val === "true" ? true : val === "false" ? false : undefined,
    ),
  featured: z
    .string()
    .optional()
    .transform((val) =>
      val === "true" ? true : val === "false" ? false : undefined,
    ),
  categoryId: z.string().optional(),
  authorId: z.string().optional(),
});

const CreatePostSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  content: z.string().min(1, "Content is required"),
  published: z.boolean().optional().default(false),
  featured: z.boolean().optional().default(false),
  imageUrl: z.string().url().optional().nullable(),
  categoryIds: z.array(z.string()).optional(),
  tagNames: z.array(z.string()).optional(),
});

/**
 * GET /api/posts
 * Get all posts with pagination and filtering
 */
export async function GET(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    // Authentication
    const { userId } = await auth();
    if (!userId) {
      logger.warn("Unauthorized access attempt", "posts", {
        requestId,
        endpoint: "/api/posts",
      });
      return StandardErrorResponse.unauthorized("Authentication required");
    }

    // Get user and organization
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: { organizationMemberships: true },
    });

    if (!user || !user.organizationMemberships.length) {
      logger.warn("User not found or no organization", "posts", {
        requestId,
        userId,
      });
      return StandardErrorResponse.forbidden(
        "User not found or not part of organization",
      );
    }

    // Permission check
    const userWithRole = {
      ...user,
      role: user.organizationMemberships[0].role as UserRole,
    };

    if (!hasPermission(userWithRole, "read", "posts")) {
      logger.warn("Insufficient permissions", "posts", {
        requestId,
        userId,
        action: "posts:read",
      });
      return StandardErrorResponse.forbidden(
        "Insufficient permissions to read posts",
      );
    }

    // Parse and validate query parameters
    const url = new URL(_request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());

    const validationResult = GetPostsQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      logger.warn("Invalid query parameters", "posts", {
        requestId,
        errors: validationResult.error.errors,
      });
      return handleZodError(validationResult.error);
    }

    const { page, limit, search, published, featured, categoryId, authorId } =
      validationResult.data;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    if (published !== undefined) {
      where.published = published;
    }

    if (featured !== undefined) {
      where.featured = featured;
    }

    if (authorId) {
      where.authorId = authorId;
    }

    if (categoryId) {
      where.categories = {
        some: {
          categoryId,
        },
      };
    }

    // Get posts with pagination
    const [posts, totalCount] = await Promise.all([
      db.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
          categories: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  color: true,
                },
              },
            },
          },
          tags: {
            include: {
              tag: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              comments: true,
              likes: true,
            },
          },
        },
      }),
      db.post.count({ where }),
    ]);

    logger.info("Posts retrieved successfully", "posts", {
      requestId,
      userId,
      count: posts.length,
      totalCount,
      page,
      limit,
    });

    return StandardSuccessResponse.ok({
      posts,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    logger.error("Error retrieving posts", "posts", error);
    return StandardErrorResponse.internal("Failed to retrieve posts");
  }
}

/**
 * POST /api/posts
 * Create a new post
 */
export async function POST(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    // Authentication
    const { userId } = await auth();
    if (!userId) {
      logger.warn("Unauthorized access attempt", "posts", {
        requestId,
        endpoint: "/api/posts",
      });
      return StandardErrorResponse.unauthorized("Authentication required");
    }

    // Get user and organization
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: { organizationMemberships: true },
    });

    if (!user || !user.organizationMemberships.length) {
      logger.warn("User not found or no organization", "posts", {
        requestId,
        userId,
      });
      return StandardErrorResponse.forbidden(
        "User not found or not part of organization",
      );
    }

    // Permission check
    const userWithRole = {
      ...user,
      role: user.organizationMemberships[0].role as UserRole,
    };

    if (!hasPermission(userWithRole, "create", "posts")) {
      logger.warn("Insufficient permissions", "posts", {
        requestId,
        userId,
        action: "posts:create",
      });
      return StandardErrorResponse.forbidden(
        "Insufficient permissions to create posts",
      );
    }

    // Parse and validate request body
    const body = await _request.json();
    const validationResult = CreatePostSchema.safeParse(body);

    if (!validationResult.success) {
      logger.warn("Invalid request body", "posts", {
        requestId,
        errors: validationResult.error.errors,
      });
      return handleZodError(validationResult.error);
    }

    const data = validationResult.data;

    // Create post
    const post = await db.post.create({
      data: {
        title: data.title,
        content: data.content,
        published: data.published,
        featured: data.featured,
        imageUrl: data.imageUrl,
        authorId: user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    });

    // Add categories if provided
    if (data.categoryIds && data.categoryIds.length > 0) {
      await db.postCategory.createMany({
        data: data.categoryIds.map((categoryId: string) => ({
          postId: post.id,
          categoryId,
        })),
      });
    }

    // Add tags if provided
    if (data.tagNames && data.tagNames.length > 0) {
      for (const tagName of data.tagNames) {
        // Create tag if it doesn't exist
        const tag = await db.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName },
        });

        // Link tag to post
        await db.postTag.create({
          data: {
            postId: post.id,
            tagId: tag.id,
          },
        });
      }
    }

    logger.info("Post created successfully", "posts", {
      requestId,
      userId,
      postId: post.id,
      title: post.title,
    });

    return StandardSuccessResponse.created(post, "Post created successfully");
  } catch (error) {
    logger.error("Error creating post", "posts", error);
    return StandardErrorResponse.internal("Failed to create post");
  }
}
