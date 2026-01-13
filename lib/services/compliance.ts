import { db as prisma } from "@/lib/db";
import {
  ComplianceReport,
  ComplianceStandard,
  AuditLogSeverity,
  AuditLogCategory,
  AuditLogStatus,
  ExportFormat,
} from "@/lib/types/audit";
import { format, subMonths } from "date-fns";
import * as XLSX from "xlsx";

// ============================================================================
// COMPLIANCE SERVICE
// ============================================================================

export class ComplianceService {
  // ============================================================================
  // COMPLIANCE REPORT GENERATION
  // ============================================================================

  /**
   * Generate comprehensive compliance report
   */
  static async generateComplianceReport(
    standard: ComplianceStandard,
    organizationId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<ComplianceReport> {
    const now = new Date();
    const reportStartDate = startDate || subMonths(now, 3); // Default: last 3 months
    const reportEndDate = endDate || now;

    // Base query conditions
    const whereConditions: any = {
      createdAt: {
        gte: reportStartDate,
        lte: reportEndDate,
      },
      complianceStandards: {
        has: standard,
      },
    };

    if (organizationId) {
      whereConditions.organizationId = organizationId;
    }

    // Get all relevant audit logs
    const auditLogs = await prisma.auditLog.findMany({
      where: whereConditions,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Generate report based on compliance standard
    switch (standard) {
      case ComplianceStandard.SOX:
        return this.generateSOXReport(
          auditLogs,
          reportStartDate,
          reportEndDate,
          organizationId,
        );
      case ComplianceStandard.GDPR:
        return this.generateGDPRReport(
          auditLogs,
          reportStartDate,
          reportEndDate,
          organizationId,
        );
      case ComplianceStandard.HIPAA:
        return this.generateHIPAAReport(
          auditLogs,
          reportStartDate,
          reportEndDate,
          organizationId,
        );
      case ComplianceStandard.PCI_DSS:
        return this.generatePCIDSSReport(
          auditLogs,
          reportStartDate,
          reportEndDate,
          organizationId,
        );
      case ComplianceStandard.ISO_27001:
        return this.generateISO27001Report(
          auditLogs,
          reportStartDate,
          reportEndDate,
          organizationId,
        );
      default:
        return this.generateGenericReport(
          auditLogs,
          reportStartDate,
          reportEndDate,
          standard,
          organizationId,
        );
    }
  }

  // ============================================================================
  // SOX COMPLIANCE REPORT
  // ============================================================================

  private static async generateSOXReport(
    auditLogs: any[],
    startDate: Date,
    endDate: Date,
    organizationId?: string,
  ): Promise<ComplianceReport> {
    const financialActivities = auditLogs.filter(
      (log) =>
        log.category === AuditLogCategory.DATA &&
        (log.resource.includes("financial") ||
          log.resource.includes("accounting") ||
          log.resource.includes("revenue") ||
          log.resource.includes("expense")),
    );

    const dataChanges = auditLogs.filter(
      (log) => log.oldValues || log.newValues,
    );

    const criticalEvents = auditLogs.filter(
      (log) =>
        log.severity === AuditLogSeverity.CRITICAL ||
        log.severity === AuditLogSeverity.HIGH,
    );

    const findings = [];
    const recommendations = [];

    // Check for SOX compliance issues
    if (financialActivities.some((log) => !log.user)) {
      findings.push({
        id: `sox-finding-${Date.now()}-1`,
        type: "violation" as const,
        severity: AuditLogSeverity.HIGH,
        title: "Access Control Violation",
        description:
          "Financial data modifications without proper user attribution detected",
        relatedLogs: financialActivities
          .filter((log) => !log.user)
          .map((log) => log.id),
        recommendation:
          "Ensure all financial data modifications are properly attributed to authenticated users",
        status: "open" as const,
      });
      recommendations.push(
        "Ensure all financial data modifications are properly attributed to authenticated users",
      );
    }

    if (dataChanges.some((log) => !log.oldValues && log.newValues)) {
      findings.push({
        id: `sox-finding-${Date.now()}-2`,
        type: "warning" as const,
        severity: AuditLogSeverity.MEDIUM,
        title: "Data Integrity Issue",
        description:
          "Data modifications without proper audit trail of previous values",
        relatedLogs: dataChanges
          .filter((log) => !log.oldValues && log.newValues)
          .map((log) => log.id),
        recommendation:
          "Implement comprehensive change tracking for all financial data modifications",
        status: "open" as const,
      });
      recommendations.push(
        "Implement comprehensive change tracking for all financial data modifications",
      );
    }

    return {
      id: `sox-${Date.now()}`,
      title: "SOX Compliance Report",
      description:
        "Sarbanes-Oxley Act compliance assessment based on audit logs",
      standard: ComplianceStandard.SOX,
      organizationId,
      period: {
        start: startDate,
        end: endDate,
      },
      generatedAt: new Date(),
      generatedBy: "system",
      summary: {
        totalEvents: auditLogs.length,
        criticalEvents: criticalEvents.length,
        securityEvents: auditLogs.filter(
          (log) => log.category === AuditLogCategory.SECURITY,
        ).length,
        dataAccessEvents: auditLogs.filter(
          (log) => log.category === AuditLogCategory.DATA,
        ).length,
        userActivityEvents: auditLogs.filter(
          (log) => log.category === AuditLogCategory.USER,
        ).length,
        systemEvents: auditLogs.filter(
          (log) => log.category === AuditLogCategory.SYSTEM,
        ).length,
        complianceScore: this.calculateComplianceScore(findings),
        riskLevel: this.calculateRiskLevel(findings),
      },
      findings,
      recommendations,
      exportFormats: [ExportFormat.PDF, ExportFormat.CSV, ExportFormat.JSON],
    };
  }

  // ============================================================================
  // GDPR COMPLIANCE REPORT
  // ============================================================================

  private static async generateGDPRReport(
    auditLogs: any[],
    startDate: Date,
    endDate: Date,
    organizationId?: string,
  ): Promise<ComplianceReport> {
    const dataProcessing = auditLogs.filter(
      (log) =>
        log.category === AuditLogCategory.DATA &&
        (log.resource.includes("user") ||
          log.resource.includes("personal") ||
          log.resource.includes("profile")),
    );

    const dataExports = auditLogs.filter(
      (log) => log.action.includes("export") || log.action.includes("download"),
    );

    const findings = [];
    const recommendations = [];

    // Check for GDPR compliance issues
    if (dataProcessing.some((log) => !log.metadata?.legalBasis)) {
      findings.push({
        id: `gdpr-finding-${Date.now()}-1`,
        type: "violation" as const,
        severity: AuditLogSeverity.HIGH,
        title: "Legal Basis Violation",
        description: "Personal data processing without documented legal basis",
        relatedLogs: dataProcessing
          .filter((log) => !log.metadata?.legalBasis)
          .map((log) => log.id),
        recommendation:
          "Document legal basis for all personal data processing activities",
        status: "open" as const,
      });
      recommendations.push(
        "Document legal basis for all personal data processing activities",
      );
    }

    if (
      dataExports.length > 0 &&
      dataExports.some((log) => !log.metadata?.purpose)
    ) {
      findings.push({
        id: `gdpr-finding-${Date.now()}-2`,
        type: "warning" as const,
        severity: AuditLogSeverity.MEDIUM,
        title: "Data Transfer Issue",
        description: "Data exports without documented purpose",
        relatedLogs: dataExports
          .filter((log) => !log.metadata?.purpose)
          .map((log) => log.id),
        recommendation: "Document purpose and destination for all data exports",
        status: "open" as const,
      });
      recommendations.push(
        "Document purpose and destination for all data exports",
      );
    }

    return {
      id: `gdpr-${Date.now()}`,
      title: "GDPR Compliance Report",
      description:
        "General Data Protection Regulation compliance assessment based on audit logs",
      standard: ComplianceStandard.GDPR,
      organizationId,
      period: {
        start: startDate,
        end: endDate,
      },
      generatedAt: new Date(),
      generatedBy: "system",
      summary: {
        totalEvents: auditLogs.length,
        criticalEvents: auditLogs.filter(
          (log) => log.severity === AuditLogSeverity.CRITICAL,
        ).length,
        securityEvents: auditLogs.filter(
          (log) => log.category === AuditLogCategory.SECURITY,
        ).length,
        dataAccessEvents: auditLogs.filter(
          (log) => log.category === AuditLogCategory.DATA,
        ).length,
        userActivityEvents: auditLogs.filter(
          (log) => log.category === AuditLogCategory.USER,
        ).length,
        systemEvents: auditLogs.filter(
          (log) => log.category === AuditLogCategory.SYSTEM,
        ).length,
        complianceScore: this.calculateComplianceScore(findings),
        riskLevel: this.calculateRiskLevel(findings),
      },
      findings,
      recommendations,
      exportFormats: [ExportFormat.PDF, ExportFormat.CSV, ExportFormat.JSON],
    };
  }

  // ============================================================================
  // HIPAA COMPLIANCE REPORT
  // ============================================================================

  private static async generateHIPAAReport(
    auditLogs: any[],
    startDate: Date,
    endDate: Date,
    organizationId?: string,
  ): Promise<ComplianceReport> {
    const phiAccess = auditLogs.filter(
      (log) =>
        log.resource.includes("patient") ||
        log.resource.includes("medical") ||
        log.resource.includes("health") ||
        log.metadata?.containsPHI === true,
    );

    const unauthorizedAccess = phiAccess.filter(
      (log) =>
        log.status === AuditLogStatus.FAILURE ||
        log.severity === AuditLogSeverity.CRITICAL,
    );

    const findings = [];
    const recommendations = [];

    if (unauthorizedAccess.length > 0) {
      findings.push({
        id: `hipaa-finding-${Date.now()}-1`,
        type: "violation" as const,
        severity: AuditLogSeverity.CRITICAL,
        title: "PHI Security Violation",
        description:
          "Unauthorized access attempts to protected health information",
        relatedLogs: unauthorizedAccess.map((log) => log.id),
        recommendation:
          "Investigate and remediate all unauthorized PHI access attempts",
        status: "open" as const,
      });
      recommendations.push(
        "Investigate and remediate all unauthorized PHI access attempts",
      );
    }

    return {
      id: `hipaa-${Date.now()}`,
      title: "HIPAA Compliance Report",
      description:
        "Health Insurance Portability and Accountability Act compliance assessment based on audit logs",
      standard: ComplianceStandard.HIPAA,
      organizationId,
      period: { start: startDate, end: endDate },
      generatedAt: new Date(),
      generatedBy: "system",
      summary: {
        totalEvents: auditLogs.length,
        criticalEvents: unauthorizedAccess.length,
        securityEvents: auditLogs.filter(
          (log) => log.category === AuditLogCategory.SECURITY,
        ).length,
        dataAccessEvents: auditLogs.filter(
          (log) => log.category === AuditLogCategory.DATA,
        ).length,
        userActivityEvents: auditLogs.filter(
          (log) => log.category === AuditLogCategory.USER,
        ).length,
        systemEvents: auditLogs.filter(
          (log) => log.category === AuditLogCategory.SYSTEM,
        ).length,
        complianceScore: this.calculateComplianceScore(findings),
        riskLevel: this.calculateRiskLevel(findings),
      },
      findings,
      recommendations,
      exportFormats: [ExportFormat.PDF, ExportFormat.CSV, ExportFormat.JSON],
    };
  }

  // ============================================================================
  // PCI DSS COMPLIANCE REPORT
  // ============================================================================

  private static async generatePCIDSSReport(
    auditLogs: any[],
    startDate: Date,
    endDate: Date,
    organizationId?: string,
  ): Promise<ComplianceReport> {
    const paymentEvents = auditLogs.filter(
      (log) =>
        log.resource.includes("payment") ||
        log.resource.includes("card") ||
        log.resource.includes("transaction") ||
        log.metadata?.containsCardData === true,
    );

    const findings = [];
    const recommendations = [];

    if (paymentEvents.some((log) => !log.metadata?.encrypted)) {
      findings.push({
        id: `pci-dss-finding-${Date.now()}-1`,
        type: "violation" as const,
        severity: AuditLogSeverity.CRITICAL,
        title: "Data Encryption Violation",
        description: "Payment data processed without proper encryption",
        relatedLogs: paymentEvents
          .filter((log) => !log.metadata?.encrypted)
          .map((log) => log.id),
        recommendation:
          "Ensure all payment card data is properly encrypted during processing",
        status: "open" as const,
      });
      recommendations.push(
        "Ensure all payment card data is properly encrypted during processing",
      );
    }

    return {
      id: `pci-dss-${Date.now()}`,
      title: "PCI DSS Compliance Report",
      description:
        "Payment Card Industry Data Security Standard compliance assessment based on audit logs",
      standard: ComplianceStandard.PCI_DSS,
      organizationId,
      period: { start: startDate, end: endDate },
      generatedAt: new Date(),
      generatedBy: "system",
      summary: {
        totalEvents: auditLogs.length,
        criticalEvents: paymentEvents.filter(
          (log) => log.severity === AuditLogSeverity.CRITICAL,
        ).length,
        securityEvents: auditLogs.filter(
          (log) => log.category === AuditLogCategory.SECURITY,
        ).length,
        dataAccessEvents: auditLogs.filter(
          (log) => log.category === AuditLogCategory.DATA,
        ).length,
        userActivityEvents: auditLogs.filter(
          (log) => log.category === AuditLogCategory.USER,
        ).length,
        systemEvents: auditLogs.filter(
          (log) => log.category === AuditLogCategory.SYSTEM,
        ).length,
        complianceScore: this.calculateComplianceScore(findings),
        riskLevel: this.calculateRiskLevel(findings),
      },
      findings,
      recommendations,
      exportFormats: [ExportFormat.PDF, ExportFormat.CSV, ExportFormat.JSON],
    };
  }

  // ============================================================================
  // ISO 27001 COMPLIANCE REPORT
  // ============================================================================

  private static async generateISO27001Report(
    auditLogs: any[],
    startDate: Date,
    endDate: Date,
    organizationId?: string,
  ): Promise<ComplianceReport> {
    const incidentEvents = auditLogs.filter(
      (log) =>
        log.severity === AuditLogSeverity.CRITICAL ||
        log.severity === AuditLogSeverity.HIGH,
    );

    const findings = [];
    const recommendations = [];

    if (incidentEvents.length > 0) {
      findings.push({
        id: `iso27001-finding-${Date.now()}-1`,
        type: "warning" as const,
        severity: AuditLogSeverity.HIGH,
        title: "Incident Management Issue",
        description: "Security incidents requiring investigation and response",
        relatedLogs: incidentEvents.map((log) => log.id),
        recommendation:
          "Implement formal incident response procedures for all security events",
        status: "open" as const,
      });
      recommendations.push(
        "Implement formal incident response procedures for all security events",
      );
    }

    return {
      id: `iso27001-${Date.now()}`,
      title: "ISO 27001 Compliance Report",
      description:
        "ISO 27001 Information Security Management System compliance assessment based on audit logs",
      standard: ComplianceStandard.ISO_27001,
      organizationId,
      period: { start: startDate, end: endDate },
      generatedAt: new Date(),
      generatedBy: "system",
      summary: {
        totalEvents: auditLogs.length,
        criticalEvents: incidentEvents.length,
        securityEvents: auditLogs.filter(
          (log) => log.category === AuditLogCategory.SECURITY,
        ).length,
        dataAccessEvents: auditLogs.filter(
          (log) => log.category === AuditLogCategory.DATA,
        ).length,
        userActivityEvents: auditLogs.filter(
          (log) => log.category === AuditLogCategory.USER,
        ).length,
        systemEvents: auditLogs.filter(
          (log) => log.category === AuditLogCategory.SYSTEM,
        ).length,
        complianceScore: this.calculateComplianceScore(findings),
        riskLevel: this.calculateRiskLevel(findings),
      },
      findings,
      recommendations,
      exportFormats: [ExportFormat.PDF, ExportFormat.CSV, ExportFormat.JSON],
    };
  }

  // ============================================================================
  // GENERIC COMPLIANCE REPORT
  // ============================================================================

  private static async generateGenericReport(
    auditLogs: any[],
    startDate: Date,
    endDate: Date,
    standard: ComplianceStandard,
    organizationId?: string,
  ): Promise<ComplianceReport> {
    const criticalEvents = auditLogs.filter(
      (log) =>
        log.severity === AuditLogSeverity.CRITICAL ||
        log.severity === AuditLogSeverity.HIGH,
    );

    return {
      id: `${standard.toLowerCase()}-${Date.now()}`,
      title: `${standard} Compliance Report`,
      description: `${standard} compliance assessment based on audit logs`,
      standard,
      organizationId,
      period: { start: startDate, end: endDate },
      generatedAt: new Date(),
      generatedBy: "system",
      summary: {
        totalEvents: auditLogs.length,
        criticalEvents: criticalEvents.length,
        securityEvents: auditLogs.filter(
          (log) => log.category === AuditLogCategory.SECURITY,
        ).length,
        dataAccessEvents: auditLogs.filter(
          (log) => log.category === AuditLogCategory.DATA,
        ).length,
        userActivityEvents: auditLogs.filter(
          (log) => log.category === AuditLogCategory.USER,
        ).length,
        systemEvents: auditLogs.filter(
          (log) => log.category === AuditLogCategory.SYSTEM,
        ).length,
        complianceScore: 85, // Default score
        riskLevel:
          criticalEvents.length > 10
            ? "high"
            : criticalEvents.length > 5
              ? "medium"
              : "low",
      },
      findings: [],
      recommendations: [
        "Regularly review audit logs for compliance violations",
        "Implement automated compliance monitoring",
        "Ensure proper access controls are in place",
      ],
      exportFormats: [ExportFormat.PDF, ExportFormat.CSV, ExportFormat.JSON],
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private static calculateComplianceScore(findings: any[]): number {
    if (findings.length === 0) return 100;

    let score = 100;
    findings.forEach((finding) => {
      switch (finding.severity) {
        case "CRITICAL":
          score -= 20;
          break;
        case "HIGH":
          score -= 10;
          break;
        case "MEDIUM":
          score -= 5;
          break;
        case "LOW":
          score -= 2;
          break;
      }
    });

    return Math.max(0, score);
  }

  private static calculateRiskLevel(
    findings: any[],
  ): "critical" | "high" | "medium" | "low" {
    const criticalFindings = findings.filter(
      (f) => f.severity === "CRITICAL",
    ).length;
    const highFindings = findings.filter((f) => f.severity === "HIGH").length;

    if (criticalFindings > 0) return "critical";
    if (highFindings > 2) return "high";
    if (highFindings > 0 || findings.length > 5) return "medium";
    return "low";
  }

  // ============================================================================
  // EXPORT METHODS
  // ============================================================================

  /**
   * Export compliance report in specified format
   */
  static async exportComplianceReport(
    report: ComplianceReport,
    format: ExportFormat,
  ): Promise<Buffer | string> {
    switch (format) {
      case ExportFormat.JSON:
        return JSON.stringify(report, null, 2);
      case ExportFormat.CSV:
        return this.exportReportAsCSV(report);
      case ExportFormat.XLSX:
        return this.exportReportAsXLSX(report);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  private static exportReportAsCSV(report: ComplianceReport): string {
    const lines: string[] = [];

    // Header
    lines.push(`Compliance Report - ${report.standard}`);
    lines.push(`Generated: ${format(report.generatedAt, "PPpp")}`);
    lines.push(
      `Period: ${format(report.period.start, "PPP")} - ${format(report.period.end, "PPP")}`,
    );
    lines.push("");

    // Summary
    lines.push("SUMMARY");
    lines.push(`Total Events,${report.summary.totalEvents}`);
    lines.push(`Critical Events,${report.summary.criticalEvents}`);
    lines.push(`Compliance Score,${report.summary.complianceScore}%`);
    lines.push(`Risk Level,${report.summary.riskLevel}`);
    lines.push("");

    // Findings
    if (report.findings.length > 0) {
      lines.push("FINDINGS");
      lines.push("ID,Type,Severity,Title,Description,Status");
      report.findings.forEach((finding) => {
        lines.push(
          `${finding.id},${finding.type},${finding.severity},"${finding.title}","${finding.description}",${finding.status}`,
        );
      });
      lines.push("");
    }

    // Recommendations
    if (report.recommendations.length > 0) {
      lines.push("RECOMMENDATIONS");
      report.recommendations.forEach((rec, index) => {
        lines.push(`${index + 1},"${rec}"`);
      });
      lines.push("");
    }

    // Summary
    lines.push("SUMMARY");
    lines.push(`Total Events,${report.summary.totalEvents}`);
    lines.push(`Critical Events,${report.summary.criticalEvents}`);
    lines.push(`Security Events,${report.summary.securityEvents}`);
    lines.push(`Data Access Events,${report.summary.dataAccessEvents}`);
    lines.push(`User Activity Events,${report.summary.userActivityEvents}`);
    lines.push(`System Events,${report.summary.systemEvents}`);
    lines.push(`Compliance Score,${report.summary.complianceScore}`);
    lines.push(`Risk Level,${report.summary.riskLevel}`);
    lines.push("");

    return lines.join("\n");
  }

  private static exportReportAsXLSX(report: ComplianceReport): Buffer {
    const workbook = XLSX.utils.book_new();
    const lines: any[] = [];

    // Summary sheet data
    const summaryRows = [
      ["Compliance Report", report.standard],
      ["Generated", format(report.generatedAt, "PPpp")],
      [
        "Period",
        `${format(report.period.start, "PPP")} - ${format(report.period.end, "PPP")}`,
      ],
      [],
      ["Metric", "Value"],
      ["Total Events", report.summary.totalEvents],
      ["Critical Events", report.summary.criticalEvents],
      ["Compliance Score", `${report.summary.complianceScore}%`],
      ["Risk Level", report.summary.riskLevel],
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

    // Findings sheet
    if (report.findings.length > 0) {
      const findingsSheet = XLSX.utils.json_to_sheet(
        report.findings.map((f) => ({
          ID: f.id,
          Type: f.type,
          Severity: f.severity,
          Title: f.title,
          Description: f.description,
          Status: f.status,
        })),
      );
      XLSX.utils.book_append_sheet(workbook, findingsSheet, "Findings");
    }

    // Recommendations sheet
    if (report.recommendations.length > 0) {
      const recsSheet = XLSX.utils.aoa_to_sheet([
        ["#", "Recommendation"],
        ...report.recommendations.map((rec, idx) => [idx + 1, rec]),
      ]);
      XLSX.utils.book_append_sheet(workbook, recsSheet, "Recommendations");
    }

    // Events sheet (optional)
    // Note: ComplianceReport doesn't have an 'events' property
    // if (report.events && report.events.length > 0) {
    //   const eventsSheet = XLSX.utils.json_to_sheet(
    //     report.events.map((e: any) => ({
    //       ID: e.id,
    //       Timestamp: format(new Date(e.timestamp), "PPpp"),
    //       Category: e.category,
    //       Severity: e.severity,
    //       Action: e.action,
    //       Status: e.status,
    //       Resource: e.resource,
    //       Actor: e.actor,
    //     })),
    //   );
    //   XLSX.utils.book_append_sheet(workbook, eventsSheet, "Events");
    // }

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    return buffer as Buffer;
  }
}
