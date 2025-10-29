import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Security Audit Service for comprehensive activity tracking
export class SecurityAuditService {
  // Log security audit event
  static async logAuditEvent(data: {
    action: string;
    resource: string;
    resourceId?: string;
    userId?: string;
    organizationId?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    endpoint?: string;
    method?: string;
    success?: boolean;
    errorCode?: string;
    errorMessage?: string;
    metadata?: any;
    riskScore?: number;
    anomalyFlags?: string[];
    complianceFlags?: string[];
  }): Promise<string | null> {
    try {
      const auditLog = await prisma.securityAuditLog.create({
        data: {
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId,
          userId: data.userId,
          organizationId: data.organizationId,
          sessionId: data.sessionId,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          endpoint: data.endpoint,
          method: data.method,
          success: data.success ?? true,
          errorCode: data.errorCode,
          errorMessage: data.errorMessage,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
          riskScore: data.riskScore,
          anomalyFlags: data.anomalyFlags
            ? JSON.stringify(data.anomalyFlags)
            : null,
          complianceFlags: data.complianceFlags
            ? JSON.stringify(data.complianceFlags)
            : null,
          retentionUntil: this.calculateRetentionDate(data.action),
        },
      });

      return auditLog.id;
    } catch (error) {
      console.error("Error logging audit event:", error);
      return null;
    }
  }

