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
        return handleGetSessions(req, res, userId, organizationId);
      case "POST":
        return handleCreateSession(req, res, userId, organizationId);
      case "PUT":
        return handleUpdateSession(req, res, userId, organizationId);
      case "DELETE":
        return handleDeleteSession(req, res, userId, organizationId);
      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Collaboration sessions API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleGetSessions(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
  organizationId: string,
) {
  const { type, active, limit = "50", offset = "0" } = req.query;

  const where: any = {
    organizationId,
    participants: {
      some: {
        userId,
      },
    },
  };

  if (type) {
    where.type = type;
  }

  if (active === "true") {
    where.status = "active";
  }

  const sessions = await prisma.collaborationSession.findMany({
    where,
    include: {
      participants: {
        select: {
          id: true,
          sessionId: true,
          userId: true,
          role: true,
          permissions: true,
          status: true,
          isOnline: true,
          leftAt: true,
          lastActivity: true,
          eventCount: true,
          duration: true,
        },
      },
      _count: {
        select: {
          events: true,
          participants: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: parseInt(limit as string),
    skip: parseInt(offset as string),
  });

  const total = await prisma.collaborationSession.count({ where });

  return res.status(200).json({
    sessions,
    pagination: {
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      hasMore: total > parseInt(offset as string) + parseInt(limit as string),
    },
  });
}

async function handleCreateSession(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
  organizationId: string,
) {
  const {
    type,
    resourceId,
    resourceType,
    title,
    description,
    metadata: _metadata = {},
    participants = [],
  } = req.body;

  if (!type || !resourceId || !resourceType) {
    return res.status(400).json({
      error: "Missing required fields: type, resourceId, resourceType",
    });
  }

  // Check if session already exists for this resource
  const existingSession = await prisma.collaborationSession.findFirst({
    where: {
      organizationId,
      resourceId,
      resourceType,
      status: "active",
    },
  });

  if (existingSession) {
    return res.status(409).json({
      error: "Active session already exists for this resource",
      sessionId: existingSession.id,
    });
  }

  const session = await prisma.collaborationSession.create({
    data: {
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      resourceId,
      resourceType,
      title,
      description,
      status: "active",
      organizationId,
      createdBy: userId,
      participants: {
        create: [
          {
            userId,
            role: "owner",
            joinedAt: new Date(),
          },
          ...participants.map((p: any) => ({
            userId: p.userId,
            role: p.role || "member",
            joinedAt: new Date(),
          })),
        ],
      },
    },
    include: {
      participants: {
        select: {
          id: true,
          sessionId: true,
          userId: true,
          role: true,
          permissions: true,
          status: true,
          isOnline: true,
          leftAt: true,
          lastActivity: true,
          eventCount: true,
          duration: true,
        },
      },
    },
  });

  // Log session creation event
  await prisma.collaborationEvent.create({
    data: {
      sessionId: session.id,
      type: "session_create",
      data: JSON.stringify({
        sessionType: type,
        resourceId,
        resourceType,
      }),
      userId,
    },
  });

  return res.status(201).json({ session });
}

async function handleUpdateSession(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
  organizationId: string,
) {
  const { sessionId } = req.query;
  const { title, description, metadata, status } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: "Session ID is required" });
  }

  // Verify user has permission to update session
  const session = await prisma.collaborationSession.findFirst({
    where: {
      id: sessionId as string,
      organizationId,
      participants: {
        some: {
          userId,
          role: {
            in: ["owner", "admin"],
          },
        },
      },
    },
  });

  if (!session) {
    return res
      .status(404)
      .json({ error: "Session not found or insufficient permissions" });
  }

  const updatedSession = await prisma.collaborationSession.update({
    where: { id: sessionId as string },
    data: {
      ...(title && { title }),
      ...(description && { description }),
      ...(metadata && { metadata }),
      ...(status && { status }),
      updatedAt: new Date(),
    },
    include: {
      participants: {
        select: {
          id: true,
          sessionId: true,
          userId: true,
          role: true,
          permissions: true,
          status: true,
          isOnline: true,
          leftAt: true,
          lastActivity: true,
          eventCount: true,
          duration: true,
        },
      },
    },
  });

  // Log session update event
  await prisma.collaborationEvent.create({
    data: {
      sessionId: sessionId as string,
      type: "session_update",
      data: JSON.stringify({
        changes: { title, description, metadata, status },
      }),
      userId,
    },
  });

  return res.status(200).json({ session: updatedSession });
}

async function handleDeleteSession(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
  organizationId: string,
) {
  const { sessionId } = req.query;

  if (!sessionId) {
    return res.status(400).json({ error: "Session ID is required" });
  }

  // Verify user has permission to delete session
  const session = await prisma.collaborationSession.findFirst({
    where: {
      id: sessionId as string,
      organizationId,
      participants: {
        some: {
          userId,
          role: "owner",
        },
      },
    },
  });

  if (!session) {
    return res
      .status(404)
      .json({ error: "Session not found or insufficient permissions" });
  }

  // Soft delete by updating status
  await prisma.collaborationSession.update({
    where: { id: sessionId as string },
    data: {
      status: "ended",
      endedAt: new Date(),
    },
  });

  // Log session end event
  await prisma.collaborationEvent.create({
    data: {
      sessionId: sessionId as string,
      type: "session_end",
      data: JSON.stringify({
        endedBy: userId,
      }),
      userId,
    },
  });

  return res.status(200).json({ message: "Session ended successfully" });
}

// Additional endpoints for session management

export async function joinSession(
  sessionId: string,
  userId: string,
  role: string = "member",
) {
  const participant = await prisma.collaborationParticipant.upsert({
    where: {
      sessionId_userId: {
        sessionId,
        userId,
      },
    },
    update: {
      leftAt: null,
      lastActivity: new Date(),
    },
    create: {
      sessionId,
      userId,
      role,
      joinedAt: new Date(),
    },
  });

  // Log join event
  await prisma.collaborationEvent.create({
    data: {
      sessionId,
      type: "user_join",
      data: JSON.stringify({
        role,
      }),
      userId,
    },
  });

  return participant;
}

export async function leaveSession(sessionId: string, userId: string) {
  await prisma.collaborationParticipant.update({
    where: {
      sessionId_userId: {
        sessionId,
        userId,
      },
    },
    data: {
      leftAt: new Date(),
    },
  });

  // Log leave event
  await prisma.collaborationEvent.create({
    data: {
      sessionId,
      type: "user_leave",
      data: JSON.stringify({}),
      userId,
    },
  });
}

export async function getActiveParticipants(sessionId: string) {
  return await prisma.collaborationParticipant.findMany({
    where: {
      sessionId,
      leftAt: null,
    },
    select: {
      id: true,
      sessionId: true,
      userId: true,
      role: true,
      permissions: true,
      status: true,
      isOnline: true,
      leftAt: true,
      lastActivity: true,
      eventCount: true,
      duration: true,
    },
  });
}
