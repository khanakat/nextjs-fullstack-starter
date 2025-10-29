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
        return handleGetPresence(req, res, userId, organizationId);
      case "POST":
        return handleUpdatePresence(req, res, userId, organizationId);
      case "PUT":
        return handleUpdatePresence(req, res, userId, organizationId);
      case "DELETE":
        return handleDeletePresence(req, res, userId, organizationId);
      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Presence API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleGetPresence(
  req: NextApiRequest,
  res: NextApiResponse,
  _userId: string,
  organizationId: string,
) {
  const {
    sessionId,
    includeOffline = "false",
    limit = "50",
    userIds,
  } = req.query;

  let where: any = {
    user: {
      organizationId,
    },
  };

  // Filter by session participants if sessionId provided
  if (sessionId) {
    where.user = {
      ...where.user,
      collaborationParticipants: {
        some: {
          sessionId: sessionId as string,
          leftAt: null,
        },
      },
    };
  }

  // Filter by specific user IDs if provided
  if (userIds) {
    const userIdArray = Array.isArray(userIds) ? userIds : [userIds];
    where.userId = {
      in: userIdArray,
    };
  }

  // Filter by online status unless including offline
  if (includeOffline !== "true") {
    where.status = {
      not: "offline",
    };
  }

  const presenceRecords = await prisma.userPresence.findMany({
    where,
    select: {
      id: true,
      userId: true,
      status: true,
      location: true,
      socketId: true,
      sessionCount: true,
      deviceType: true,
      browserInfo: true,
      ipAddress: true,
      lastSeen: true,
      onlineSince: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [
      { status: "asc" }, // online first
      { lastSeen: "desc" },
    ],
    take: parseInt(limit as string),
  });

  // Enhance with additional user information
  const users = await Promise.all(
    presenceRecords.map(async (presence) => {
      // Get user's current session participation
      const currentSessions = sessionId
        ? await prisma.collaborationParticipant.findMany({
            where: {
              userId: presence.userId,
              sessionId: sessionId as string,
              leftAt: null,
            },
            include: {
              session: {
                select: {
                  id: true,
                  type: true,
                  title: true,
                  resourceType: true,
                },
              },
            },
          })
        : [];

      // Get recent activity
      const recentActivity = await prisma.collaborationEvent.findFirst({
        where: {
          userId: presence.userId,
          ...(sessionId && { sessionId: sessionId as string }),
        },
        orderBy: {
          timestamp: "desc",
        },
        select: {
          type: true,
          timestamp: true,
          data: true,
        },
      });

      return {
        userId: presence.userId,
        status: presence.status,
        location: presence.location,
        lastSeen: presence.lastSeen,
        currentSessions,
        recentActivity,
        // Additional computed fields
        isActive:
          presence.status === "online" &&
          new Date().getTime() - new Date(presence.lastSeen).getTime() < 300000, // 5 minutes
      };
    }),
  );

  // Group users by status for easier frontend handling
  const groupedUsers = {
    online: users.filter((u) => u.status === "online"),
    away: users.filter((u) => u.status === "away"),
    busy: users.filter((u) => u.status === "busy"),
    offline: users.filter((u) => u.status === "offline"),
  };

  return res.status(200).json({
    users,
    groupedUsers,
    summary: {
      total: users.length,
      online: groupedUsers.online.length,
      away: groupedUsers.away.length,
      busy: groupedUsers.busy.length,
      offline: groupedUsers.offline.length,
    },
  });
}

async function handleUpdatePresence(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
  _organizationId: string,
) {
  const {
    status,
    location,
    activity: _activity,
    metadata: _metadata = {},
  } = req.body;

  if (!status) {
    return res.status(400).json({ error: "Status is required" });
  }

  if (!["online", "away", "busy", "offline"].includes(status)) {
    return res.status(400).json({
      error: "Invalid status. Must be one of: online, away, busy, offline",
    });
  }

  const presence = await prisma.userPresence.upsert({
    where: { userId },
    update: {
      status,
      location,
      lastSeen: new Date(),
    },
    create: {
      userId,
      status,
      location,
      lastSeen: new Date(),
    },
    select: {
      id: true,
      userId: true,
      status: true,
      location: true,
      socketId: true,
      sessionCount: true,
      deviceType: true,
      browserInfo: true,
      ipAddress: true,
      lastSeen: true,
      onlineSince: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Log presence update event if in an active session
  const activeSessions = await prisma.collaborationParticipant.findMany({
    where: {
      userId,
      leftAt: null,
    },
    select: {
      sessionId: true,
    },
  });

  // Create presence update events for all active sessions
  await Promise.all(
    activeSessions.map(({ sessionId }) =>
      prisma.collaborationEvent.create({
        data: {
          sessionId,
          type: "presence_update",
          data: JSON.stringify({
            status,
            location,
            previousStatus: presence.status,
          }),
          userId,
        },
      }),
    ),
  );

  return res.status(200).json({ presence });
}

async function handleDeletePresence(
  _req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
  _organizationId: string,
) {
  // Set user as offline
  await prisma.userPresence.upsert({
    where: { userId },
    update: {
      status: "offline",
      lastSeen: new Date(),
    },
    create: {
      userId,
      status: "offline",
      lastSeen: new Date(),
    },
  });

  // Log offline event for all active sessions
  const activeSessions = await prisma.collaborationParticipant.findMany({
    where: {
      userId,
      leftAt: null,
    },
    select: {
      sessionId: true,
    },
  });

  await Promise.all(
    activeSessions.map(({ sessionId }) =>
      prisma.collaborationEvent.create({
        data: {
          sessionId,
          type: "presence_update",
          data: JSON.stringify({
            status: "offline",
          }),
          userId,
        },
      }),
    ),
  );

  return res.status(200).json({ message: "Presence cleared" });
}

// Utility functions for presence management

export async function updateUserPresence(
  userId: string,
  updates: {
    status?: "online" | "away" | "busy" | "offline";
    location?: string;
  },
) {
  return await prisma.userPresence.upsert({
    where: { userId },
    update: {
      status: updates.status,
      location: updates.location,
      lastSeen: new Date(),
    },
    create: {
      userId,
      status: updates.status || "online",
      location: updates.location,
      lastSeen: new Date(),
    },
  });
}

export async function getUserPresence(userId: string) {
  return await prisma.userPresence.findUnique({
    where: { userId },
    select: {
      id: true,
      userId: true,
      status: true,
      location: true,
      socketId: true,
      sessionCount: true,
      deviceType: true,
      browserInfo: true,
      ipAddress: true,
      lastSeen: true,
      onlineSince: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getSessionPresence(sessionId: string) {
  // Get participants for the session first
  const participants = await prisma.collaborationParticipant.findMany({
    where: {
      sessionId,
      leftAt: null,
    },
    select: {
      userId: true,
    },
  });

  const userIds = participants.map((p) => p.userId);

  return await prisma.userPresence.findMany({
    where: {
      userId: {
        in: userIds,
      },
    },
    select: {
      id: true,
      userId: true,
      status: true,
      location: true,
      socketId: true,
      sessionCount: true,
      deviceType: true,
      browserInfo: true,
      ipAddress: true,
      lastSeen: true,
      onlineSince: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function cleanupStalePresence() {
  // Mark users as offline if they haven't been seen in 10 minutes
  const staleThreshold = new Date(Date.now() - 10 * 60 * 1000);

  await prisma.userPresence.updateMany({
    where: {
      lastSeen: {
        lt: staleThreshold,
      },
      status: {
        not: "offline",
      },
    },
    data: {
      status: "offline",
    },
  });
}

// Heartbeat endpoint for keeping presence alive
export async function heartbeat(userId: string, location?: string) {
  return await prisma.userPresence.upsert({
    where: { userId },
    update: {
      lastSeen: new Date(),
      ...(location && { location }),
    },
    create: {
      userId,
      status: "online",
      location,
      lastSeen: new Date(),
    },
  });
}
