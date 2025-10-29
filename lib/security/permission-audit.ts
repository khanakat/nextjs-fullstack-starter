import { db } from "@/lib/db";
import { getMetricsCollector } from "@/lib/monitoring/metrics-collector";
import { UserRole, hasPermission, Resource, Action } from "@/lib/permissions";

export interface PermissionAuditLog {
  id: string;
  userId: string;
  userEmail: string;
  userRole: UserRole;
  resource: Resource;
  action: Action;
  granted: boolean;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  organizationId?: string;
  resourceId?: string;
  timestamp: Date;
  sessionId?: string;
  riskLevel: "low" | "medium" | "high" | "critical";
}

export interface PermissionViolation {
  id: string;
  userId: string;
  userEmail: string;
  attemptedResource: Resource;
  attemptedAction: Action;
  userRole: UserRole;
  violationType:
    | "unauthorized_access"
    | "privilege_escalation"
    | "suspicious_pattern"
    | "role_mismatch";
  severity: "low" | "medium" | "high" | "critical";
  details: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface PermissionAnalytics {
  totalChecks: number;
  grantedCount: number;
  deniedCount: number;
  violationCount: number;
  topResources: Array<{ resource: Resource; count: number }>;
  topActions: Array<{ action: Action; count: number }>;
  riskDistribution: Record<string, number>;
  userActivity: Array<{
    userId: string;
    userEmail: string;
    checks: number;
    violations: number;
  }>;
  timeDistribution: Array<{ hour: number; checks: number; violations: number }>;
}

export class PermissionAuditService {
  private metricsCollector = getMetricsCollector();
  private suspiciousPatterns: Map<string, number> = new Map();
  private readonly SUSPICIOUS_THRESHOLD = 10; // Number of denied attempts before flagging
  private readonly TIME_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

  /**
   * Log a permission check
   */
  async logPermissionCheck(
    userId: string,
    userEmail: string,
    userRole: UserRole,
    resource: Resource,
    action: Action,
    granted: boolean,
    context: {
      ipAddress?: string;
      userAgent?: string;
      organizationId?: string;
      resourceId?: string;
      sessionId?: string;
      reason?: string;
    } = {},
  ): Promise<void> {
    try {
      const riskLevel = this.calculateRiskLevel(
        resource,
        action,
        granted,
        userRole,
      );

      // Create audit log entry
      // Store in database (if using a database for audit logs)
      // const auditLog: Omit<PermissionAuditLog, "id"> = {
      //   userId,
      //   userEmail,
      //   userRole,
      //   resource,
      //   action,
      //   granted,
      //   reason: context.reason,
      //   ipAddress: context.ipAddress,
      //   userAgent: context.userAgent,
      //   organizationId: context.organizationId,
      //   resourceId: context.resourceId,
      //   sessionId: context.sessionId,
      //   timestamp: new Date(),
      //   riskLevel,
      // };
      // await db.permissionAuditLog.create({ data: auditLog });

      // Record metrics
      this.metricsCollector.recordCounter("permission_checks_total", 1, {
        resource,
        action,
        granted: granted.toString(),
        role: userRole,
        risk_level: riskLevel,
      });

      // Check for suspicious patterns if denied
      if (!granted) {
        await this.checkSuspiciousActivity(
          userId,
          userEmail,
          resource,
          action,
          userRole,
          context,
        );
      }

      // Log high-risk activities
      if (riskLevel === "high" || riskLevel === "critical") {
        console.warn(
          `High-risk permission check: ${userEmail} (${userRole}) attempted ${action} on ${resource} - ${granted ? "GRANTED" : "DENIED"}`,
        );
      }
    } catch (error) {
      console.error("Error logging permission check:", error);
    }
  }

  /**
   * Check for suspicious activity patterns
   */
  private async checkSuspiciousActivity(
    userId: string,
    userEmail: string,
    resource: Resource,
    action: Action,
    userRole: UserRole,
    context: any,
  ): Promise<void> {
    const key = `${userId}:${resource}:${action}`;
    const currentCount = this.suspiciousPatterns.get(key) || 0;
    const newCount = currentCount + 1;

    this.suspiciousPatterns.set(key, newCount);

    // Clean up old entries periodically
    setTimeout(() => {
      this.suspiciousPatterns.delete(key);
    }, this.TIME_WINDOW);

    // Flag suspicious activity
    if (newCount >= this.SUSPICIOUS_THRESHOLD) {
      await this.createViolation({
        userId,
        userEmail,
        attemptedResource: resource,
        attemptedAction: action,
        userRole,
        violationType: "suspicious_pattern",
        severity: "high",
        details: {
          attemptCount: newCount,
          timeWindow: this.TIME_WINDOW,
          resource,
          action,
          context,
        },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });
    }
  }

