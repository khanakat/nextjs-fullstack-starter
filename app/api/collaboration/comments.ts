import { NextApiRequest, NextApiResponse } from "next";
import { auth } from "@clerk/nextjs/server";
import { container } from "@/shared/infrastructure/di/container";
import { CommentTypes } from "@/shared/infrastructure/di/comments.types";
import { CommentsApiController } from "@/slices/comments/presentation/controllers/comments-api.controller";

/**
 * Comments API Route
 * Migrated to Clean Architecture
 *
 * GET /api/collaboration/comments - List comments with filtering
 * POST /api/collaboration/comments - Create a new comment
 * PUT /api/collaboration/comments - Update a comment
 * DELETE /api/collaboration/comments - Delete a comment
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    // Get organization ID from headers or query params
    const organizationId =
      (req.headers["x-organization-id"] as string) ||
      (req.query.organizationId as string);

    // Get controller from DI container
    const controller = container.get<CommentsApiController>(CommentTypes.CommentsApiController);

    switch (req.method) {
      case "GET":
        return handleGetComments(req, res, controller);
      case "POST":
        return handleCreateComment(req, res, userId, controller);
      case "PUT":
        return handleUpdateComment(req, res, userId, controller);
      case "DELETE":
        return handleDeleteComment(req, res, userId, controller);
      case "PATCH":
        return handlePatchComment(req, res, userId, controller);
      default:
        return res.status(405).json({ success: false, error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Comments API error:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}

/**
 * GET /api/collaboration/comments
 * List comments with filtering and pagination
 */
async function handleGetComments(
  req: NextApiRequest,
  res: NextApiResponse,
  controller: CommentsApiController
) {
  const {
    documentId,
    authorId,
    parentId,
    resolved,
    limit = "50",
    offset = "0",
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  // Build filter options
  const options: any = {
    limit: parseInt(limit as string),
    offset: parseInt(offset as string),
    sortBy: sortBy as string,
    sortOrder: sortOrder as 'asc' | 'desc',
  };

  if (documentId) {
    options.documentId = documentId as string;
  }

  if (authorId) {
    options.authorId = authorId as string;
  }

  if (parentId) {
    options.parentId = parentId as string;
  }

  if (resolved !== undefined) {
    options.resolved = resolved === "true";
  }

  const result = await controller.listComments(options);

  if (!result.success || !result.data) {
    return res.status(400).json(result);
  }

  return res.status(200).json({
    success: true,
    comments: result.data.comments,
    pagination: {
      total: result.data.total,
      limit: options.limit,
      offset: options.offset,
      hasMore: result.data.hasMore,
    },
  });
}

/**
 * POST /api/collaboration/comments
 * Create a new comment
 */
async function handleCreateComment(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
  controller: CommentsApiController
) {
  const {
    documentId,
    content,
    position,
    parentId,
    metadata,
  } = req.body;

  // Validation
  if (!documentId || typeof documentId !== 'string') {
    return res.status(400).json({
      success: false,
      error: "documentId is required",
    });
  }

  if (!content || typeof content !== 'string') {
    return res.status(400).json({
      success: false,
      error: "content is required",
    });
  }

  // Get user info for authorName (you may want to fetch this from a user service)
  const authorName = (req.query.authorName as string) || 'Unknown User';

  const result = await controller.createComment(userId, authorName, {
    documentId,
    content,
    position,
    parentId,
    metadata,
  });

  if (!result.success || !result.data) {
    return res.status(400).json(result);
  }

  return res.status(201).json({
    success: true,
    comment: result.data,
  });
}

/**
 * PUT /api/collaboration/comments
 * Update a comment
 */
async function handleUpdateComment(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
  controller: CommentsApiController
) {
  const { commentId } = req.query;
  const { content, resolved, metadata } = req.body;

  if (!commentId || typeof commentId !== 'string') {
    return res.status(400).json({
      success: false,
      error: "Comment ID is required",
    });
  }

  const result = await controller.updateComment(commentId, userId, {
    content,
    resolved,
    metadata,
  });

  if (!result.success || !result.data) {
    return res.status(400).json(result);
  }

  return res.status(200).json({
    success: true,
    comment: result.data,
  });
}

/**
 * PATCH /api/collaboration/comments
 * Handle comment-specific operations (resolve/unresolve)
 */
async function handlePatchComment(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
  controller: CommentsApiController
) {
  const { commentId } = req.query;
  const { action } = req.body;

  if (!commentId || typeof commentId !== 'string') {
    return res.status(400).json({
      success: false,
      error: "Comment ID is required",
    });
  }

  let result;
  switch (action) {
    case 'resolve':
      result = await controller.resolveComment(commentId, userId);
      break;
    case 'unresolve':
      result = await controller.unresolveComment(commentId, userId);
      break;
    default:
      return res.status(400).json({
        success: false,
        error: "Invalid action. Use 'resolve' or 'unresolve'",
      });
  }

  if (!result.success || !result.data) {
    return res.status(400).json(result);
  }

  return res.status(200).json({
    success: true,
    comment: result.data,
  });
}

/**
 * DELETE /api/collaboration/comments
 * Delete a comment
 */
async function handleDeleteComment(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
  controller: CommentsApiController
) {
  const { commentId } = req.query;

  if (!commentId || typeof commentId !== 'string') {
    return res.status(400).json({
      success: false,
      error: "Comment ID is required",
    });
  }

  const result = await controller.deleteComment(commentId, userId);

  if (!result.success) {
    return res.status(400).json(result);
  }

  return res.status(200).json({
    success: true,
    message: "Comment deleted successfully",
  });
}

/**
 * GET /api/collaboration/comments/[id]/thread
 * Get a comment thread with all replies
 */
export async function getCommentThread(commentId: string) {
  const controller = container.get<CommentsApiController>(CommentTypes.CommentsApiController);
  const result = await controller.getCommentThread(commentId);

  if (!result.success || !result.data) {
    return null;
  }

  return result.data;
}

/**
 * POST /api/collaboration/comments/[id]/reactions
 * Add a reaction to a comment
 */
export async function addReaction(
  commentId: string,
  userId: string,
  emoji: string,
) {
  const controller = container.get<CommentsApiController>(CommentTypes.CommentsApiController);
  const result = await controller.addReaction(commentId, userId, emoji);

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to add reaction');
  }

  return result.data;
}

/**
 * DELETE /api/collaboration/comments/[id]/reactions
 * Remove a reaction from a comment
 */
export async function removeReaction(
  commentId: string,
  userId: string,
  emoji: string,
) {
  const controller = container.get<CommentsApiController>(CommentTypes.CommentsApiController);
  const result = await controller.removeReaction(commentId, userId, emoji);

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to remove reaction');
  }

  return result.data;
}
