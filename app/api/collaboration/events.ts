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
        return handleGetEvents(req, res, userId, organizationId);
      case "POST":
        return handleCreateEvent(req, res, userId, organizationId);
      case "DELETE":
        return handleDeleteEvents(req, res, userId, organizationId);
      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Events API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleGetEvents(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
  organizationId: string,
) {
  const {
    sessionId,
    type,
    userId: filterUserId,
    since,
    until,
    limit = "100",
    offset = "0",
    includeData = "true",
  } = req.query;

  if (!sessionId) {
    return res.status(400).json({ error: "sessionId is required" });
  }

  // Verify user has access to the session
  const session = await prisma.collaborationSession.findFirst({
    where: {
      id: sessionId as string,
      organizationId,
      participants: {
        some: {
          userId,
        },
      },
    },
  });

  if (!session) {
    return res
      .status(404)
      .json({ error: "Session not found or access denied" });
  }

  let where: any = {
    sessionId: sessionId as string,
  };

  if (type) {
    const types = Array.isArray(type) ? type : [type];
    where.type = {
      in: types,
    };
  }

  if (filterUserId) {
    where.userId = filterUserId;
  }

  if (since) {
    where.timestamp = {
      ...where.timestamp,
      gte: new Date(since as string),
    };
  }

  if (until) {
    where.timestamp = {
      ...where.timestamp,
      lte: new Date(until as string),
    };
  }

  const events = await prisma.collaborationEvent.findMany({
    where,
    select: {
      id: true,
      sessionId: true,
      type: true,
      data: true,
      metadata: true,
      userId: true,
      userName: true,
      documentId: true,
      documentType: true,
      version: true,
      position: true,
      timestamp: true,
    },
    orderBy: {
      timestamp: "desc",
    },
    take: parseInt(limit as string),
    skip: parseInt(offset as string),
  });

  const total = await prisma.collaborationEvent.count({ where });

  // Optionally exclude sensitive data
  const processedEvents = events.map((event) => ({
    ...event,
    data: includeData === "true" ? event.data : undefined,
  }));

  return res.status(200).json({
    events: processedEvents,
    pagination: {
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      hasMore: total > parseInt(offset as string) + parseInt(limit as string),
    },
  });
}

async function handleCreateEvent(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
  organizationId: string,
) {
  const { sessionId, type, data = {}, metadata = {} } = req.body;

  if (!sessionId || !type) {
    return res.status(400).json({
      error: "sessionId and type are required",
    });
  }

  // Verify user has access to the session
  const session = await prisma.collaborationSession.findFirst({
    where: {
      id: sessionId,
      organizationId,
      participants: {
        some: {
          userId,
        },
      },
    },
  });

  if (!session) {
    return res
      .status(404)
      .json({ error: "Session not found or access denied" });
  }

  const event = await prisma.collaborationEvent.create({
    data: {
      sessionId,
      type,
      data,
      metadata,
      userId,
    },
    select: {
      id: true,
      sessionId: true,
      type: true,
      data: true,
      metadata: true,
      userId: true,
      userName: true,
      documentId: true,
      documentType: true,
      version: true,
      position: true,
      timestamp: true,
    },
  });

  return res.status(201).json({ event });
}

async function handleDeleteEvents(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
  organizationId: string,
) {
  const { sessionId, olderThan } = req.query;

  if (!sessionId) {
    return res.status(400).json({ error: "sessionId is required" });
  }

  // Verify user has admin access to the session
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
    return res.status(404).json({
      error: "Session not found or insufficient permissions",
    });
  }

  let where: any = {
    sessionId: sessionId as string,
  };

  if (olderThan) {
    where.timestamp = {
      lt: new Date(olderThan as string),
    };
  }

  const deletedCount = await prisma.collaborationEvent.deleteMany({
    where,
  });

  return res.status(200).json({
    message: `Deleted ${deletedCount.count} events`,
    deletedCount: deletedCount.count,
  });
}

