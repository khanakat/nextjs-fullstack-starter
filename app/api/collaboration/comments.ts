import { NextApiRequest, NextApiResponse } from "next";
import { db as prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get organization ID from headers or query params
    const organizationId =
      (req.headers["x-organization-id"] as string) ||
      (req.query.organizationId as string);

    switch (req.method) {
      case "GET":
        return handleGetComments(req, res, userId, organizationId);
      case "POST":
        return handleCreateComment(req, res, userId, organizationId);
      case "PUT":
        return handleUpdateComment(req, res, userId, organizationId);
      case "DELETE":
        return handleDeleteComment(req, res, userId, organizationId);
      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Comments API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleGetComments(
  req: NextApiRequest,
  res: NextApiResponse,
  _userId: string,
  organizationId: string,
) {
  const {
    documentId,
    sessionId,
    threadId,
    resolved,
    limit = "50",
    offset = "0",
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  if (!documentId && !sessionId) {
    return res.status(400).json({
      error: "Either documentId or sessionId is required",
    });
  }

  let where: any = {
    document: {
      organizationId,
    },
  };

  if (documentId) {
    where.documentId = documentId;
  }

  if (sessionId) {
    where.document = {
      ...where.document,
      collaborationSessions: {
        some: {
          id: sessionId as string,
        },
      },
    };
  }

  if (threadId) {
    where.OR = [{ id: threadId }, { parentId: threadId }];
  }

  if (resolved !== undefined) {
    where.resolved = resolved === "true";
  }

  const comments = await prisma.documentComment.findMany({
    where,
    include: {
      replies: {
        select: {
          id: true,
          content: true,
          contentType: true,
          authorId: true,
          authorName: true,
          createdAt: true,
          updatedAt: true,
          isResolved: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      _count: {
        select: {
          replies: true,
        },
      },
    },
    orderBy: {
      [sortBy as string]: sortOrder,
    },
    take: parseInt(limit as string),
    skip: parseInt(offset as string),
  });

  const total = await prisma.documentComment.count({ where });

  // Group comments by thread (top-level comments with their replies)
  const threads = comments
    .filter((comment) => !comment.parentId)
    .map((comment) => ({
      ...comment,
      replies: comments.filter((reply) => reply.parentId === comment.id),
    }));

  return res.status(200).json({
    comments: threads,
    pagination: {
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      hasMore: total > parseInt(offset as string) + parseInt(limit as string),
    },
  });
}

async function handleCreateComment(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
  organizationId: string,
) {
  const {
    documentId,
    content,
    position,
    parentId,
    metadata: _metadata = {},
  } = req.body;

  if (!documentId || !content) {
    return res.status(400).json({
      error: "documentId and content are required",
    });
  }

  // Verify user has access to the document
  const document = await prisma.collaborativeDocument.findFirst({
    where: {
      id: documentId,
      organizationId,
    },
  });

  if (!document) {
    return res.status(404).json({ error: "Document not found" });
  }

  // If this is a reply, verify parent comment exists
  if (parentId) {
    const parentComment = await prisma.documentComment.findFirst({
      where: {
        id: parentId,
        documentId,
      },
    });

    if (!parentComment) {
      return res.status(404).json({ error: "Parent comment not found" });
    }
  }

  const comment = await prisma.documentComment.create({
    data: {
      documentId,
      authorId: userId,
      content,
      position,
      parentId,
    },
    include: {
      replies: {
        select: {
          id: true,
          content: true,
          contentType: true,
          authorId: true,
          authorName: true,
          createdAt: true,
          updatedAt: true,
          isResolved: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  // Log comment creation event
  const activeSessions = await prisma.collaborationSession.findMany({
    where: {
      resourceId: documentId,
      status: "active",
    },
    select: {
      id: true,
    },
  });

  await Promise.all(
    activeSessions.map(({ id: sessionId }) =>
      prisma.collaborationEvent.create({
        data: {
          sessionId,
          type: parentId ? "comment_reply" : "comment_add",
          data: JSON.stringify({
            commentId: comment.id,
            documentId,
            content: content.substring(0, 100), // Truncate for event log
            position,
            parentId,
          }),
          userId,
        },
      }),
    ),
  );

  return res.status(201).json({ comment });
}

async function handleUpdateComment(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
  organizationId: string,
) {
  const { commentId } = req.query;
  const { content, resolved, metadata } = req.body;

  if (!commentId) {
    return res.status(400).json({ error: "Comment ID is required" });
  }

  // Verify user owns the comment or has admin permissions
  const comment = await prisma.documentComment.findFirst({
    where: {
      id: commentId as string,
      document: {
        organizationId,
      },
    },
    include: {
      document: true,
    },
  });

  if (!comment) {
    return res.status(404).json({ error: "Comment not found" });
  }

  // Check permissions: author can edit content, anyone can resolve
  const canEditContent = comment.authorId === userId;
  const canResolve = true; // Any team member can resolve comments

  if (content && !canEditContent) {
    return res.status(403).json({
      error: "Only the comment author can edit content",
    });
  }

  if (resolved !== undefined && !canResolve) {
    return res.status(403).json({
      error: "Insufficient permissions to resolve comment",
    });
  }

  const updatedComment = await prisma.documentComment.update({
    where: { id: commentId as string },
    data: {
      ...(content && { content }),
      ...(resolved !== undefined && { resolved }),
      ...(metadata && { metadata }),
      updatedAt: new Date(),
    },
    include: {
      replies: {
        select: {
          id: true,
          content: true,
          contentType: true,
          authorId: true,
          authorName: true,
          createdAt: true,
          updatedAt: true,
          isResolved: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  // Log comment update event
  const activeSessions = await prisma.collaborationSession.findMany({
    where: {
      resourceId: comment.documentId,
      status: "active",
    },
    select: {
      id: true,
    },
  });

  await Promise.all(
    activeSessions.map(({ id: sessionId }) =>
      prisma.collaborationEvent.create({
        data: {
          sessionId,
          type: resolved !== undefined ? "comment_resolve" : "comment_update",
          data: JSON.stringify({
            commentId: comment.id,
            documentId: comment.documentId,
            changes: { content, resolved, metadata },
          }),
          userId,
        },
      }),
    ),
  );

  return res.status(200).json({ comment: updatedComment });
}

async function handleDeleteComment(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
  organizationId: string,
) {
  const { commentId } = req.query;

  if (!commentId) {
    return res.status(400).json({ error: "Comment ID is required" });
  }

  // Verify user owns the comment or has admin permissions
  const comment = await prisma.documentComment.findFirst({
    where: {
      id: commentId as string,
      document: {
        organizationId,
      },
    },
    include: {
      document: true,
      replies: true,
    },
  });

  if (!comment) {
    return res.status(404).json({ error: "Comment not found" });
  }

  if (comment.authorId !== userId) {
    return res.status(403).json({
      error: "Only the comment author can delete the comment",
    });
  }

  // If comment has replies, soft delete by marking as deleted
  if (comment.replies.length > 0) {
    await prisma.documentComment.update({
      where: { id: commentId as string },
      data: {
        content: "[deleted]",
      },
    });
  } else {
    // Hard delete if no replies
    await prisma.documentComment.delete({
      where: { id: commentId as string },
    });
  }

  // Log comment deletion event
  const activeSessions = await prisma.collaborationSession.findMany({
    where: {
      resourceId: comment.documentId,
      status: "active",
    },
    select: {
      id: true,
    },
  });

  await Promise.all(
    activeSessions.map(({ id: sessionId }) =>
      prisma.collaborationEvent.create({
        data: {
          sessionId,
          type: "comment_delete",
          data: JSON.stringify({
            commentId: comment.id,
            documentId: comment.documentId,
            hadReplies: comment.replies.length > 0,
          }),
          userId,
        },
      }),
    ),
  );

  return res.status(200).json({ message: "Comment deleted successfully" });
}

// Additional endpoints for comment reactions

export async function addReaction(
  commentId: string,
  userId: string,
  emoji: string,
) {
  // Since reactions are stored as JSON in the DocumentComment model,
  // we need to update the reactions field directly
  const comment = await prisma.documentComment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    throw new Error("Comment not found");
  }

  const reactions = JSON.parse(comment.reactions || "{}");
  if (!reactions[emoji]) {
    reactions[emoji] = [];
  }

  if (!reactions[emoji].includes(userId)) {
    reactions[emoji].push(userId);
  }

  await prisma.documentComment.update({
    where: { id: commentId },
    data: { reactions: JSON.stringify(reactions) },
  });

  return { emoji, userId };
}

export async function removeReaction(
  commentId: string,
  userId: string,
  emoji: string,
) {
  const comment = await prisma.documentComment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    throw new Error("Comment not found");
  }

  const reactions = JSON.parse(comment.reactions || "{}");
  if (reactions[emoji]) {
    reactions[emoji] = reactions[emoji].filter((id: string) => id !== userId);
    if (reactions[emoji].length === 0) {
      delete reactions[emoji];
    }
  }

  await prisma.documentComment.update({
    where: { id: commentId },
    data: { reactions: JSON.stringify(reactions) },
  });
}

export async function getCommentThread(commentId: string) {
  return await prisma.documentComment.findUnique({
    where: { id: commentId },
    include: {
      replies: {
        select: {
          id: true,
          content: true,
          contentType: true,
          authorId: true,
          authorName: true,
          createdAt: true,
          updatedAt: true,
          isResolved: true,
          reactions: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });
}
