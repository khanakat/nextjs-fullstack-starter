import { db } from "@/lib/db";
import { AuditService } from "./audit";
import {
  AuditLogSeverity,
  AuditLogCategory,
  AuditLogResource,
  AuditLogStatus,
} from "@/lib/types/audit";

export interface SecurityEvent {
  id: string;
  type:
    | "LOGIN_ATTEMPT"
    | "FAILED_LOGIN"
    | "SUSPICIOUS_ACTIVITY"
    | "RATE_LIMIT_HIT"
    | "UNAUTHORIZED_ACCESS"
    | "SECURITY_ALERT";
  severity: "low" | "medium" | "high" | "critical";
  category: string;
  title: string;
  description?: string;
  userId?: string;
  organizationId?: string;
  ipAddress?: string;
  userAgent?: string;
  detectedBy: string;
  riskScore: number;
  status: "open" | "acknowledged" | "resolved" | "false_positive";
  resolvedBy?: string;
  resolvedAt?: Date;
  resolution?: string;
  autoResponse?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface SecurityMetrics {
  totalEvents: number;
  criticalEvents: number;
  highSeverityEvents: number;
  unresolvedEvents: number;
  eventsByType: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  recentEvents: SecurityEvent[];
}

export class SecurityService {
  // Log a security event
  static async logSecurityEvent(
    type: SecurityEvent["type"],
    severity: SecurityEvent["severity"],
    userId?: string,
    organizationId?: string,
    metadata?: Record<string, any>,
    context?: {
      ipAddress?: string;
      userAgent?: string;
      endpoint?: string;
      method?: string;
    },
  ): Promise<SecurityEvent> {
    // Create security event record
    const securityEvent = await db.securityEvent.create({
      data: {
        type,
        severity,
        category: "security",
        title: `${type.replace(/_/g, " ").toLowerCase()} event`,
        description: `Security event of type ${type}`,
        userId,
        organizationId,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        detectedBy: "system",
        riskScore:
          severity === "critical"
            ? 90
            : severity === "high"
              ? 70
              : severity === "medium"
                ? 50
                : 30,
        metadata: JSON.stringify(metadata || {}),
      },
    });

    // Log to audit system
    await AuditService.log({
      action: "SECURITY_EVENT",
      resource: AuditLogResource.SYSTEM,
      resourceId: securityEvent.id,
      userId,
      organizationId,
      category: AuditLogCategory.SECURITY,
      severity: this.mapSeverityToAuditSeverity(severity),
      status: AuditLogStatus.WARNING,
      metadata: {
        eventType: type,
        eventSeverity: severity,
        ...metadata,
      },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      endpoint: context?.endpoint,
      method: context?.method,
    });

    return {
      ...securityEvent,
      type: securityEvent.type as SecurityEvent["type"],
      severity: securityEvent.severity as SecurityEvent["severity"],
      status: securityEvent.status as SecurityEvent["status"],
      userId: securityEvent.userId || undefined,
      organizationId: securityEvent.organizationId || undefined,
      ipAddress: securityEvent.ipAddress || undefined,
      userAgent: securityEvent.userAgent || undefined,
      description: securityEvent.description || undefined,
      resolvedBy: securityEvent.resolvedBy || undefined,
      resolvedAt: securityEvent.resolvedAt || undefined,
      resolution: securityEvent.resolution || undefined,
      autoResponse: securityEvent.autoResponse || undefined,
      metadata: JSON.parse(securityEvent.metadata || "{}"),
    };
  }

  // Get security events with filtering
  static async getSecurityEvents(
    filters?: {
      type?: SecurityEvent["type"];
      severity?: SecurityEvent["severity"];
      userId?: string;
      organizationId?: string;
      resolved?: boolean;
      startDate?: Date;
      endDate?: Date;
    },
    pagination?: {
      page: number;
      limit: number;
    },
  ): Promise<{ events: SecurityEvent[]; total: number }> {
    const where: any = {};

    if (filters) {
      if (filters.type) where.type = filters.type;
      if (filters.severity) where.severity = filters.severity;
      if (filters.userId) where.userId = filters.userId;
      if (filters.organizationId) where.organizationId = filters.organizationId;
      if (filters.resolved !== undefined) where.resolved = filters.resolved;
      if (filters.startDate || filters.endDate) {
        where.timestamp = {};
        if (filters.startDate) where.timestamp.gte = filters.startDate;
        if (filters.endDate) where.timestamp.lte = filters.endDate;
      }
    }

    const [events, total] = await Promise.all([
      db.securityEvent.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: pagination ? (pagination.page - 1) * pagination.limit : 0,
        take: pagination?.limit || 50,
      }),
      db.securityEvent.count({ where }),
    ]);

