import { NextRequest } from "next/server";
import { withErrorHandling, successResponse, errorResponse, checkMethod, validateRequest } from "@/lib/api-utils";
import { getCurrentProfile } from "@/lib/auth-clerk"; // or use your preferred auth method
import { db } from "@/lib/db";
import { createPostSchema } from "@/lib/validations";

/**
 * GET /api/posts
 * Get all posts with pagination and filtering
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  checkMethod(request, ["GET"]);

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "10"), 50);
  const search = url.searchParams.get("search");
  const published = url.searchParams.get("published");
  const featured = url.searchParams.get("featured");
  const categoryId = url.searchParams.get("categoryId");
  const authorId = url.searchParams.get("authorId");

  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {};
  
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { content: { contains: search, mode: "insensitive" } },
    ];
  }
  
  if (published !== null) {
    where.published = published === "true";
  }
  
  if (featured !== null) {
    where.featured = featured === "true";
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

  return successResponse({
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
});

/**
 * POST /api/posts
 * Create a new post
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  checkMethod(request, ["POST"]);

  // Get current user
  const profile = await getCurrentProfile();
  if (!profile) {
    return errorResponse("Unauthorized", 401);
  }

  // Validate request body
  const data = await validateRequest(request, createPostSchema);

  // Create post
  const post = await db.post.create({
    data: {
      title: data.title,
      content: data.content,
      published: data.published || false,
      featured: data.featured || false,
      imageUrl: data.imageUrl || null,
      authorId: profile.id,
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

  return successResponse(post, "Post created successfully", 201);
});