import { NextRequest } from "next/server";
import {
  SecurityEvent,
  SecurityEventType,
  SecuritySeverity,
  SecurityMetrics,
} from "@/lib/types/security";

interface SecurityEventStore {
  [id: string]: SecurityEvent;
}

interface SecurityStats {
  totalEvents: number;
  eventsByType: Record<SecurityEventType, number>;
  eventsBySeverity: Record<SecuritySeverity, number>;
  recentEvents: SecurityEvent[];
  topIPs: Array<{ ip: string; count: number }>;
  topEndpoints: Array<{ endpoint: string; count: number }>;
}

class SecurityMonitor {
  private events: SecurityEventStore = {};
  private cleanupInterval: NodeJS.Timeout;
  private retentionDays: number = 30;

  constructor(retentionDays: number = 30) {
    this.retentionDays = retentionDays;

    // Clean up old events every hour
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      60 * 60 * 1000,
    );
  }

  private cleanup() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

    Object.keys(this.events).forEach((id) => {
      if (this.events[id].timestamp < cutoffDate) {
        delete this.events[id];
      }
    });
  }

  private generateEventId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async logSecurityEvent(
    type: SecurityEventType,
    severity: SecuritySeverity,
    req: NextRequest,
    details: Record<string, any> = {},
    userId?: string,
    organizationId?: string,
  ): Promise<SecurityEvent> {
    const event: SecurityEvent = {
      id: this.generateEventId(),
      type,
      severity,
      timestamp: new Date(),
      userId,
      organizationId,
      ipAddress: this.extractIPAddress(req),
      userAgent: req.headers.get("user-agent") || "unknown",
      endpoint: req.nextUrl.pathname,
      details,
      resolved: false,
    };

    this.events[event.id] = event;

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.warn(`[SECURITY] ${severity} - ${type}:`, {
        ip: event.ipAddress,
        endpoint: event.endpoint,
        details: event.details,
      });
    }

    return event;
  }

  private extractIPAddress(req: NextRequest): string {
    const forwarded = req.headers.get("x-forwarded-for");
    const realIP = req.headers.get("x-real-ip");
    return forwarded?.split(",")[0] || realIP || req.ip || "unknown";
  }

  async getSecurityEvents(
    filters: {
      type?: SecurityEventType;
      severity?: SecuritySeverity;
      userId?: string;
      organizationId?: string;
      ipAddress?: string;
      startDate?: Date;
      endDate?: Date;
      resolved?: boolean;
    } = {},
    limit: number = 100,
    offset: number = 0,
  ): Promise<SecurityEvent[]> {
    let events = Object.values(this.events);

    // Apply filters
    if (filters.type) {
      events = events.filter((e) => e.type === filters.type);
    }
    if (filters.severity) {
      events = events.filter((e) => e.severity === filters.severity);
    }
    if (filters.userId) {
      events = events.filter((e) => e.userId === filters.userId);
    }
    if (filters.organizationId) {
      events = events.filter(
        (e) => e.organizationId === filters.organizationId,
      );
    }
    if (filters.ipAddress) {
      events = events.filter((e) => e.ipAddress === filters.ipAddress);
    }
    if (filters.startDate) {
      events = events.filter((e) => e.timestamp >= filters.startDate!);
    }
    if (filters.endDate) {
      events = events.filter((e) => e.timestamp <= filters.endDate!);
    }
    if (filters.resolved !== undefined) {
      events = events.filter((e) => e.resolved === filters.resolved);
    }

    // Sort by timestamp (newest first)
    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    return events.slice(offset, offset + limit);
  }

  async getSecurityStats(
    timeRange: { start: Date; end: Date } = {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      end: new Date(),
    },
  ): Promise<SecurityStats> {
    const events = Object.values(this.events).filter(
      (e) => e.timestamp >= timeRange.start && e.timestamp <= timeRange.end,
    );

    // Count events by type
    const eventsByType = {} as Record<SecurityEventType, number>;
    Object.values(SecurityEventType).forEach((type) => {
      eventsByType[type] = 0;
    });

    // Count events by severity
    const eventsBySeverity = {} as Record<SecuritySeverity, number>;
    Object.values(SecuritySeverity).forEach((severity) => {
      eventsBySeverity[severity] = 0;
    });

    // Count IPs and endpoints
    const ipCounts: Record<string, number> = {};
    const endpointCounts: Record<string, number> = {};

    events.forEach((event) => {
      eventsByType[event.type]++;
      eventsBySeverity[event.severity]++;

      ipCounts[event.ipAddress] = (ipCounts[event.ipAddress] || 0) + 1;
      endpointCounts[event.endpoint] =
        (endpointCounts[event.endpoint] || 0) + 1;
    });

    // Get top IPs and endpoints
    const topIPs = Object.entries(ipCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }));

    const topEndpoints = Object.entries(endpointCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, count }));

    // Get recent events (last 10)
    const recentEvents = events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    return {
      totalEvents: events.length,
      eventsByType,
      eventsBySeverity,
      recentEvents,
      topIPs,
      topEndpoints,
    };
  }

  async resolveSecurityEvent(eventId: string): Promise<boolean> {
    if (this.events[eventId]) {
      this.events[eventId].resolved = true;
      return true;
    }
    return false;
  }

  async getSecurityMetrics(timeRange: {
    start: Date;
    end: Date;
  }): Promise<SecurityMetrics> {
    const events = Object.values(this.events).filter(
      (e) => e.timestamp >= timeRange.start && e.timestamp <= timeRange.end,
    );

    const totalRequests = events.length;
    const blockedRequests = events.filter(
      (e) =>
        e.type === SecurityEventType.RATE_LIMIT_EXCEEDED ||
        e.type === SecurityEventType.BRUTE_FORCE_ATTEMPT ||
        e.type === SecurityEventType.UNAUTHORIZED_ACCESS,
    ).length;

    const rateLimitViolations = events.filter(
      (e) => e.type === SecurityEventType.RATE_LIMIT_EXCEEDED,
    ).length;

    const bruteForceAttempts = events.filter(
      (e) => e.type === SecurityEventType.BRUTE_FORCE_ATTEMPT,
    ).length;

    const suspiciousActivity = events.filter(
      (e) =>
        e.type === SecurityEventType.SUSPICIOUS_REQUEST ||
        e.type === SecurityEventType.CORS_VIOLATION ||
        e.type === SecurityEventType.INVALID_REQUEST,
    ).length;

    // Count by IP
    const ipCounts: Record<string, number> = {};
    const endpointCounts: Record<string, number> = {};

    events.forEach((event) => {
      ipCounts[event.ipAddress] = (ipCounts[event.ipAddress] || 0) + 1;
      endpointCounts[event.endpoint] =
        (endpointCounts[event.endpoint] || 0) + 1;
    });

    const topBlockedIPs = Object.entries(ipCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }));

    const topTargetedEndpoints = Object.entries(endpointCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, count }));

    return {
      totalRequests,
      blockedRequests,
      rateLimitViolations,
      bruteForceAttempts,
      suspiciousActivity,
      topBlockedIPs,
      topTargetedEndpoints,
      timeRange,
    };
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Singleton instance
const securityMonitor = new SecurityMonitor();

