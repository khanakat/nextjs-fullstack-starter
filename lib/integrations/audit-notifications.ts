/**
 * Audit System Integration with Notifications
 *
 * This module integrates the audit logging system with the real-time notification system
 * to provide live updates for critical security events and compliance monitoring.
 */

import {
  AuditLogSeverity,
  AuditLogCategory,
  AuditLogAction,
} from "@/lib/types/audit";
import { NotificationService } from "@/lib/notifications";

// ============================================================================
// TYPES
// ============================================================================

interface AuditNotificationConfig {
  enabled: boolean;
  severityThreshold: AuditLogSeverity;
  categories: AuditLogCategory[];
  actions: AuditLogAction[];
  recipients: {
    admins: boolean;
    owners: boolean;
    securityTeam: boolean;
    organizationMembers: boolean;
  };
  channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
  };
}

interface AuditNotificationContext {
  auditLogId: string;
  userId?: string;
  organizationId?: string;
  action: AuditLogAction;
  resource: string;
  severity: AuditLogSeverity;
  category: AuditLogCategory;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: AuditNotificationConfig = {
  enabled: true,
  severityThreshold: AuditLogSeverity.MEDIUM,
  categories: [
    AuditLogCategory.SECURITY,
    AuditLogCategory.AUTHENTICATION,
    AuditLogCategory.AUTHORIZATION,
    AuditLogCategory.DATA,
    AuditLogCategory.SYSTEM,
    AuditLogCategory.COMPLIANCE,
  ],
  actions: [
    AuditLogAction.LOGIN,
    AuditLogAction.UNAUTHORIZED_ACCESS,
    AuditLogAction.SECURITY_ALERT,
    AuditLogAction.EXPORT,
    AuditLogAction.SYSTEM_START,
    AuditLogAction.SYSTEM_STOP,
  ],
  recipients: {
    admins: true,
    owners: true,
    securityTeam: true,
    organizationMembers: false,
  },
  channels: {
    inApp: true,
    email: true,
    push: false,
  },
};

// ============================================================================
// AUDIT NOTIFICATION SERVICE
// ============================================================================

export class AuditNotificationService {
  private static config: AuditNotificationConfig = DEFAULT_CONFIG;

