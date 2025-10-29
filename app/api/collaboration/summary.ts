import { NextApiRequest, NextApiResponse } from "next";
import { db as prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { getEventSummary } from "./events";

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

    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { sessionId, timeRange = "hour" } = req.query;

    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    // Verify user has access to the session
    const collaborationSession = await prisma.collaborationSession.findFirst({
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

    if (!collaborationSession) {
      return res
        .status(404)
        .json({ error: "Session not found or access denied" });
    }

    const summary = await getEventSummary(
      sessionId as string,
      timeRange as "hour" | "day" | "week",
    );

    return res.status(200).json(summary);
  } catch (error) {
    console.error("Summary API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
