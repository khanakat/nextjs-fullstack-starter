import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { RBACService } from "@/lib/security/rbac";
import { SecurityMonitoringService } from "@/lib/security/monitoring";
import { db as prisma } from "@/lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if user has permission to view security monitoring
    const hasPermission = await RBACService.hasPermission(
      userId,
      "security_monitoring",
      "read",
    );
    if (!hasPermission) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    if (req.method === "GET") {
      const {
        page = "1",
        limit = "50",
        type,
        severity,
        resolved,
        startDate,
        endDate,
        organizationId,
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = Math.min(parseInt(limit as string), 100);
      const offset = (pageNum - 1) * limitNum;

      // Build filters
      const filters: any = {};

      if (organizationId) {
        filters.organizationId = organizationId as string;
      }

      if (type) {
        filters.type = type as string;
      }

      if (severity) {
        filters.severity = severity as string;
      }

      if (resolved !== undefined) {
        // Map resolved to resolvedAt field - resolved=true means resolvedAt is not null
        if (resolved === "true") {
          filters.resolvedAt = { not: null };
        } else {
          filters.resolvedAt = null;
        }
      }

      if (startDate || endDate) {
        filters.createdAt = {};
        if (startDate) {
          filters.createdAt.gte = new Date(startDate as string);
        }
        if (endDate) {
          filters.createdAt.lte = new Date(endDate as string);
        }
      }

      // Get security events
      const events = await prisma.securityEvent.findMany({
        where: filters,
        orderBy: { createdAt: "desc" },
        take: limitNum,
        skip: offset,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              username: true,
            },
          },
        },
      });

      // Get total count
      const total = await prisma.securityEvent.count({ where: filters });

      // Get event statistics
      const stats = await prisma.securityEvent.groupBy({
        by: ["type", "severity"],
        where: filters,
        _count: {
          type: true,
        },
      });

      const eventStats = {
        byType: {} as Record<string, number>,
        bySeverity: {} as Record<string, number>,
      };

      stats.forEach((stat) => {
        eventStats.byType[stat.type] =
          (eventStats.byType[stat.type] || 0) + stat._count.type;
        eventStats.bySeverity[stat.severity] =
          (eventStats.bySeverity[stat.severity] || 0) + stat._count.type;
      });

      res.status(200).json({
        events,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
        stats: eventStats,
      });
    } else if (req.method === "PUT") {
      // Update security event (mark as resolved, add notes, etc.)
      const { eventId, resolved, notes } = req.body;

      if (!eventId) {
        return res.status(400).json({ message: "Event ID is required" });
      }

      const event = await prisma.securityEvent.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        return res.status(404).json({ message: "Security event not found" });
      }

      // Update the event
      const updatedEvent = await prisma.securityEvent.update({
        where: { id: eventId },
        data: {
          resolvedAt: resolved
            ? new Date()
            : resolved === false
              ? null
              : event.resolvedAt,
          resolvedBy: resolved
            ? userId
            : resolved === false
              ? null
              : event.resolvedBy,
          resolution: notes !== undefined ? notes : event.resolution,
          updatedAt: new Date(),
        },
      });

      // Log the event update using static method
      await SecurityMonitoringService.monitorSecurityEvents();

      res.status(200).json({
        message: "Security event updated successfully",
        event: updatedEvent,
      });
    } else if (req.method === "POST") {
      // Create new security event (for manual reporting)
      const { type, severity, details, organizationId } = req.body;

      if (!type || !severity) {
        return res
          .status(400)
          .json({ message: "Type and severity are required" });
      }

      // Create security event directly using Prisma
      const event = await prisma.securityEvent.create({
        data: {
          type,
          severity,
          category: "system", // Required field
          title: type,
          description: JSON.stringify(details || {}),
          userId,
          organizationId: organizationId || null,
          detectedBy: "user",
          riskScore:
            severity === "critical"
              ? 90
              : severity === "high"
                ? 70
                : severity === "medium"
                  ? 50
                  : 30,
          metadata: JSON.stringify(details || {}),
        },
      });

      res.status(201).json({
        message: "Security event created successfully",
        eventId: event.id,
      });
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("Security events API error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
