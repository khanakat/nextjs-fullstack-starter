import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { RBACService } from "@/lib/security/rbac";
import { SecurityAuditService } from "@/lib/security/audit";
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

    // Check if user has permission to view audit logs
    const hasPermission = await RBACService.hasPermission(
      userId,
      "audit_logs",
      "read",
    );
    if (!hasPermission) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    if (req.method === "GET") {
      const {
        page = "1",
        limit = "50",
        search,
        userId: filterUserId,
        action,
        resource,
        severity,
        startDate,
        endDate,
        riskScore,
        export: exportFormat,
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = Math.min(parseInt(limit as string), 100); // Max 100 per page
      const offset = (pageNum - 1) * limitNum;

      // Build filters
      const filters: any = {};

      if (search) {
        filters.OR = [
          { action: { contains: search as string, mode: "insensitive" } },
          { resource: { contains: search as string, mode: "insensitive" } },
          {
            details: {
              path: ["description"],
              string_contains: search as string,
            },
          },
        ];
      }

      if (filterUserId) {
        filters.userId = filterUserId as string;
      }

      if (action) {
        filters.action = action as string;
      }

      if (resource) {
        filters.resource = resource as string;
      }

      if (severity) {
        filters.severity = severity as string;
      }

      if (startDate || endDate) {
        filters.timestamp = {};
        if (startDate) {
          filters.timestamp.gte = new Date(startDate as string);
        }
        if (endDate) {
          filters.timestamp.lte = new Date(endDate as string);
        }
      }

      if (riskScore) {
        const [min, max] = (riskScore as string).split("-").map(Number);
        filters.riskScore = {};
        if (!isNaN(min)) filters.riskScore.gte = min;
        if (!isNaN(max)) filters.riskScore.lte = max;
      }

      if (exportFormat && ["csv", "json"].includes(exportFormat as string)) {
        // Export all matching records (up to 10000)
        const logs = await SecurityAuditService.getAuditLogs({
          ...filters,
          limit: 10000,
          offset: 0,
        });

        if (exportFormat === "csv") {
          // Convert logs to CSV format
          const csv = JSON.stringify(logs);
          res.setHeader("Content-Type", "text/csv");
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="audit-logs-${new Date().toISOString().split("T")[0]}.csv"`,
          );
          return res.status(200).send(csv);
        } else {
          res.setHeader("Content-Type", "application/json");
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="audit-logs-${new Date().toISOString().split("T")[0]}.json"`,
          );
          return res.status(200).json(logs);
        }
      }

      // Get paginated results
      const logs = await SecurityAuditService.getAuditLogs({
        ...filters,
        limit: limitNum,
        offset,
      });

      // Get total count for pagination
      const total = await prisma.securityAuditLog.count({ where: filters });

      // Get summary statistics (simplified)
      const severityStats = {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
      };

      res.status(200).json({
        logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
        stats: {
          total,
          severity: severityStats,
        },
      });
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("Audit logs API error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