  /**
   * Update notification configuration
   */
  static updateConfig(config: Partial<AuditNotificationConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  static getConfig(): AuditNotificationConfig {
    return { ...this.config };
  }

  /**
   * Send audit notification based on audit log event
   */
  static async sendAuditNotification(context: AuditNotificationContext) {
    if (!this.config.enabled) return;

    // Check if notification should be sent based on configuration
    if (!this.shouldSendNotification(context)) return;

    try {
      const notification = this.createNotificationFromAudit(context);
      const recipients = await this.getRecipients(context);

      // Send notifications to all recipients
      for (const recipient of recipients) {
        await NotificationService.notify(recipient.userId, {
          ...notification,
        });
      }

      // Send system-wide notification for critical events
      if (context.severity === AuditLogSeverity.CRITICAL) {
        await NotificationService.broadcast({
          title: `🚨 Critical Security Event`,
          message: `${context.action} detected in ${context.resource}`,
          type: "error",
          priority: "urgent",
          channels: {
            inApp: true,
            email: true,
            push: true,
            sms: false,
          },
          data: {
            auditLogId: context.auditLogId,
            action: context.action,
            resource: context.resource,
            organizationId: context.organizationId,
          },
        });
      }
    } catch (error) {
      console.error("Failed to send audit notification:", error);
    }
  }

  /**
   * Send compliance alert notification
   */
  static async sendComplianceAlert(
    organizationId: string,
    standard: string,
    violation: string,
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  ) {
    if (!this.config.enabled) return;

    try {
      const notification = {
        title: `📋 Compliance Alert - ${standard}`,
        message: `Compliance violation detected: ${violation}`,
        type: "warning" as const,
        priority:
          severity === "CRITICAL" ? ("urgent" as const) : ("high" as const),
        channels: {
          inApp: true,
          email: severity === "CRITICAL" || severity === "HIGH",
          push: severity === "CRITICAL",
          sms: false,
        },
        data: {
          standard,
          violation,
          severity,
          organizationId,
        },
      };

      const recipients = await this.getComplianceRecipients(organizationId);

      for (const recipient of recipients) {
        await NotificationService.notify(recipient.userId, {
          ...notification,
        });
      }
    } catch (error) {
      console.error("Failed to send compliance alert:", error);
    }
  }

  /**
   * Send security incident notification
   */
  static async sendSecurityIncident(
    organizationId: string,
    incident: {
      type: string;
      description: string;
      severity: AuditLogSeverity;
      affectedUsers?: string[];
      affectedResources?: string[];
      ipAddress?: string;
      userAgent?: string;
    },
  ) {
    if (!this.config.enabled) return;

    try {
      const notification = {
        title: `🛡️ Security Incident - ${incident.type}`,
        message: incident.description,
        type: "error" as const,
        priority:
          incident.severity === AuditLogSeverity.CRITICAL
            ? ("urgent" as const)
            : ("high" as const),
        channels: {
          inApp: true,
          email:
            incident.severity === AuditLogSeverity.CRITICAL ||
            incident.severity === AuditLogSeverity.HIGH,
          push: incident.severity === AuditLogSeverity.CRITICAL,
          sms: false,
        },
        data: {
          incidentType: incident.type,
          severity: incident.severity,
          affectedUsers: incident.affectedUsers,
          affectedResources: incident.affectedResources,
          ipAddress: incident.ipAddress,
          userAgent: incident.userAgent,
          organizationId,
        },
      };

      const recipients = await this.getSecurityRecipients(organizationId);

      for (const recipient of recipients) {
        await NotificationService.notify(recipient.userId, {
          ...notification,
        });
      }

      // Send system-wide alert for critical incidents
      if (incident.severity === AuditLogSeverity.CRITICAL) {
        await NotificationService.broadcast({
          title: `🚨 Critical Security Incident`,
          message: `${incident.type}: ${incident.description}`,
          type: "error" as const,
          priority: "urgent" as const,
          channels: {
            inApp: true,
            email: true,
            push: true,
            sms: false,
          },
          data: {
            incidentType: incident.type,
            severity: incident.severity,
            organizationId,
          },
        });
      }
    } catch (error) {
      console.error("Failed to send security incident notification:", error);
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Check if notification should be sent based on configuration
   */
  private static shouldSendNotification(
    context: AuditNotificationContext,
  ): boolean {
    // Check severity threshold
    const severityLevels = {
      [AuditLogSeverity.INFO]: 1,
      [AuditLogSeverity.LOW]: 2,
      [AuditLogSeverity.MEDIUM]: 3,
      [AuditLogSeverity.HIGH]: 4,
      [AuditLogSeverity.CRITICAL]: 5,
    };

    if (
      severityLevels[context.severity] <
      severityLevels[this.config.severityThreshold]
    ) {
      return false;
    }

    // Check category filter
    if (!this.config.categories.includes(context.category)) {
      return false;
    }

    // Check action filter
    if (
      this.config.actions.length > 0 &&
      !this.config.actions.includes(context.action)
    ) {
      return false;
    }

    return true;
  }

  /**
   * Create notification object from audit context
   */
  private static createNotificationFromAudit(
    context: AuditNotificationContext,
  ) {
    const severityEmojis = {
      [AuditLogSeverity.INFO]: "ℹ️",
      [AuditLogSeverity.LOW]: "⚠️",
      [AuditLogSeverity.MEDIUM]: "🔶",
      [AuditLogSeverity.HIGH]: "🔴",
      [AuditLogSeverity.CRITICAL]: "🚨",
    };

    const categoryLabels = {
      [AuditLogCategory.AUTHENTICATION]: "Authentication",
      [AuditLogCategory.AUTHORIZATION]: "Authorization",
      [AuditLogCategory.DATA]: "Data",
      [AuditLogCategory.SECURITY]: "Security",
      [AuditLogCategory.SYSTEM]: "System",
      [AuditLogCategory.COMPLIANCE]: "Compliance",
      [AuditLogCategory.USER]: "User Management",
      [AuditLogCategory.ORGANIZATION]: "Organization",
      [AuditLogCategory.REPORT]: "Report",
      [AuditLogCategory.GENERAL]: "General",
      [AuditLogCategory.WORKFLOW]: "Workflow",
    };

    const priority: "low" | "medium" | "high" | "urgent" =
      context.severity === AuditLogSeverity.CRITICAL
        ? "urgent"
        : context.severity === AuditLogSeverity.HIGH
          ? "high"
          : context.severity === AuditLogSeverity.MEDIUM
            ? "medium"
            : "low";

    const type: "info" | "success" | "warning" | "error" | "system" =
      context.severity === AuditLogSeverity.CRITICAL ||
      context.severity === AuditLogSeverity.HIGH
        ? "error"
        : context.severity === AuditLogSeverity.MEDIUM
          ? "warning"
          : "info";

    return {
      title: `${severityEmojis[context.severity]} ${categoryLabels[context.category]} Event`,
      message: `${context.action} performed on ${context.resource}`,
      type,
      priority,
      channels: {
        inApp: true,
        email:
          context.severity === AuditLogSeverity.CRITICAL ||
          context.severity === AuditLogSeverity.HIGH,
        push: context.severity === AuditLogSeverity.CRITICAL,
        sms: false,
      },
      data: {
        auditLogId: context.auditLogId,
        action: context.action,
        resource: context.resource,
        severity: context.severity,
        category: context.category,
        organizationId: context.organizationId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        ...context.metadata,
      },
    };
  }

  /**
   * Get recipients for audit notifications
   */
  private static async getRecipients(context: AuditNotificationContext) {
    // This would typically query the database for users based on roles and organization
    // For now, return a mock implementation
    const recipients: { userId: string; role: string }[] = [];

    // Add organization-specific recipients based on configuration
    if (context.organizationId) {
      // Query organization members with appropriate roles
      // This is a placeholder - implement actual database query
      if (this.config.recipients.admins) {
        // Add admin users
      }
      if (this.config.recipients.owners) {
        // Add owner users
      }
      if (this.config.recipients.securityTeam) {
        // Add security team members
      }
      if (this.config.recipients.organizationMembers) {
        // Add all organization members
      }
    }

    return recipients;
  }

  /**
   * Get recipients for compliance alerts
   */
  private static async getComplianceRecipients(
    _organizationId: string,
  ): Promise<{ userId: string; role: string }[]> {
    // Query for compliance officers, admins, and owners
    // This is a placeholder - implement actual database query
    return [];
  }

  /**
   * Get recipients for security incidents
   */
  private static async getSecurityRecipients(
    _organizationId: string,
  ): Promise<{ userId: string; role: string }[]> {
    // Query for security team, admins, and owners
    // This is a placeholder - implement actual database query
    return [];
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Send audit notification for authentication events
 */
export async function notifyAuthEvent(
  action: "LOGIN" | "LOGOUT" | "LOGIN_FAILED" | "REGISTER",
  userId: string,
  organizationId?: string,
  metadata?: Record<string, any>,
) {
  // Map string actions to AuditLogAction enum
  const auditAction =
    action === "LOGIN"
      ? AuditLogAction.LOGIN
      : action === "LOGOUT"
        ? AuditLogAction.LOGOUT
        : action === "LOGIN_FAILED"
          ? AuditLogAction.UNAUTHORIZED_ACCESS
          : AuditLogAction.REGISTER;

  await AuditNotificationService.sendAuditNotification({
    auditLogId: `auth-${Date.now()}`,
    userId,
    organizationId,
    action: auditAction,
    resource: "authentication",
    severity:
      action === "LOGIN_FAILED"
        ? AuditLogSeverity.MEDIUM
        : AuditLogSeverity.INFO,
    category: AuditLogCategory.AUTHENTICATION,
    metadata,
  });
}

/**
 * Send audit notification for security violations
 */
export async function notifySecurityViolation(
  action: string,
  resource: string,
  userId?: string,
  organizationId?: string,
  severity: AuditLogSeverity = AuditLogSeverity.HIGH,
  metadata?: Record<string, any>,
) {
  await AuditNotificationService.sendAuditNotification({
    auditLogId: `security-${Date.now()}`,
    userId,
    organizationId,
    action: action as any,
    resource,
    severity,
    category: AuditLogCategory.SECURITY,
    metadata,
  });
}

/**
 * Send audit notification for data access events
 */
export async function notifyDataAccess(
  action: string,
  resource: string,
  userId: string,
  organizationId?: string,
  metadata?: Record<string, any>,
) {
  await AuditNotificationService.sendAuditNotification({
    auditLogId: `data-${Date.now()}`,
    userId,
    organizationId,
    action: action as any,
    resource,
    severity: AuditLogSeverity.INFO,
    category: AuditLogCategory.DATA,
    metadata,
  });
}