export { securityMonitor };

// Helper functions for common security events
export async function logRateLimitExceeded(
  req: NextRequest,
  tier: string,
  remaining: number,
  resetTime: number,
  userId?: string,
  organizationId?: string,
): Promise<SecurityEvent> {
  return securityMonitor.logSecurityEvent(
    SecurityEventType.RATE_LIMIT_EXCEEDED,
    SecuritySeverity.MEDIUM,
    req,
    { tier, remaining, resetTime },
    userId,
    organizationId,
  );
}

export async function logBruteForceAttempt(
  req: NextRequest,
  attemptType: string,
  attemptCount: number,
  lockoutDuration?: number,
  userId?: string,
  organizationId?: string,
): Promise<SecurityEvent> {
  return securityMonitor.logSecurityEvent(
    SecurityEventType.BRUTE_FORCE_ATTEMPT,
    SecuritySeverity.HIGH,
    req,
    { attemptType, attemptCount, lockoutDuration },
    userId,
    organizationId,
  );
}

export async function logSuspiciousRequest(
  req: NextRequest,
  reason: string,
  patterns: string[],
  userId?: string,
  organizationId?: string,
): Promise<SecurityEvent> {
  return securityMonitor.logSecurityEvent(
    SecurityEventType.SUSPICIOUS_REQUEST,
    SecuritySeverity.MEDIUM,
    req,
    { reason, patterns },
    userId,
    organizationId,
  );
}

export async function logUnauthorizedAccess(
  req: NextRequest,
  resource: string,
  requiredPermission: string,
  userId?: string,
  organizationId?: string,
): Promise<SecurityEvent> {
  return securityMonitor.logSecurityEvent(
    SecurityEventType.UNAUTHORIZED_ACCESS,
    SecuritySeverity.HIGH,
    req,
    { resource, requiredPermission },
    userId,
    organizationId,
  );
}

export async function logInvalidRequest(
  req: NextRequest,
  validationErrors: string[],
  userId?: string,
  organizationId?: string,
): Promise<SecurityEvent> {
  return securityMonitor.logSecurityEvent(
    SecurityEventType.INVALID_REQUEST,
    SecuritySeverity.LOW,
    req,
    { validationErrors },
    userId,
    organizationId,
  );
}

export async function logCorsViolation(
  req: NextRequest,
  origin: string,
  method: string,
  userId?: string,
  organizationId?: string,
): Promise<SecurityEvent> {
  return securityMonitor.logSecurityEvent(
    SecurityEventType.CORS_VIOLATION,
    SecuritySeverity.MEDIUM,
    req,
    { origin, method },
    userId,
    organizationId,
  );
}