  /**
   * Calculate risk level for a permission check
   */
  private calculateRiskLevel(
    resource: Resource,
    action: Action,
    granted: boolean,
    userRole: UserRole,
  ): "low" | "medium" | "high" | "critical" {
    // Critical risk scenarios
    if (action === "admin" && !granted) return "critical";
    if (resource === "users" && action === "delete" && !granted)
      return "critical";
    if (resource === "organizations" && action === "delete" && !granted)
      return "critical";

    // High risk scenarios
    if (action === "admin") return "high";
    if (resource === "audit" && !granted) return "high";
    if (resource === "settings" && action === "update" && !granted)
      return "high";
    if (
      userRole === "VIEWER" &&
      ["create", "update", "delete"].includes(action) &&
      !granted
    )
      return "high";

    // Medium risk scenarios
    if (action === "delete" && !granted) return "medium";
    if (resource === "users" && !granted) return "medium";
    if (userRole === "MEMBER" && action === "delete" && !granted)
      return "medium";

    // Low risk (default)
    return "low";
  }

  /**
   * Create a permission violation record
   */
  async createViolation(
    violation: Omit<
      PermissionViolation,
      "id" | "timestamp" | "resolved" | "resolvedAt" | "resolvedBy"
    >,
  ): Promise<void> {
    try {
      // Store in database
      // const violationRecord: Omit<PermissionViolation, "id"> = {
      //   ...violation,
      //   timestamp: new Date(),
      //   resolved: false,
      // };
      // await db.permissionViolation.create({ data: violationRecord });

      // Record metrics
      this.metricsCollector.recordCounter("permission_violations_total", 1, {
        type: violation.violationType,
        severity: violation.severity,
        resource: violation.attemptedResource,
        action: violation.attemptedAction,
        role: violation.userRole,
      });

      // Log critical violations
      if (violation.severity === "critical") {
        console.error(
          `CRITICAL PERMISSION VIOLATION: ${violation.userEmail} (${violation.userRole}) - ${violation.violationType}`,
        );
      }
    } catch (error) {
      console.error("Error creating permission violation:", error);
    }
  }

  /**
   * Get permission analytics for a time period
   */
  async getPermissionAnalytics(
    _startDate: Date,
    _endDate: Date,
    _organizationId?: string,
  ): Promise<PermissionAnalytics> {
    try {
      // This would typically query the database
      // For now, we'll return mock data structure

      const analytics: PermissionAnalytics = {
        totalChecks: 0,
        grantedCount: 0,
        deniedCount: 0,
        violationCount: 0,
        topResources: [],
        topActions: [],
        riskDistribution: {
          low: 0,
          medium: 0,
          high: 0,
          critical: 0,
        },
        userActivity: [],
        timeDistribution: [],
      };

      // In a real implementation, this would query the audit logs
      // and aggregate the data

      return analytics;
    } catch (error) {
      console.error("Error getting permission analytics:", error);
      throw error;
    }
  }

  /**
   * Get recent permission violations
   */
  async getViolations(
    _limit: number = 50,
    _organizationId?: string,
  ): Promise<PermissionViolation[]> {
    try {
      // This would query the database for recent violations
      // For now, return empty array
      return [];
    } catch (error) {
      console.error("Error getting recent violations:", error);
      throw error;
    }
  }

  /**
   * Resolve a permission violation
   */
  async resolveViolation(
    _violationId: string,
    _resolvedBy: string,
    _resolution: string,
  ): Promise<boolean> {
    try {
      // Update violation record in database
      // await db.permissionViolation.update({
      //   where: { id: violationId },
      //   data: {
      //     resolved: true,
      //     resolvedAt: new Date(),
      //     resolvedBy,
      //     resolution
      //   }
      // });

      return true;
    } catch (error) {
      console.error("Error resolving violation:", error);
      return false;
    }
  }