  // Get audit logs with filtering
  static async getAuditLogs(
    filters: {
      userId?: string;
      organizationId?: string;
      action?: string;
      resource?: string;
      startDate?: Date;
      endDate?: Date;
      riskScoreMin?: number;
      riskScoreMax?: number;
      success?: boolean;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<any[]> {
    try {
      const where: any = {};

      if (filters.userId) where.userId = filters.userId;
      if (filters.organizationId) where.organizationId = filters.organizationId;
      if (filters.action) where.action = { contains: filters.action };
      if (filters.resource) where.resource = filters.resource;
      if (filters.success !== undefined) where.success = filters.success;

      if (filters.startDate || filters.endDate) {
        where.timestamp = {};
        if (filters.startDate) where.timestamp.gte = filters.startDate;
        if (filters.endDate) where.timestamp.lte = filters.endDate;
      }

      if (
        filters.riskScoreMin !== undefined ||
        filters.riskScoreMax !== undefined
      ) {
        where.riskScore = {};
        if (filters.riskScoreMin !== undefined)
          where.riskScore.gte = filters.riskScoreMin;
        if (filters.riskScoreMax !== undefined)
          where.riskScore.lte = filters.riskScoreMax;
      }

      const auditLogs = await prisma.securityAuditLog.findMany({
        where,
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
          timestamp: "desc",
        },
        take: filters.limit || 100,
        skip: filters.offset || 0,
      });

      return auditLogs.map((log) => ({
        ...log,
        metadata: log.metadata ? JSON.parse(log.metadata) : null,
        anomalyFlags: log.anomalyFlags ? JSON.parse(log.anomalyFlags) : null,
        complianceFlags: log.complianceFlags
          ? JSON.parse(log.complianceFlags)
          : null,
      }));
    } catch (error) {
      console.error("Error getting audit logs:", error);
      return [];
    }
  }

  // Generate compliance report
  static async generateComplianceReport(
    type: string,
    organizationId?: string,
    periodStart?: Date,
    periodEnd?: Date,
  ): Promise<string | null> {
    try {
      const startDate =
        periodStart || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const endDate = periodEnd || new Date();

      // Get audit logs for the period
      const auditLogs = await this.getAuditLogs({
        organizationId,
        startDate,
        endDate,
        limit: 10000,
      });

      // Generate report data based on type
      let reportData: any = {};
      let complianceScore = 0;
      let findings: string[] = [];
      let recommendations: string[] = [];

      switch (type) {
        case "SOC2":
          reportData = await this.generateSOC2Report(auditLogs, organizationId);
          break;
        case "GDPR":
          reportData = await this.generateGDPRReport(auditLogs, organizationId);
          break;
        case "HIPAA":
          reportData = await this.generateHIPAAReport(
            auditLogs,
            organizationId,
          );
          break;
        default:
          reportData = await this.generateCustomReport(
            auditLogs,
            organizationId,
          );
      }

      complianceScore = this.calculateComplianceScore(reportData, type);
      findings = this.extractFindings(reportData, type);
      recommendations = this.generateRecommendations(findings, type);

      const report = await prisma.complianceReport.create({
        data: {
          type,
          title: `${type} Compliance Report`,
          description: `Compliance report for ${type} generated for period ${startDate.toISOString()} to ${endDate.toISOString()}`,
          organizationId,
          periodStart: startDate,
          periodEnd: endDate,
          data: JSON.stringify(reportData),
          status: "completed",
          generatedAt: new Date(),
          complianceScore,
          findings: JSON.stringify(findings),
          recommendations: JSON.stringify(recommendations),
        },
      });

      return report.id;
    } catch (error) {
      console.error("Error generating compliance report:", error);
      return null;
    }
  }

  // Log user authentication events
  static async logAuthEvent(
    action:
      | "LOGIN"
      | "LOGOUT"
      | "LOGIN_FAILED"
      | "MFA_SETUP"
      | "MFA_VERIFIED"
      | "PASSWORD_RESET",
    userId?: string,
    metadata?: any,
    request?: {
      ip?: string;
      userAgent?: string;
      sessionId?: string;
    },
  ): Promise<void> {
    await this.logAuditEvent({
      action,
      resource: "Authentication",
      userId,
      ipAddress: request?.ip,
      userAgent: request?.userAgent,
      sessionId: request?.sessionId,
      metadata,
      riskScore: this.calculateAuthRiskScore(action, metadata, request),
      complianceFlags: ["SOC2", "GDPR"],
    });
  }

  // Log data access events
  static async logDataAccess(
    action: "READ" | "create" | "update" | "delete" | "export",
    resource: string,
    resourceId: string,
    userId: string,
    organizationId?: string,
    metadata?: any,
  ): Promise<void> {
    await this.logAuditEvent({
      action: `DATA_${action.toUpperCase()}`,
      resource,
      resourceId,
      userId,
      organizationId,
      metadata,
      riskScore: this.calculateDataAccessRiskScore(action, resource, metadata),
      complianceFlags: ["GDPR", "HIPAA", "SOC2"],
    });
  }

  // Log security events
  static async logSecurityEvent(
    type: string,
    severity: "low" | "medium" | "high" | "critical",
    title: string,
    description?: string,
    userId?: string,
    organizationId?: string,
    metadata?: any,
  ): Promise<string | null> {
    try {
      const securityEvent = await prisma.securityEvent.create({
        data: {
          type,
          severity,
          category: this.categorizeSecurityEvent(type),
          title,
          description,
          userId,
          organizationId,
          detectedBy: "system",
          riskScore: this.calculateSecurityRiskScore(type, severity),
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      });

      // Also log as audit event
      await this.logAuditEvent({
        action: "SECURITY_EVENT",
        resource: "SecurityEvent",
        resourceId: securityEvent.id,
        userId,
        organizationId,
        metadata: { type, severity, title },
        riskScore: this.calculateSecurityRiskScore(type, severity),
      });

      return securityEvent.id;
    } catch (error) {
      console.error("Error logging security event:", error);
      return null;
    }
  }

  // Calculate retention date based on action type
  private static calculateRetentionDate(action: string): Date {
    const now = new Date();

    // Different retention periods for different types of actions
    switch (action) {
      case "LOGIN":
      case "LOGOUT":
        return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year
      case "DATA_DELETE":
      case "DATA_EXPORT":
        return new Date(now.getTime() + 7 * 365 * 24 * 60 * 60 * 1000); // 7 years
      case "SECURITY_EVENT":
        return new Date(now.getTime() + 3 * 365 * 24 * 60 * 60 * 1000); // 3 years
      default:
        return new Date(now.getTime() + 2 * 365 * 24 * 60 * 60 * 1000); // 2 years
    }
  }

  // Calculate risk score for authentication events
  private static calculateAuthRiskScore(
    action: string,
    metadata?: any,
    request?: any,
  ): number {
    let score = 0;

    // Base scores for different actions
    switch (action) {
      case "LOGIN_FAILED":
        score += 30;
        break;
      case "LOGIN":
        score += 10;
        break;
      case "MFA_SETUP":
        score += 5;
        break;
      default:
        score += 0;
    }

    // Increase score for suspicious patterns
    if (metadata?.failedAttempts > 3) score += 20;
    if (metadata?.newDevice) score += 15;
    if (metadata?.newLocation) score += 10;
    if (request?.ip && this.isKnownMaliciousIP(request.ip)) score += 50;

    return Math.min(score, 100);
  }

  // Calculate risk score for data access events
  private static calculateDataAccessRiskScore(
    action: string,
    resource: string,
    metadata?: any,
  ): number {
    let score = 0;

    // Base scores for different actions
    switch (action) {
      case "delete":
        score += 40;
        break;
      case "export":
        score += 30;
        break;
      case "update":
        score += 20;
        break;
      case "create":
        score += 10;
        break;
      case "read":
        score += 5;
        break;
    }

    // Increase score for sensitive resources
    const sensitiveResources = [
      "User",
      "Organization",
      "SecurityRole",
      "EncryptedField",
    ];
    if (sensitiveResources.includes(resource)) score += 20;

    // Increase score for bulk operations
    if (metadata?.bulkOperation) score += 15;
    if (metadata?.recordCount > 100) score += 10;

    return Math.min(score, 100);
  }

  // Calculate risk score for security events
  private static calculateSecurityRiskScore(
    type: string,
    severity: string,
  ): number {
    let score = 0;

    // Base scores for severity
    switch (severity) {
      case "critical":
        score += 90;
        break;
      case "high":
        score += 70;
        break;
      case "medium":
        score += 40;
        break;
      case "low":
        score += 20;
        break;
    }

    // Adjust for event type
    const highRiskTypes = [
      "BRUTE_FORCE",
      "DATA_BREACH",
      "PRIVILEGE_ESCALATION",
    ];
    if (highRiskTypes.includes(type)) score += 10;

    return Math.min(score, 100);
  }

  // Categorize security events
  private static categorizeSecurityEvent(type: string): string {
    const categories: { [key: string]: string } = {
      SUSPICIOUS_LOGIN: "authentication",
      BRUTE_FORCE: "authentication",
      MFA_BYPASS: "authentication",
      PRIVILEGE_ESCALATION: "authorization",
      UNAUTHORIZED_ACCESS: "authorization",
      DATA_BREACH: "data_access",
      DATA_EXFILTRATION: "data_access",
      MALWARE_DETECTED: "system",
      SYSTEM_COMPROMISE: "system",
    };

    return categories[type] || "system";
  }

  // Check if IP is known malicious (simplified)
  private static isKnownMaliciousIP(ip: string): boolean {
    // In production, integrate with threat intelligence feeds
    const knownMaliciousIPs = ["192.168.1.100", "10.0.0.100"]; // Example
    return knownMaliciousIPs.includes(ip);
  }

  // Generate SOC2 compliance report
  private static async generateSOC2Report(
    auditLogs: any[],
    _organizationId?: string,
  ): Promise<any> {
    return {
      accessControls: this.analyzeAccessControls(auditLogs),
      systemOperations: this.analyzeSystemOperations(auditLogs),
      logicalAccess: this.analyzeLogicalAccess(auditLogs),
      systemMonitoring: this.analyzeSystemMonitoring(auditLogs),
    };
  }

  // Generate GDPR compliance report
  private static async generateGDPRReport(
    auditLogs: any[],
    _organizationId?: string,
  ): Promise<any> {
    return {
      dataProcessing: this.analyzeDataProcessing(auditLogs),
      dataSubjectRights: this.analyzeDataSubjectRights(auditLogs),
      dataBreaches: this.analyzeDataBreaches(auditLogs),
      consentManagement: this.analyzeConsentManagement(auditLogs),
    };
  }

  // Generate HIPAA compliance report
  private static async generateHIPAAReport(
    auditLogs: any[],
    _organizationId?: string,
  ): Promise<any> {
    return {
      accessControls: this.analyzeAccessControls(auditLogs),
      auditControls: this.analyzeAuditControls(auditLogs),
      integrityControls: this.analyzeIntegrityControls(auditLogs),
      transmissionSecurity: this.analyzeTransmissionSecurity(auditLogs),
    };
  }

  // Generate custom compliance report
  private static async generateCustomReport(
    auditLogs: any[],
    _organizationId?: string,
  ): Promise<any> {
    return {
      summary: this.generateSummary(auditLogs),
      riskAnalysis: this.analyzeRisks(auditLogs),
      recommendations: this.generateRecommendations([], "CUSTOM"),
    };
  }

  // Helper methods for report generation
  private static analyzeAccessControls(auditLogs: any[]): any {
    const loginEvents = auditLogs.filter((log) => log.action.includes("LOGIN"));
    const failedLogins = loginEvents.filter((log) => !log.success);

    return {
      totalLogins: loginEvents.length,
      failedLogins: failedLogins.length,
      failureRate: failedLogins.length / loginEvents.length,
      uniqueUsers: new Set(loginEvents.map((log) => log.userId)).size,
    };
  }

  private static analyzeSystemOperations(auditLogs: any[]): any {
    return {
      totalOperations: auditLogs.length,
      successfulOperations: auditLogs.filter((log) => log.success).length,
      failedOperations: auditLogs.filter((log) => !log.success).length,
    };
  }

  private static analyzeLogicalAccess(auditLogs: any[]): any {
    const dataAccessEvents = auditLogs.filter((log) =>
      log.action.startsWith("DATA_"),
    );
    return {
      totalDataAccess: dataAccessEvents.length,
      dataReads: dataAccessEvents.filter((log) => log.action === "DATA_READ")
        .length,
      dataWrites: dataAccessEvents.filter(
        (log) => log.action.includes("CREATE") || log.action.includes("UPDATE"),
      ).length,
      dataDeletes: dataAccessEvents.filter(
        (log) => log.action === "DATA_DELETE",
      ).length,
    };
  }

  private static analyzeSystemMonitoring(auditLogs: any[]): any {
    const highRiskEvents = auditLogs.filter((log) => (log.riskScore || 0) > 70);
    return {
      totalEvents: auditLogs.length,
      highRiskEvents: highRiskEvents.length,
      averageRiskScore:
        auditLogs.reduce((sum, log) => sum + (log.riskScore || 0), 0) /
        auditLogs.length,
    };
  }

  private static analyzeDataProcessing(auditLogs: any[]): any {
    const dataEvents = auditLogs.filter((log) =>
      log.action.startsWith("DATA_"),
    );
    return {
      totalDataProcessing: dataEvents.length,
      personalDataAccess: dataEvents.filter((log) => log.resource === "User")
        .length,
    };
  }

  private static analyzeDataSubjectRights(auditLogs: any[]): any {
    return {
      dataExports: auditLogs.filter((log) => log.action === "DATA_EXPORT")
        .length,
      dataDeletes: auditLogs.filter((log) => log.action === "DATA_DELETE")
        .length,
    };
  }

  private static analyzeDataBreaches(auditLogs: any[]): any {
    const breachEvents = auditLogs.filter(
      (log) =>
        log.action === "SECURITY_EVENT" &&
        log.metadata &&
        JSON.parse(log.metadata).type === "DATA_BREACH",
    );
    return {
      totalBreaches: breachEvents.length,
      breachDetails: breachEvents.map((event) => ({
        timestamp: event.timestamp,
        severity: JSON.parse(event.metadata).severity,
      })),
    };
  }

  private static analyzeConsentManagement(auditLogs: any[]): any {
    return {
      consentGiven: auditLogs.filter((log) => log.action === "CONSENT_GIVEN")
        .length,
      consentWithdrawn: auditLogs.filter(
        (log) => log.action === "CONSENT_WITHDRAWN",
      ).length,
    };
  }

  private static analyzeAuditControls(auditLogs: any[]): any {
    return {
      auditLogCount: auditLogs.length,
      auditCoverage: this.calculateAuditCoverage(auditLogs),
    };
  }

  private static analyzeIntegrityControls(auditLogs: any[]): any {
    return {
      dataModifications: auditLogs.filter(
        (log) => log.action.includes("UPDATE") || log.action.includes("DELETE"),
      ).length,
      integrityChecks: auditLogs.filter(
        (log) => log.action === "INTEGRITY_CHECK",
      ).length,
    };
  }

  private static analyzeTransmissionSecurity(auditLogs: any[]): any {
    return {
      encryptedTransmissions: auditLogs.filter(
        (log) => log.metadata && JSON.parse(log.metadata).encrypted,
      ).length,
      totalTransmissions: auditLogs.filter((log) =>
        log.action.includes("TRANSMISSION"),
      ).length,
    };
  }

  private static generateSummary(auditLogs: any[]): any {
    return {
      totalEvents: auditLogs.length,
      timeRange: {
        start: auditLogs[auditLogs.length - 1]?.timestamp,
        end: auditLogs[0]?.timestamp,
      },
      topActions: this.getTopActions(auditLogs),
      topUsers: this.getTopUsers(auditLogs),
    };
  }

  private static analyzeRisks(auditLogs: any[]): any {
    const riskScores = auditLogs.map((log) => log.riskScore || 0);
    return {
      averageRiskScore:
        riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length,
      highRiskEvents: auditLogs.filter((log) => (log.riskScore || 0) > 70)
        .length,
      riskDistribution: {
        low: auditLogs.filter((log) => (log.riskScore || 0) < 30).length,
        medium: auditLogs.filter(
          (log) => (log.riskScore || 0) >= 30 && (log.riskScore || 0) < 70,
        ).length,
        high: auditLogs.filter((log) => (log.riskScore || 0) >= 70).length,
      },
    };
  }

  private static calculateComplianceScore(
    reportData: any,
    type: string,
  ): number {
    // Simplified compliance scoring
    let score = 100;

    if (type === "SOC2") {
      if (reportData.accessControls?.failureRate > 0.1) score -= 20;
      if (reportData.systemMonitoring?.highRiskEvents > 10) score -= 15;
    }

    if (type === "GDPR") {
      if (reportData.dataBreaches?.totalBreaches > 0) score -= 30;
      if (reportData.dataProcessing?.personalDataAccess > 1000) score -= 10;
    }

    return Math.max(score, 0);
  }

  private static extractFindings(reportData: any, type: string): string[] {
    const findings: string[] = [];

    if (type === "SOC2") {
      if (reportData.accessControls?.failureRate > 0.1) {
        findings.push("High login failure rate detected");
      }
    }

    if (type === "GDPR") {
      if (reportData.dataBreaches?.totalBreaches > 0) {
        findings.push("Data breaches detected during reporting period");
      }
    }

    return findings;
  }

  private static generateRecommendations(
    findings: string[],
    _type: string,
  ): string[] {
    const recommendations: string[] = [];

    findings.forEach((finding) => {
      if (finding.includes("login failure")) {
        recommendations.push("Implement account lockout policies");
        recommendations.push("Enable multi-factor authentication");
      }
      if (finding.includes("data breach")) {
        recommendations.push("Review data encryption policies");
        recommendations.push("Implement data loss prevention controls");
      }
    });

    return recommendations;
  }

  private static calculateAuditCoverage(auditLogs: any[]): number {
    // Calculate what percentage of system actions are being audited
    const auditedActions = new Set(auditLogs.map((log) => log.action));
    const totalPossibleActions = 50; // Estimated total actions in system
    return (auditedActions.size / totalPossibleActions) * 100;
  }

  private static getTopActions(auditLogs: any[]): any[] {
    const actionCounts: { [key: string]: number } = {};
    auditLogs.forEach((log) => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    });

    return Object.entries(actionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([action, count]) => ({ action, count }));
  }

  private static getTopUsers(auditLogs: any[]): any[] {
    const userCounts: { [key: string]: number } = {};
    auditLogs.forEach((log) => {
      if (log.userId) {
        userCounts[log.userId] = (userCounts[log.userId] || 0) + 1;
      }
    });

    return Object.entries(userCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([userId, count]) => ({ userId, count }));
  }
}