// Additional utility endpoints

export async function getEventSummary(
  sessionId: string,
  timeRange: "hour" | "day" | "week" = "hour",
) {
  const now = new Date();
  let since: Date;

  switch (timeRange) {
    case "hour":
      since = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case "day":
      since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "week":
      since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
  }

  const events = await prisma.collaborationEvent.findMany({
    where: {
      sessionId,
      timestamp: {
        gte: since,
      },
    },
    select: {
      type: true,
      userId: true,
      timestamp: true,
    },
  });

  const summary = {
    totalEvents: events.length,
    activeUsers: new Set(events.map((e) => e.userId)).size,
    documentChanges: events.filter((e) => e.type === "document_change").length,
    comments: events.filter((e) => e.type.includes("comment")).length,
    conflicts: events.filter((e) => e.type === "conflict_detected").length,
    eventsByType: events.reduce(
      (acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
    eventsByUser: events.reduce(
      (acc, event) => {
        acc[event.userId] = (acc[event.userId] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
    timeline: events.reduce(
      (acc, event) => {
        const hour = new Date(event.timestamp).toISOString().slice(0, 13);
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
  };

  return summary;
}

export async function getRecentActivity(sessionId: string, limit: number = 20) {
  return await prisma.collaborationEvent.findMany({
    where: {
      sessionId,
      type: {
        in: [
          "document_change",
          "comment_add",
          "user_join",
          "user_leave",
          "conflict_detected",
          "version_create",
        ],
      },
    },
    select: {
      id: true,
      sessionId: true,
      type: true,
      data: true,
      metadata: true,
      userId: true,
      userName: true,
      documentId: true,
      documentType: true,
      version: true,
      position: true,
      timestamp: true,
    },
    orderBy: {
      timestamp: "desc",
    },
    take: limit,
  });
}

export async function getUserActivity(
  userId: string,
  sessionId?: string,
  limit: number = 50,
) {
  const where: any = {
    userId,
  };

  if (sessionId) {
    where.sessionId = sessionId;
  }

  return await prisma.collaborationEvent.findMany({
    where,
    select: {
      id: true,
      sessionId: true,
      type: true,
      data: true,
      metadata: true,
      userId: true,
      userName: true,
      documentId: true,
      documentType: true,
      version: true,
      position: true,
      timestamp: true,
    },
    orderBy: {
      timestamp: "desc",
    },
    take: limit,
  });
}

export async function getEventMetrics(
  sessionId: string,
  startDate: Date,
  endDate: Date,
) {
  const events = await prisma.collaborationEvent.findMany({
    where: {
      sessionId,
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      type: true,
      userId: true,
      timestamp: true,
      data: true,
    },
  });

  const metrics = {
    totalEvents: events.length,
    uniqueUsers: new Set(events.map((e) => e.userId)).size,
    averageEventsPerUser:
      events.length / new Set(events.map((e) => e.userId)).size || 0,
    eventTypes: events.reduce(
      (acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
    hourlyDistribution: events.reduce(
      (acc, event) => {
        const hour = new Date(event.timestamp).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      },
      {} as Record<number, number>,
    ),
    dailyDistribution: events.reduce(
      (acc, event) => {
        const day = new Date(event.timestamp).toISOString().split("T")[0];
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
    peakActivity: {
      hour: Object.entries(
        events.reduce(
          (acc, event) => {
            const hour = new Date(event.timestamp).getHours();
            acc[hour] = (acc[hour] || 0) + 1;
            return acc;
          },
          {} as Record<number, number>,
        ),
      ).reduce((a, b) => (a[1] > b[1] ? a : b))?.[0],
      day: Object.entries(
        events.reduce(
          (acc, event) => {
            const day = new Date(event.timestamp).toISOString().split("T")[0];
            acc[day] = (acc[day] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        ),
      ).reduce((a, b) => (a[1] > b[1] ? a : b))?.[0],
    },
  };

  return metrics;
}
