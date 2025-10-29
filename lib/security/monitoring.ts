import { PrismaClient } from "@prisma/client";
import { SecurityAuditService } from "./audit";

const prisma = new PrismaClient();

// Security monitoring and threat detection service
export class SecurityMonitoringService {
  // Real-time security monitoring
  static async monitorSecurityEvents(): Promise<{
    activeThreats: number;
    riskScore: number;
    alerts: any[];
    recommendations: string[];
  }> {
    try {
      // Get recent security events (last 24 hours)
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const recentEvents = await prisma.securityEvent.findMany({
        where: {
          createdAt: {
            gte: last24Hours,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 100,
      });

      // Get recent audit logs for analysis
      const auditLogs = await SecurityAuditService.getAuditLogs({
        startDate: last24Hours,
        limit: 1000,
      });

      // Analyze threats
      const activeThreats = recentEvents.filter(
        (event) =>
          event.status !== "resolved" &&
          ["high", "critical"].includes(event.severity),
      ).length;

      // Calculate overall risk score
      const riskScore = this.calculateOverallRiskScore(recentEvents, auditLogs);

      // Generate alerts
      const alerts = await this.generateSecurityAlerts(recentEvents, auditLogs);

      // Generate recommendations
      const recommendations = this.generateSecurityRecommendations(
        recentEvents,
        auditLogs,
      );

      return {
        activeThreats,
        riskScore,
        alerts,
        recommendations,
      };
    } catch (error) {
      console.error("Error monitoring security events:", error);
      return {
        activeThreats: 0,
        riskScore: 0,
        alerts: [],
        recommendations: [],
      };
    }
  }

  // Detect anomalous behavior patterns
  static async detectAnomalies(
    userId?: string,
    organizationId?: string,
    timeWindow: number = 24 * 60 * 60 * 1000, // 24 hours
  ): Promise<{
    anomalies: any[];
    riskLevel: "low" | "medium" | "high" | "critical";
    confidence: number;
  }> {
    try {
      const startTime = new Date(Date.now() - timeWindow);

      // Get user activity patterns
      const auditLogs = await SecurityAuditService.getAuditLogs({
        userId,
        organizationId,
        startDate: startTime,
        limit: 5000,
      });

      const anomalies: any[] = [];

      // Detect unusual login patterns
      const loginAnomalies = this.detectLoginAnomalies(auditLogs);
      anomalies.push(...loginAnomalies);

      // Detect unusual data access patterns
      const dataAccessAnomalies = this.detectDataAccessAnomalies(auditLogs);
      anomalies.push(...dataAccessAnomalies);

      // Detect unusual time-based patterns
      const timeAnomalies = this.detectTimeAnomalies(auditLogs);
      anomalies.push(...timeAnomalies);

      // Detect unusual location patterns
      const locationAnomalies = this.detectLocationAnomalies(auditLogs);
      anomalies.push(...locationAnomalies);

      // Calculate risk level and confidence
      const riskLevel = this.calculateAnomalyRiskLevel(anomalies);
      const confidence = this.calculateAnomalyConfidence(
        anomalies,
        auditLogs.length,
      );

      return {
        anomalies,
        riskLevel,
        confidence,
      };
    } catch (error) {
      console.error("Error detecting anomalies:", error);
      return {
        anomalies: [],
        riskLevel: "low",
        confidence: 0,
      };
    }
  }

  // Vulnerability scanning and assessment
  static async performVulnerabilityAssessment(
    organizationId?: string,
  ): Promise<{
    vulnerabilities: any[];
    riskScore: number;
    recommendations: string[];
    scanId: string;
  }> {
    try {
      const vulnerabilities: any[] = [];
      let totalRiskScore = 0;

      // Check for weak passwords (simulated)
      const weakPasswordVuln = await this.checkWeakPasswords(organizationId);
      if (weakPasswordVuln) {
        vulnerabilities.push(weakPasswordVuln);
        totalRiskScore += weakPasswordVuln.riskScore;
      }

      // Check for inactive MFA
      const mfaVuln = await this.checkMFAStatus(organizationId);
      if (mfaVuln) {
        vulnerabilities.push(mfaVuln);
        totalRiskScore += mfaVuln.riskScore;
      }

      // Check for excessive permissions
      const permissionVuln =
        await this.checkExcessivePermissions(organizationId);
      if (permissionVuln) {
        vulnerabilities.push(permissionVuln);
        totalRiskScore += permissionVuln.riskScore;
      }

      // Check for outdated sessions
      const sessionVuln = await this.checkOutdatedSessions(organizationId);
      if (sessionVuln) {
        vulnerabilities.push(sessionVuln);
        totalRiskScore += sessionVuln.riskScore;
      }

      // Check for unencrypted sensitive data
      const encryptionVuln = await this.checkUnencryptedData(organizationId);
      if (encryptionVuln) {
        vulnerabilities.push(encryptionVuln);
        totalRiskScore += encryptionVuln.riskScore;
      }

      const riskScore = Math.min(totalRiskScore, 100);
      const recommendations =
        this.generateVulnerabilityRecommendations(vulnerabilities);

      // Save scan results
      const scanResult = await prisma.securityScanResult.create({
        data: {
          scanType: "vulnerability_assessment",
          scanId: `scan_${Date.now()}`,
          target: organizationId || "system",
          severity: "medium",
          title: "Vulnerability Assessment",
          description: `Found ${vulnerabilities.length} vulnerabilities`,
          status: "open",
        },
      });

      return {
        vulnerabilities,
        riskScore,
        recommendations,
        scanId: scanResult.id,
      };
    } catch (error) {
      console.error("Error performing vulnerability assessment:", error);
      return {
        vulnerabilities: [],
        riskScore: 0,
        recommendations: [],
        scanId: "",
      };
    }
  }

  // Real-time threat detection
  static async detectThreats(request: {
    ip?: string;
    userAgent?: string;
    userId?: string;
    action?: string;
    resource?: string;
    metadata?: any;
  }): Promise<{
    threatDetected: boolean;
    threatType?: string;
    riskScore: number;
    shouldBlock: boolean;
    reason?: string;
  }> {
    try {
      let riskScore = 0;
      let threatType = "";
      let reason = "";

      // Check for known malicious IPs
      if (request.ip && this.isKnownMaliciousIP(request.ip)) {
        riskScore += 80;
        threatType = "malicious_ip";
        reason = "Request from known malicious IP address";
      }

      // Check for suspicious user agents
      if (request.userAgent && this.isSuspiciousUserAgent(request.userAgent)) {
        riskScore += 30;
        threatType = threatType || "suspicious_client";
        reason = reason || "Suspicious user agent detected";
      }

      // Check for brute force patterns
      if (request.action === "LOGIN" && request.userId) {
        const bruteForceRisk = await this.checkBruteForcePattern(
          request.userId,
          request.ip,
        );
        riskScore += bruteForceRisk.riskScore;
        if (bruteForceRisk.detected) {
          threatType = "brute_force";
          reason = "Brute force attack pattern detected";
        }
      }

      // Check for privilege escalation attempts
      if (
        request.action &&
        this.isPrivilegeEscalationAttempt(request.action, request.resource)
      ) {
        riskScore += 60;
        threatType = threatType || "privilege_escalation";
        reason = reason || "Privilege escalation attempt detected";
      }

      // Check for data exfiltration patterns
      if (request.action === "DATA_EXPORT" || request.action === "DATA_READ") {
        const exfiltrationRisk = await this.checkDataExfiltrationPattern(
          request.userId,
          request.metadata,
        );
        riskScore += exfiltrationRisk.riskScore;
        if (exfiltrationRisk.detected) {
          threatType = "data_exfiltration";
          reason = "Data exfiltration pattern detected";
        }
      }

      const threatDetected = riskScore > 50;
      const shouldBlock = riskScore > 80;

      // Log security event if threat detected
      if (threatDetected) {
        await SecurityAuditService.logSecurityEvent(
          threatType,
          riskScore > 80 ? "critical" : riskScore > 60 ? "high" : "medium",
          `Threat detected: ${threatType}`,
          reason,
          request.userId,
          undefined,
          { request, riskScore },
        );
      }

      return {
        threatDetected,
        threatType: threatDetected ? threatType : undefined,
        riskScore,
        shouldBlock,
        reason: threatDetected ? reason : undefined,
      };
    } catch (error) {
      console.error("Error detecting threats:", error);
      return {
        threatDetected: false,
        riskScore: 0,
        shouldBlock: false,
      };
    }
  }

  // Calculate overall risk score
  private static calculateOverallRiskScore(
    securityEvents: any[],
    auditLogs: any[],
  ): number {
    let riskScore = 0;

    // Factor in security events
    securityEvents.forEach((event) => {
      switch (event.severity) {
        case "critical":
          riskScore += 25;
          break;
        case "high":
          riskScore += 15;
          break;
        case "medium":
          riskScore += 8;
          break;
        case "low":
          riskScore += 3;
          break;
      }
    });

    // Factor in failed operations
    const failedOperations = auditLogs.filter((log) => !log.success);
    riskScore += Math.min(failedOperations.length * 2, 20);

    // Factor in high-risk operations
    const highRiskOperations = auditLogs.filter(
      (log) => (log.riskScore || 0) > 70,
    );
    riskScore += Math.min(highRiskOperations.length * 3, 30);

    return Math.min(riskScore, 100);
  }

  // Generate security alerts
  private static async generateSecurityAlerts(
    securityEvents: any[],
    auditLogs: any[],
  ): Promise<any[]> {
    const alerts: any[] = [];

    // Critical security events
    const criticalEvents = securityEvents.filter(
      (event) => event.severity === "critical" && event.status !== "resolved",
    );

    criticalEvents.forEach((event) => {
      alerts.push({
        id: event.id,
        type: "critical_security_event",
        title: event.title,
        description: event.description,
        severity: "critical",
        timestamp: event.createdAt,
        action: "immediate_attention_required",
      });
    });

    // Multiple failed login attempts
    const failedLogins = auditLogs.filter(
      (log) => log.action === "LOGIN" && !log.success,
    );

    if (failedLogins.length > 10) {
      alerts.push({
        type: "multiple_failed_logins",
        title: "Multiple Failed Login Attempts",
        description: `${failedLogins.length} failed login attempts detected in the last 24 hours`,
        severity: "high",
        timestamp: new Date(),
        action: "review_and_investigate",
      });
    }

    // Unusual data access patterns
    const dataExports = auditLogs.filter((log) => log.action === "DATA_EXPORT");
    if (dataExports.length > 5) {
      alerts.push({
        type: "unusual_data_access",
        title: "Unusual Data Export Activity",
        description: `${dataExports.length} data exports detected in the last 24 hours`,
        severity: "medium",
        timestamp: new Date(),
        action: "monitor_closely",
      });
    }

    return alerts;
  }

  // Generate security recommendations
  private static generateSecurityRecommendations(
    securityEvents: any[],
    auditLogs: any[],
  ): string[] {
    const recommendations: string[] = [];

    // Check for unresolved critical events
    const unresolvedCritical = securityEvents.filter(
      (event) => event.severity === "critical" && event.status !== "resolved",
    );

    if (unresolvedCritical.length > 0) {
      recommendations.push("Immediately address all critical security events");
    }

    // Check for high failure rates
    const totalOperations = auditLogs.length;
    const failedOperations = auditLogs.filter((log) => !log.success).length;
    const failureRate = failedOperations / totalOperations;

    if (failureRate > 0.1) {
      recommendations.push(
        "Investigate high operation failure rate - may indicate system issues or attacks",
      );
    }

    // Check for missing MFA
    const loginEvents = auditLogs.filter(
      (log) => log.action === "LOGIN" && log.success,
    );
    const mfaEvents = auditLogs.filter((log) => log.action === "MFA_VERIFIED");

    if (loginEvents.length > mfaEvents.length * 2) {
      recommendations.push("Enable multi-factor authentication for all users");
    }

    // Check for data access without proper audit trails
    const dataAccess = auditLogs.filter((log) =>
      log.action.startsWith("DATA_"),
    );
    if (dataAccess.length < totalOperations * 0.3) {
      recommendations.push(
        "Improve audit logging coverage for data access operations",
      );
    }

    return recommendations;
  }

  // Detect login anomalies
  private static detectLoginAnomalies(auditLogs: any[]): any[] {
    const anomalies: any[] = [];
    const loginEvents = auditLogs.filter((log) => log.action === "LOGIN");

    // Group by user
    const userLogins: { [userId: string]: any[] } = {};
    loginEvents.forEach((event) => {
      if (event.userId) {
        if (!userLogins[event.userId]) userLogins[event.userId] = [];
        userLogins[event.userId].push(event);
      }
    });

    // Check for unusual login times
    Object.entries(userLogins).forEach(([userId, logins]) => {
      const unusualTimes = logins.filter((login) => {
        const hour = new Date(login.timestamp).getHours();
        return hour < 6 || hour > 22; // Outside normal business hours
      });

      if (unusualTimes.length > 2) {
        anomalies.push({
          type: "unusual_login_time",
          userId,
          description: `${unusualTimes.length} logins outside normal business hours`,
          riskScore: 30,
          evidence: unusualTimes.map((login) => ({
            timestamp: login.timestamp,
            hour: new Date(login.timestamp).getHours(),
          })),
        });
      }
    });

    return anomalies;
  }

  // Detect data access anomalies
  private static detectDataAccessAnomalies(auditLogs: any[]): any[] {
    const anomalies: any[] = [];
    const dataEvents = auditLogs.filter((log) =>
      log.action.startsWith("DATA_"),
    );

    // Group by user
    const userDataAccess: { [userId: string]: any[] } = {};
    dataEvents.forEach((event) => {
      if (event.userId) {
        if (!userDataAccess[event.userId]) userDataAccess[event.userId] = [];
        userDataAccess[event.userId].push(event);
      }
    });

    // Check for unusual data access volumes
    Object.entries(userDataAccess).forEach(([userId, accesses]) => {
      const avgAccess = accesses.length / 24; // Per hour average

      if (avgAccess > 50) {
        // More than 50 data operations per hour
        anomalies.push({
          type: "high_volume_data_access",
          userId,
          description: `Unusually high data access volume: ${accesses.length} operations`,
          riskScore: 40,
          evidence: {
            totalAccess: accesses.length,
            averagePerHour: avgAccess,
          },
        });
      }
    });

    return anomalies;
  }

  // Detect time-based anomalies
  private static detectTimeAnomalies(auditLogs: any[]): any[] {
    const anomalies: any[] = [];

    // Group events by hour
    const hourlyActivity: { [hour: number]: number } = {};
    auditLogs.forEach((log) => {
      const hour = new Date(log.timestamp).getHours();
      hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
    });

    // Find unusual activity spikes
    const avgActivity =
      Object.values(hourlyActivity).reduce((sum, count) => sum + count, 0) / 24;

    Object.entries(hourlyActivity).forEach(([hour, count]) => {
      if (count > avgActivity * 3) {
        // 3x average activity
        anomalies.push({
          type: "unusual_activity_spike",
          description: `Unusual activity spike at hour ${hour}: ${count} events`,
          riskScore: 25,
          evidence: {
            hour: parseInt(hour),
            eventCount: count,
            averageActivity: avgActivity,
          },
        });
      }
    });

    return anomalies;
  }

  // Detect location-based anomalies
  private static detectLocationAnomalies(auditLogs: any[]): any[] {
    const anomalies: any[] = [];

    // Group by user and IP
    const userIPs: { [userId: string]: Set<string> } = {};
    auditLogs.forEach((log) => {
      if (log.userId && log.ipAddress) {
        if (!userIPs[log.userId]) userIPs[log.userId] = new Set();
        userIPs[log.userId].add(log.ipAddress);
      }
    });

    // Check for users with many different IPs
    Object.entries(userIPs).forEach(([userId, ips]) => {
      if (ips.size > 5) {
        // More than 5 different IPs
        anomalies.push({
          type: "multiple_ip_addresses",
          userId,
          description: `User accessed from ${ips.size} different IP addresses`,
          riskScore: 35,
          evidence: {
            ipCount: ips.size,
            ips: Array.from(ips),
          },
        });
      }
    });

    return anomalies;
  }

  // Calculate anomaly risk level
  private static calculateAnomalyRiskLevel(
    anomalies: any[],
  ): "low" | "medium" | "high" | "critical" {
    const totalRiskScore = anomalies.reduce(
      (sum, anomaly) => sum + anomaly.riskScore,
      0,
    );

    if (totalRiskScore > 80) return "critical";
    if (totalRiskScore > 60) return "high";
    if (totalRiskScore > 30) return "medium";
    return "low";
  }

  // Calculate anomaly confidence
  private static calculateAnomalyConfidence(
    anomalies: any[],
    totalEvents: number,
  ): number {
    if (totalEvents < 10) return 0.3; // Low confidence with few events
    if (anomalies.length === 0) return 0.9; // High confidence no anomalies

    const evidenceStrength =
      anomalies.reduce((sum, anomaly) => {
        return sum + (anomaly.evidence ? 1 : 0.5);
      }, 0) / anomalies.length;

    return Math.min(evidenceStrength * 0.8, 0.95);
  }

  // Check for weak passwords (simulated)
  private static async checkWeakPasswords(
    _organizationId?: string,
  ): Promise<any | null> {
    // In a real implementation, this would check password strength
    // For now, we'll simulate finding some weak passwords
    const weakPasswordCount = Math.floor(Math.random() * 5);

    if (weakPasswordCount > 0) {
      return {
        type: "weak_passwords",
        severity: "medium",
        title: "Weak Passwords Detected",
        description: `${weakPasswordCount} users have weak passwords`,
        riskScore: weakPasswordCount * 10,
        affectedUsers: weakPasswordCount,
        recommendation:
          "Enforce stronger password policies and require password updates",
      };
    }

    return null;
  }

  // Check MFA status
  private static async checkMFAStatus(
    _organizationId?: string,
  ): Promise<any | null> {
    try {
      const totalUsers = await prisma.user.count();
      const mfaEnabledUsers = await prisma.mFADevice.count({
        where: {
          verified: true,
        },
      });

      const mfaPercentage =
        totalUsers > 0 ? (mfaEnabledUsers / totalUsers) * 100 : 100;

      if (mfaPercentage < 80) {
        return {
          type: "insufficient_mfa",
          severity: "high",
          title: "Insufficient MFA Coverage",
          description: `Only ${mfaPercentage.toFixed(1)}% of users have MFA enabled`,
          riskScore: 50 - mfaPercentage / 2,
          mfaPercentage,
          recommendation:
            "Require MFA for all users, especially those with elevated privileges",
        };
      }

      return null;
    } catch (error) {
      console.error("Error checking MFA status:", error);
      return null;
    }
  }

  // Check for excessive permissions
  private static async checkExcessivePermissions(
    _organizationId?: string,
  ): Promise<any | null> {
    try {
      // Check for users with too many roles
      const usersWithManyRoles = await prisma.userSecurityRole.groupBy({
        by: ["userId"],
        _count: {
          roleId: true,
        },
        having: {
          roleId: {
            _count: {
              gt: 3, // More than 3 roles might be excessive
            },
          },
        },
      });

      if (usersWithManyRoles.length > 0) {
        return {
          type: "excessive_permissions",
          severity: "medium",
          title: "Users with Excessive Permissions",
          description: `${usersWithManyRoles.length} users have more than 3 security roles`,
          riskScore: usersWithManyRoles.length * 5,
          affectedUsers: usersWithManyRoles.length,
          recommendation:
            "Review and reduce user permissions following principle of least privilege",
        };
      }

      return null;
    } catch (error) {
      console.error("Error checking excessive permissions:", error);
      return null;
    }
  }

  // Check for outdated sessions
  private static async checkOutdatedSessions(
    _organizationId?: string,
  ): Promise<any | null> {
    // This would check for sessions that haven't been used recently
    // For now, we'll simulate finding some outdated sessions
    const outdatedSessionCount = Math.floor(Math.random() * 10);

    if (outdatedSessionCount > 5) {
      return {
        type: "outdated_sessions",
        severity: "low",
        title: "Outdated Sessions Detected",
        description: `${outdatedSessionCount} sessions haven't been used in over 30 days`,
        riskScore: outdatedSessionCount * 2,
        outdatedSessions: outdatedSessionCount,
        recommendation:
          "Implement automatic session cleanup and shorter session timeouts",
      };
    }

    return null;
  }

  // Check for unencrypted sensitive data
  private static async checkUnencryptedData(
    organizationId?: string,
  ): Promise<any | null> {
    try {
      // Check if there are encrypted fields configured
      const encryptedFieldCount = await prisma.encryptedField.count({
        where: organizationId
          ? {
              // This would need to be implemented based on your schema
            }
          : {},
      });

      // If no encrypted fields are configured, it might be a vulnerability
      if (encryptedFieldCount === 0) {
        return {
          type: "unencrypted_sensitive_data",
          severity: "high",
          title: "No Field-Level Encryption Configured",
          description: "Sensitive data fields are not encrypted at rest",
          riskScore: 40,
          recommendation:
            "Implement field-level encryption for sensitive data like PII and financial information",
        };
      }

      return null;
    } catch (error) {
      console.error("Error checking unencrypted data:", error);
      return null;
    }
  }

  // Generate vulnerability recommendations
  private static generateVulnerabilityRecommendations(
    vulnerabilities: any[],
  ): string[] {
    const recommendations: string[] = [];

    vulnerabilities.forEach((vuln) => {
      if (vuln.recommendation) {
        recommendations.push(vuln.recommendation);
      }
    });

    // Add general recommendations
    if (vulnerabilities.length > 0) {
      recommendations.push("Conduct regular security assessments");
      recommendations.push(
        "Implement security awareness training for all users",
      );
      recommendations.push("Keep all systems and dependencies up to date");
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }

  // Check if IP is known malicious
  private static isKnownMaliciousIP(ip: string): boolean {
    // In production, integrate with threat intelligence feeds
    const knownMaliciousIPs = ["192.168.1.100", "10.0.0.100", "172.16.0.100"];

    return knownMaliciousIPs.includes(ip);
  }

  // Check if user agent is suspicious
  private static isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i,
    ];

    return suspiciousPatterns.some((pattern) => pattern.test(userAgent));
  }

  // Check for brute force patterns
  private static async checkBruteForcePattern(
    userId?: string,
    ip?: string,
  ): Promise<{ detected: boolean; riskScore: number }> {
    try {
      const last15Minutes = new Date(Date.now() - 15 * 60 * 1000);

      // Check failed login attempts
      const failedAttempts = await SecurityAuditService.getAuditLogs({
        userId,
        action: "LOGIN",
        success: false,
        startDate: last15Minutes,
        limit: 100,
      });

      // Check if there are too many failed attempts
      if (failedAttempts.length > 5) {
        return {
          detected: true,
          riskScore: Math.min(failedAttempts.length * 10, 80),
        };
      }

      // Check for attempts from same IP
      if (ip) {
        const ipFailedAttempts = failedAttempts.filter(
          (attempt) => attempt.ipAddress === ip,
        );
        if (ipFailedAttempts.length > 3) {
          return {
            detected: true,
            riskScore: Math.min(ipFailedAttempts.length * 15, 80),
          };
        }
      }

      return { detected: false, riskScore: 0 };
    } catch (error) {
      console.error("Error checking brute force pattern:", error);
      return { detected: false, riskScore: 0 };
    }
  }

  // Check if action indicates privilege escalation attempt
  private static isPrivilegeEscalationAttempt(
    action?: string,
    resource?: string,
  ): boolean {
    if (!action || !resource) return false;

    const privilegedActions = [
      "ROLE_ASSIGN",
      "PERMISSION_GRANT",
      "USER_PROMOTE",
    ];
    const sensitiveResources = [
      "SecurityRole",
      "SecurityPermission",
      "Organization",
    ];

    return (
      privilegedActions.includes(action) ||
      sensitiveResources.includes(resource)
    );
  }

  // Check for data exfiltration patterns
  private static async checkDataExfiltrationPattern(
    userId?: string,
    metadata?: any,
  ): Promise<{ detected: boolean; riskScore: number }> {
    try {
      if (!userId) return { detected: false, riskScore: 0 };

      const lastHour = new Date(Date.now() - 60 * 60 * 1000);

      // Check for multiple data exports
      const dataExports = await SecurityAuditService.getAuditLogs({
        userId,
        action: "DATA_EXPORT",
        startDate: lastHour,
        limit: 100,
      });

      // Check for large data reads
      const dataReads = await SecurityAuditService.getAuditLogs({
        userId,
        action: "DATA_READ",
        startDate: lastHour,
        limit: 1000,
      });

      let riskScore = 0;
      let detected = false;

      // Multiple exports in short time
      if (dataExports.length > 3) {
        riskScore += dataExports.length * 15;
        detected = true;
      }

      // High volume of data reads
      if (dataReads.length > 100) {
        riskScore += Math.min(dataReads.length / 10, 40);
        detected = true;
      }

      // Large export size (if available in metadata)
      if (metadata?.exportSize && metadata.exportSize > 1000000) {
        // 1MB
        riskScore += 30;
        detected = true;
      }

      return { detected, riskScore: Math.min(riskScore, 80) };
    } catch (error) {
      console.error("Error checking data exfiltration pattern:", error);
      return { detected: false, riskScore: 0 };
    }
  }
}
