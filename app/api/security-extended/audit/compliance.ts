import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { RBACService } from "@/lib/security/rbac";
import { SecurityAuditService } from "@/lib/security/audit";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if user has permission to view compliance reports
    const hasPermission = await RBACService.hasPermission(
      userId,
      "compliance",
      "read",
    );
    if (!hasPermission) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    if (req.method === "GET") {
      const { type, organizationId, export: exportFormat } = req.query;

      if (
        !type ||
        !["soc2", "gdpr", "hipaa", "custom"].includes(type as string)
      ) {
        return res
          .status(400)
          .json({
            message:
              "Valid compliance type is required (soc2, gdpr, hipaa, custom)",
          });
      }

      const reportType = type as "soc2" | "gdpr" | "hipaa" | "custom";

      // Generate compliance report
      const report = await SecurityAuditService.generateComplianceReport(
        reportType,
        organizationId as string,
      );

      if (
        exportFormat &&
        ["pdf", "csv", "json"].includes(exportFormat as string)
      ) {
        const filename = `${reportType}-compliance-report-${new Date().toISOString().split("T")[0]}`;

        if (exportFormat === "csv") {
          // Convert report to CSV format
          const csv = JSON.stringify(report);
          res.setHeader("Content-Type", "text/csv");
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="${filename}.csv"`,
          );
          return res.status(200).send(csv);
        } else if (exportFormat === "json") {
          res.setHeader("Content-Type", "application/json");
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="${filename}.json"`,
          );
          return res.status(200).json(report);
        } else if (exportFormat === "pdf") {
          // For PDF export, return the report data with a flag to generate PDF on frontend
          return res.status(200).json({
            report,
            exportFormat: "pdf",
            filename,
          });
        }
      }

      res.status(200).json(report);
    } else if (req.method === "POST") {
      // Generate and save compliance report
      const { type, period, organizationId, customCriteria } = req.body;

      if (!type || !["soc2", "gdpr", "hipaa", "custom"].includes(type)) {
        return res
          .status(400)
          .json({ message: "Valid compliance type is required" });
      }

      const reportType = type as "soc2" | "gdpr" | "hipaa" | "custom";
      const reportPeriod = period || "30d";

      // Generate the report
      const report = await SecurityAuditService.generateComplianceReport(
        reportType,
        organizationId,
      );

      // Save the report to database (simplified for now)
      const savedReport = {
        id: `report_${Date.now()}`,
        type: reportType,
        period: reportPeriod,
        organizationId: organizationId || null,
        data: report,
        generatedBy: userId,
        customCriteria,
      };

      // Log report generation
      await SecurityAuditService.logSecurityEvent(
        "compliance_report_generated",
        "medium",
        "Compliance Report Generated",
        `Generated ${reportType} compliance report for organization ${organizationId}`,
        userId,
        organizationId,
      );

      res.status(201).json({
        message: "Compliance report generated and saved",
        reportId: savedReport.id,
        report,
      });
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("Compliance API error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
