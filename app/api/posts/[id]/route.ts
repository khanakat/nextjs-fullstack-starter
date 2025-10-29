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
const PostIdSchema = z.object({
  id: z.string().min(1, "Post ID is required"),
});

const UpdatePostSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title too long")
    .optional(),
  content: z.string().min(1, "Content is required").optional(),
  published: z.boolean().optional(),
  featured: z.boolean().optional(),
  imageUrl: z.string().url().optional().nullable(),
  categoryIds: z.array(z.string()).optional(),
  tagNames: z.array(z.string()).optional(),
});

/**
 * GET /api/posts/[id]
 * Get a specific post by ID
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();

  try {
    // Authentication
    const { userId } = await auth();
    if (!userId) {
      logger.warn("Unauthorized access attempt", "posts", {
        requestId,
        endpoint: `/api/posts/${params.id}`,
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

    // Validate post ID
    const validationResult = PostIdSchema.safeParse({ id: params.id });
    if (!validationResult.success) {
      logger.warn("Invalid post ID", "posts", { requestId, postId: params.id });
      return handleZodError(validationResult.error);
    }

    // Get post
    const post = await db.post.findUnique({
      where: { id: params.id },
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
    });

    if (!post) {
      logger.warn("Post not found", "posts", { requestId, postId: params.id });
      return StandardErrorResponse.notFound("Post not found");
    }

    logger.info("Post retrieved successfully", "posts", {
      requestId,
      userId,
      postId: post.id,
      title: post.title,
    });

    return StandardSuccessResponse.ok(post);
  } catch (error) {
    logger.error("Error retrieving post", "posts", error);
    return StandardErrorResponse.internal("Failed to retrieve post");
  }
}

/**
 * PUT /api/posts/[id]
 * Update a specific post
 */
export async function PUT(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();

  try {
    // Authentication
    const { userId } = await auth();
    if (!userId) {
      logger.warn("Unauthorized access attempt", "posts", {
        requestId,
        endpoint: `/api/posts/${params.id}`,
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

    if (!hasPermission(userWithRole, "update", "posts")) {
      logger.warn("Insufficient permissions", "posts", {
        requestId,
        userId,
        action: "posts:update",
      });
      return StandardErrorResponse.forbidden(
        "Insufficient permissions to update posts",
      );
    }

    // Validate post ID
    const idValidationResult = PostIdSchema.safeParse({ id: params.id });
    if (!idValidationResult.success) {
      logger.warn("Invalid post ID", "posts", { requestId, postId: params.id });
      return handleZodError(idValidationResult.error);
    }

    // Check if post exists
    const existingPost = await db.post.findUnique({
      where: { id: params.id },
      select: { id: true, authorId: true },
    });

    if (!existingPost) {
      logger.warn("Post not found", "posts", { requestId, postId: params.id });
      return StandardErrorResponse.notFound("Post not found");
    }

    // Check if user owns the post or has admin permissions
    if (
      existingPost.authorId !== user.id &&
      !hasPermission(userWithRole, "admin", "posts")
    ) {
      logger.warn("Insufficient permissions to update this post", "posts", {
        requestId,
        userId,
        postId: params.id,
        authorId: existingPost.authorId,
      });
      return StandardErrorResponse.forbidden(
        "You can only update your own posts unless you have admin permissions",
      );
    }

    // Parse and validate request body
    const body = await _request.json();
    const bodyValidationResult = UpdatePostSchema.safeParse(body);
    if (!bodyValidationResult.success) {
      logger.warn("Invalid request body", "posts", {
        requestId,
        errors: bodyValidationResult.error.errors,
      });
      return handleZodError(bodyValidationResult.error);
    }

    const data = bodyValidationResult.data;

    // Update post
    const updatedPost = await db.post.update({
      where: { id: params.id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.content && { content: data.content }),
        ...(data.published !== undefined && { published: data.published }),
        ...(data.featured !== undefined && { featured: data.featured }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
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
      },
    });

    // Update categories if provided
    if (data.categoryIds) {
      // Remove existing categories
      await db.postCategory.deleteMany({
        where: { postId: params.id },
      });

      // Add new categories
      if (data.categoryIds.length > 0) {
        await db.postCategory.createMany({
          data: data.categoryIds.map((categoryId: string) => ({
            postId: params.id,
            categoryId,
          })),
        });
      }
    }

    // Update tags if provided
    if (data.tagNames) {
      // Remove existing tags
      await db.postTag.deleteMany({
        where: { postId: params.id },
      });

      // Add new tags
      if (data.tagNames.length > 0) {
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
              postId: params.id,
              tagId: tag.id,
            },
          });
        }
      }
    }

    logger.info("Post updated successfully", "posts", {
      requestId,
      userId,
      postId: updatedPost.id,
      title: updatedPost.title,
    });

    return StandardSuccessResponse.ok(updatedPost, "Post updated successfully");
  } catch (error) {
    logger.error("Error updating post", "posts", error);
    return StandardErrorResponse.internal("Failed to update post");
  }
}

/**
 * DELETE /api/posts/[id]
 * Delete a specific post
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();

  try {
    // Authentication
    const { userId } = await auth();
    if (!userId) {
      logger.warn("Unauthorized access attempt", "posts", {
        requestId,
        endpoint: `/api/posts/${params.id}`,
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

    if (!hasPermission(userWithRole, "delete", "posts")) {
      logger.warn("Insufficient permissions", "posts", {
        requestId,
        userId,
        action: "posts:delete",
      });
      return StandardErrorResponse.forbidden(
        "Insufficient permissions to delete posts",
      );
    }

    // Validate post ID
    const validationResult = PostIdSchema.safeParse({ id: params.id });
    if (!validationResult.success) {
      logger.warn("Invalid post ID", "posts", { requestId, postId: params.id });
      return handleZodError(validationResult.error);
    }

    // Check if post exists
    const existingPost = await db.post.findUnique({
      where: { id: params.id },
      select: { id: true, authorId: true, title: true },
    });

    if (!existingPost) {
      logger.warn("Post not found", "posts", { requestId, postId: params.id });
      return StandardErrorResponse.notFound("Post not found");
    }

    // Check if user owns the post or has admin permissions
    if (
      existingPost.authorId !== user.id &&
      !hasPermission(userWithRole, "admin", "posts")
    ) {
      logger.warn("Insufficient permissions to delete this post", "posts", {
        requestId,
        userId,
        postId: params.id,
        authorId: existingPost.authorId,
      });
      return StandardErrorResponse.forbidden(
        "You can only delete your own posts unless you have admin permissions",
      );
    }

    // Delete related records first
    await Promise.all([
      db.postCategory.deleteMany({ where: { postId: params.id } }),
      db.postTag.deleteMany({ where: { postId: params.id } }),
      db.comment.deleteMany({ where: { postId: params.id } }),
      db.like.deleteMany({ where: { postId: params.id } }),
    ]);

    // Delete the post
    await db.post.delete({
      where: { id: params.id },
    });

    logger.info("Post deleted successfully", "posts", {
      requestId,
      userId,
      postId: params.id,
      title: existingPost.title,
    });

    return StandardSuccessResponse.ok(
      { id: params.id },
      "Post deleted successfully",
    );
  } catch (error) {
    logger.error("Error deleting post", "posts", error);
    return StandardErrorResponse.internal("Failed to delete post");
  }
}
