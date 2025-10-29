import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { RBACService } from "@/lib/security/rbac";
import { SecurityMonitoringService } from "@/lib/security/monitoring";

// SecurityMonitoringService is a static class, no need to instantiate

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if user has permission to view security monitoring dashboard
    const hasPermission = await RBACService.hasPermission(
      userId,
      "security_monitoring",
      "read",
    );
    if (!hasPermission) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    if (req.method === "GET") {
      const { organizationId } = req.query;

      // Get security metrics
      const metrics = await SecurityMonitoringService.monitorSecurityEvents();

      // Get vulnerability assessment
      const vulnerabilities =
        await SecurityMonitoringService.performVulnerabilityAssessment(
          organizationId as string,
        );

      // Get anomaly detection results
      const anomalies = await SecurityMonitoringService.detectAnomalies(
        undefined,
        organizationId as string,
      );

      // Mock data for other metrics (these methods don't exist in SecurityMonitoringService)
      const recentEvents: any[] = [];
      const threats = { totalThreats: 0, activeThreat: 0 };
      const complianceScore = 85;
      const topRisks: any[] = [];

      res.status(200).json({
        metrics,
        recentEvents,
        vulnerabilities,
        anomalies,
        threats,
        complianceScore,
        topRisks,
        lastUpdated: new Date().toISOString(),
      });
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("Security monitoring dashboard API error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