  /**
   * Audit user permissions comprehensively
   */
  async auditUserPermissions(userId: string): Promise<{
    user: {
      id: string;
      email: string;
      role: UserRole;
    };
    permissions: Array<{
      resource: Resource;
      actions: Action[];
      granted: Action[];
      denied: Action[];
    }>;
    recentActivity: PermissionAuditLog[];
    violations: PermissionViolation[];
    riskScore: number;
  }> {
    try {
      // Get user information
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          // role: true // Assuming role is stored in user table
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Mock user role for now
      const userRole: UserRole = "MEMBER";

      // Audit all resources and actions
      const resources: Resource[] = [
        "audit",
        "reports",
        "templates",
        "users",
        "organizations",
        "settings",
        "posts",
        "subscription",
      ];
      const actions: Action[] = ["create", "read", "update", "delete", "admin"];

      const permissions = resources.map((resource) => {
        const granted: Action[] = [];
        const denied: Action[] = [];

        actions.forEach((action) => {
          if (
            hasPermission(
              { id: userId, email: user.email, role: userRole },
              action,
              resource,
            )
          ) {
            granted.push(action);
          } else {
            denied.push(action);
          }
        });

        return {
          resource,
          actions,
          granted,
          denied,
        };
      });

      // Calculate risk score based on permissions and violations
      const riskScore = this.calculateUserRiskScore(permissions, []);

      return {
        user: {
          id: user.id,
          email: user.email,
          role: userRole,
        },
        permissions,
        recentActivity: [], // Would query audit logs
        violations: [], // Would query violations
        riskScore,
      };
    } catch (error) {
      console.error("Error auditing user permissions:", error);
      throw error;
    }
  }

  /**
   * Calculate user risk score
   */
  private calculateUserRiskScore(
    permissions: Array<{
      resource: Resource;
      granted: Action[];
      denied: Action[];
    }>,
    violations: PermissionViolation[],
  ): number {
    let score = 0;

    // Base score from permissions
    permissions.forEach((perm) => {
      if (perm.granted.includes("admin")) score += 30;
      if (perm.granted.includes("delete")) score += 20;
      if (perm.granted.includes("update")) score += 10;
      if (perm.granted.includes("create")) score += 5;
    });

    // Add score from violations
    violations.forEach((violation) => {
      switch (violation.severity) {
        case "critical":
          score += 50;
          break;
        case "high":
          score += 30;
          break;
        case "medium":
          score += 15;
          break;
        case "low":
          score += 5;
          break;
      }
    });

    // Normalize to 0-100 scale
    return Math.min(100, score);
  }

  /**
   * Generate permission compliance report
   */
  async generateComplianceReport(_organizationId?: string): Promise<{
    summary: {
      totalUsers: number;
      totalRoles: number;
      totalPermissions: number;
      complianceScore: number;
    };
    roleDistribution: Record<UserRole, number>;
    permissionGaps: Array<{
      userId: string;
      userEmail: string;
      missingPermissions: string[];
      excessPermissions: string[];
    }>;
    recommendations: string[];
  }> {
    try {
      // This would generate a comprehensive compliance report
      // For now, return a mock structure

      return {
        summary: {
          totalUsers: 0,
          totalRoles: 0,
          totalPermissions: 0,
          complianceScore: 85,
        },
        roleDistribution: {
          ADMIN: 0,
          OWNER: 0,
          MANAGER: 0,
          MEMBER: 0,
          VIEWER: 0,
        },
        permissionGaps: [],
        recommendations: [
          "Review admin permissions regularly",
          "Implement principle of least privilege",
          "Set up automated permission audits",
          "Monitor for privilege escalation attempts",
        ],
      };
    } catch (error) {
      console.error("Error generating compliance report:", error);
      throw error;
    }
  }
}

// Singleton instance
let permissionAuditService: PermissionAuditService;

export function getPermissionAuditService(): PermissionAuditService {
  if (!permissionAuditService) {
    permissionAuditService = new PermissionAuditService();
  }
  return permissionAuditService;
}

// Middleware to automatically audit permission checks
export function createPermissionAuditMiddleware() {
  const auditService = getPermissionAuditService();

  return async (
    userId: string,
    userEmail: string,
    userRole: UserRole,
    resource: Resource,
    action: Action,
    granted: boolean,
    context: any = {},
  ) => {
    await auditService.logPermissionCheck(
      userId,
      userEmail,
      userRole,
      resource,
      action,
      granted,
      context,
    );
  };
}

export default PermissionAuditService;