    return {
      events: events.map((event) => ({
        ...event,
        type: event.type as SecurityEvent["type"],
        severity: event.severity as SecurityEvent["severity"],
        status: event.status as SecurityEvent["status"],
        userId: event.userId || undefined,
        organizationId: event.organizationId || undefined,
        ipAddress: event.ipAddress || undefined,
        userAgent: event.userAgent || undefined,
        description: event.description || undefined,
        resolvedBy: event.resolvedBy || undefined,
        resolvedAt: event.resolvedAt || undefined,
        resolution: event.resolution || undefined,
        autoResponse: event.autoResponse || undefined,
        metadata: JSON.parse(event.metadata || "{}"),
      })),
      total,
    };
  }

  // Get security metrics
  static async getSecurityMetrics(
    organizationId?: string,
    timeRange?: {
      startDate: Date;
      endDate: Date;
    },
  ): Promise<SecurityMetrics> {
    const where: any = {};

    if (organizationId) where.organizationId = organizationId;
    if (timeRange) {
      where.timestamp = {
        gte: timeRange.startDate,
        lte: timeRange.endDate,
      };
    }

    const [
      totalEvents,
      criticalEvents,
      highSeverityEvents,
      unresolvedEvents,
      eventsByType,
      eventsBySeverity,
      recentEvents,
    ] = await Promise.all([
      db.securityEvent.count({ where }),
      db.securityEvent.count({ where: { ...where, severity: "CRITICAL" } }),
      db.securityEvent.count({ where: { ...where, severity: "HIGH" } }),
      db.securityEvent.count({ where: { ...where, resolved: false } }),
      db.securityEvent.groupBy({
        by: ["type"],
        where,
        _count: { type: true },
      }),
      db.securityEvent.groupBy({
        by: ["severity"],
        where,
        _count: { severity: true },
      }),
      db.securityEvent.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    return {
      totalEvents,
      criticalEvents,
      highSeverityEvents,
      unresolvedEvents,
      eventsByType: eventsByType.reduce(
        (acc, item) => {
          acc[item.type] = item._count.type;
          return acc;
        },
        {} as Record<string, number>,
      ),
      eventsBySeverity: eventsBySeverity.reduce(
        (acc, item) => {
          acc[item.severity] = item._count.severity;
          return acc;
        },
        {} as Record<string, number>,
      ),
      recentEvents: recentEvents.map((event) => ({
        ...event,
        type: event.type as SecurityEvent["type"],
        severity: event.severity as SecurityEvent["severity"],
        status: event.status as SecurityEvent["status"],
        userId: event.userId || undefined,
        organizationId: event.organizationId || undefined,
        ipAddress: event.ipAddress || undefined,
        userAgent: event.userAgent || undefined,
        description: event.description || undefined,
        resolvedBy: event.resolvedBy || undefined,
        resolvedAt: event.resolvedAt || undefined,
        resolution: event.resolution || undefined,
        autoResponse: event.autoResponse || undefined,
        metadata: JSON.parse(event.metadata || "{}"),
      })),
    };
  }

  // Resolve a security event
  static async resolveSecurityEvent(
    eventId: string,
    resolvedBy: string,
    notes?: string,
  ): Promise<SecurityEvent> {
    const event = await db.securityEvent.update({
      where: { id: eventId },
      data: {
        status: "resolved",
        resolvedBy,
        resolvedAt: new Date(),
        resolution: notes,
      },
    });

    // Log resolution
    await AuditService.log({
      action: "RESOLVE",
      resource: AuditLogResource.SYSTEM,
      resourceId: eventId,
      userId: resolvedBy,
      category: AuditLogCategory.SECURITY,
      severity: AuditLogSeverity.INFO,
      metadata: {
        eventType: event.type,
        eventSeverity: event.severity,
        notes,
      },
    });

    return {
      ...event,
      type: event.type as SecurityEvent["type"],
      severity: event.severity as SecurityEvent["severity"],
      status: event.status as SecurityEvent["status"],
      userId: event.userId || undefined,
      organizationId: event.organizationId || undefined,
      ipAddress: event.ipAddress || undefined,
      userAgent: event.userAgent || undefined,
      description: event.description || undefined,
      resolvedBy: event.resolvedBy || undefined,
      resolvedAt: event.resolvedAt || undefined,
      resolution: event.resolution || undefined,
      autoResponse: event.autoResponse || undefined,
      metadata: JSON.parse(event.metadata || "{}"),
    };
  }

  // Helper method to map severity levels
  private static mapSeverityToAuditSeverity(
    severity: SecurityEvent["severity"],
  ): AuditLogSeverity {
    switch (severity) {
      case "low":
        return AuditLogSeverity.LOW;
      case "medium":
        return AuditLogSeverity.MEDIUM;
      case "high":
        return AuditLogSeverity.HIGH;
      case "critical":
        return AuditLogSeverity.CRITICAL;
      default:
        return AuditLogSeverity.INFO;
    }
  }

  // Check for suspicious activity patterns
  static async detectSuspiciousActivity(
    userId?: string,
    organizationId?: string,
    timeWindow: number = 3600000, // 1 hour in milliseconds
  ): Promise<boolean> {
    const since = new Date(Date.now() - timeWindow);

    const where: any = {
      timestamp: { gte: since },
      type: {
        in: ["FAILED_LOGIN", "UNAUTHORIZED_ACCESS", "SUSPICIOUS_ACTIVITY"],
      },
    };

    if (userId) where.userId = userId;
    if (organizationId) where.organizationId = organizationId;

    const suspiciousEvents = await db.securityEvent.count({ where });

    // Threshold for suspicious activity (configurable)
    const threshold = 5;

    if (suspiciousEvents >= threshold) {
      // Log suspicious activity detection
      await this.logSecurityEvent(
        "SUSPICIOUS_ACTIVITY",
        "high",
        userId,
        organizationId,
        {
          eventCount: suspiciousEvents,
          timeWindow: timeWindow,
          threshold: threshold,
        },
      );

      return true;
    }

    return false;
  }

  // Rate limiting check
  static async checkRateLimit(
    identifier: string, // Could be userId, IP address, etc.
    action: string,
    limit: number,
    windowMs: number,
  ): Promise<{ allowed: boolean; remaining: number; resetTime: Date }> {
    const windowStart = new Date(Date.now() - windowMs);
    const windowEnd = new Date(Date.now());

    // Check existing rate limit record
    const existingLimit = await db.apiRateLimit.findFirst({
      where: {
        identifier,
        identifierType: "user",
        endpoint: action,
        windowStart: { lte: windowEnd },
        windowEnd: { gte: windowStart },
      },
    });

    let requestCount = 0;
    if (existingLimit) {
      requestCount = existingLimit.requestCount + 1;

      // Update existing record
      await db.apiRateLimit.update({
        where: { id: existingLimit.id },
        data: {
          requestCount,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new rate limit record
      await db.apiRateLimit.create({
        data: {
          identifier,
          identifierType: "user",
          endpoint: action,
          requestCount: 1,
          requestLimit: limit,
          windowStart,
          windowEnd: new Date(windowStart.getTime() + windowMs),
        },
      });
      requestCount = 1;
    }

    const allowed = requestCount <= limit;
    const remaining = Math.max(0, limit - requestCount);
    const resetTime = new Date(windowStart.getTime() + windowMs);

    if (!allowed) {
      // Log rate limit hit
      await this.logSecurityEvent(
        "RATE_LIMIT_HIT",
        "medium",
        undefined,
        undefined,
        {
          identifier,
          action,
          limit,
          windowMs,
          count: requestCount,
        },
      );
    }

    return {
      allowed,
      remaining,
      resetTime,
    };
  }
}
