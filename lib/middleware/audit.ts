import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from 'next-auth'
// import { authOptions } from '@/lib/auth'
import { AuditService } from "@/lib/services/audit";
import {
  AuditMiddlewareConfig,
  AuditRequestInfo,
  AuditLogAction,
  AuditLogResource,
  AuditLogSeverity,
  AuditLogCategory,
  AuditLogStatus,
} from "@/lib/types/audit";

// ============================================================================
// AUDIT MIDDLEWARE CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: AuditMiddlewareConfig = {
  enabled: true,
  excludePaths: [
    "/api/health",
    "/api/metrics",
    "/api/audit", // Prevent recursive logging
    "/_next",
    "/favicon.ico",
    "/robots.txt",
    "/sitemap.xml",
  ],
  includePaths: ["/api/"],
  logRequestBody: true,
  logResponseBody: false,
  sensitiveFields: [
    "password",
    "token",
    "secret",
    "key",
    "authorization",
    "cookie",
    "session",
  ],
  maxBodySize: 10000, // 10KB
};

// ============================================================================
// AUDIT MIDDLEWARE CLASS
// ============================================================================

export class AuditMiddleware {
  private config: AuditMiddlewareConfig;

  constructor(config: Partial<AuditMiddlewareConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Main middleware function
   */
  async handle(request: NextRequest): Promise<NextResponse> {
    if (!this.config.enabled) {
      return NextResponse.next();
    }

    const startTime = Date.now();
    const requestInfo = await this.extractRequestInfo(request);

    // Check if path should be audited
    if (!this.shouldAuditPath(requestInfo.path)) {
      return NextResponse.next();
    }

    // Continue with the request
    const response = NextResponse.next();

    // Log the request asynchronously (don't await to avoid blocking)
    this.logRequest(requestInfo, startTime).catch((error) => {
      console.error("Audit middleware error:", error);
    });

    return response;
  }

  /**
   * Extract request information
   */
  private async extractRequestInfo(
    request: NextRequest,
  ): Promise<AuditRequestInfo> {
    const url = new URL(request.url);
    const headers = Object.fromEntries(request.headers.entries());

    // Get user session
    let userId: string | undefined;
    let organizationId: string | undefined;
    let sessionId: string | undefined;

    try {
      // const session = await getServerSession(authOptions)
      // if (session?.user) {
      //   userId = session.user.id
      //   // organizationId = session.user.currentOrganizationId // Property doesn't exist
      //   // sessionId = session.user.sessionId // Property doesn't exist
      // }
    } catch (error) {
      // Session extraction failed, continue without user info
    }

    // Extract request body if needed
    let body: any;
    if (this.config.logRequestBody && request.body) {
      try {
        const clonedRequest = request.clone();
        const text = await clonedRequest.text();

        if (text && text.length <= (this.config.maxBodySize || 10000)) {
          try {
            body = JSON.parse(text);
            body = this.sanitizeData(body);
          } catch {
            body = text.substring(0, this.config.maxBodySize || 10000);
          }
        }
      } catch (error) {
        // Body extraction failed, continue without body
      }
    }

    return {
      method: request.method,
      url: request.url,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams.entries()),
      headers: this.sanitizeHeaders(headers),
      body,
      ip: this.getClientIP(request),
      userAgent: headers["user-agent"] || "",
      userId,
      organizationId,
      sessionId,
    };
  }

  /**
   * Log the request
   */
  private async logRequest(
    requestInfo: AuditRequestInfo,
    startTime: number,
  ): Promise<void> {
    const duration = Date.now() - startTime;
    const action = this.getActionFromRequest(requestInfo);
    const resource = this.getResourceFromPath(requestInfo.path);
    const category = this.getCategoryFromRequest(requestInfo);
    const severity = this.getSeverityFromRequest(requestInfo);

    await AuditService.log({
      action,
      resource,
      resourceId: requestInfo.userId || "unknown",
      userId: requestInfo.userId,
      organizationId: requestInfo.organizationId,
      sessionId: requestInfo.sessionId,
      ipAddress: requestInfo.ip,
      userAgent: requestInfo.userAgent,
      endpoint: requestInfo.path,
      method: requestInfo.method,
      metadata: {
        query: requestInfo.query,
        headers: requestInfo.headers,
        body: requestInfo.body,
        duration,
        timestamp: new Date().toISOString(),
      },
      category,
      severity,
      status: AuditLogStatus.SUCCESS,
    });
  }

  /**
   * Check if path should be audited
   */
  private shouldAuditPath(path: string): boolean {
    // Check exclude paths
    if (
      this.config.excludePaths?.some((excludePath) =>
        path.startsWith(excludePath),
      )
    ) {
      return false;
    }

    // Check include paths
    if (this.config.includePaths?.length) {
      return this.config.includePaths.some((includePath) =>
        path.startsWith(includePath),
      );
    }

    return true;
  }

  /**
   * Get action from request
   */
  private getActionFromRequest(requestInfo: AuditRequestInfo): string {
    const { method, path } = requestInfo;

    // API endpoints
    if (path.startsWith("/api/")) {
      switch (method) {
        case "GET":
          return "API_READ";
        case "POST":
          return path.includes("login")
            ? AuditLogAction.LOGIN
            : path.includes("register")
              ? AuditLogAction.REGISTER
              : "API_CREATE";
        case "PUT":
        case "PATCH":
          return "API_UPDATE";
        case "DELETE":
          return "API_DELETE";
        default:
          return `API_${method}`;
      }
    }

    // Authentication endpoints
    if (path.includes("auth")) {
      if (path.includes("signin")) return AuditLogAction.LOGIN;
      if (path.includes("signout")) return AuditLogAction.LOGOUT;
      if (path.includes("signup")) return AuditLogAction.REGISTER;
    }

    return `${method}_${path.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase()}`;
  }

  /**
   * Get resource from path
   */
  private getResourceFromPath(path: string): string {
    // Extract resource from API paths
    if (path.startsWith("/api/")) {
      const segments = path.split("/").filter(Boolean);
      if (segments.length >= 2) {
        const resource = segments[1];

        // Map common resources
        switch (resource) {
          case "users":
            return AuditLogResource.USER;
          case "organizations":
            return AuditLogResource.ORGANIZATION;
          case "reports":
            return AuditLogResource.REPORT;
          case "templates":
            return AuditLogResource.TEMPLATE;
          case "notifications":
            return AuditLogResource.NOTIFICATION;
          case "auth":
            return AuditLogResource.SESSION;
          default:
            return resource.toUpperCase();
        }
      }
    }

    // Authentication paths
    if (path.includes("auth")) {
      return AuditLogResource.SESSION;
    }

    return "WEB_PAGE";
  }

  /**
   * Get category from request
   */
  private getCategoryFromRequest(
    requestInfo: AuditRequestInfo,
  ): AuditLogCategory {
    const { path } = requestInfo;

    if (
      path.includes("auth") ||
      path.includes("login") ||
      path.includes("register")
    ) {
      return AuditLogCategory.AUTHENTICATION;
    }

    if (path.includes("organization")) {
      return AuditLogCategory.ORGANIZATION;
    }

    if (path.includes("report")) {
      return AuditLogCategory.REPORT;
    }

    if (path.includes("user")) {
      return AuditLogCategory.USER;
    }

    if (path.startsWith("/api/")) {
      return AuditLogCategory.DATA;
    }

    return AuditLogCategory.GENERAL;
  }

  /**
   * Get severity from request
   */
  private getSeverityFromRequest(
    requestInfo: AuditRequestInfo,
  ): AuditLogSeverity {
    const { method, path } = requestInfo;

    // High severity for destructive operations
    if (method === "DELETE") {
      return AuditLogSeverity.HIGH;
    }

    // Medium severity for authentication and modifications
    if (
      path.includes("auth") ||
      method === "POST" ||
      method === "PUT" ||
      method === "PATCH"
    ) {
      return AuditLogSeverity.MEDIUM;
    }

    // Low severity for read operations
    return AuditLogSeverity.INFO;
  }

  /**
   * Get client IP address
   */
  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get("x-forwarded-for");
    const realIP = request.headers.get("x-real-ip");
    const remoteAddr = request.headers.get("remote-addr");

    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }

    return realIP || remoteAddr || "unknown";
  }

  /**
   * Sanitize headers to remove sensitive information
   */
  private sanitizeHeaders(
    headers: Record<string, string>,
  ): Record<string, string> {
    const sanitized = { ...headers };

    this.config.sensitiveFields?.forEach((field) => {
      const lowerField = field.toLowerCase();
      Object.keys(sanitized).forEach((key) => {
        if (key.toLowerCase().includes(lowerField)) {
          sanitized[key] = "[REDACTED]";
        }
      });
    });

    return sanitized;
  }

  /**
   * Sanitize data to remove sensitive fields
   */
  private sanitizeData(data: any): any {
    if (!data || typeof data !== "object") {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeData(item));
    }

    const sanitized = { ...data };

    this.config.sensitiveFields?.forEach((field) => {
      const lowerField = field.toLowerCase();
      Object.keys(sanitized).forEach((key) => {
        if (key.toLowerCase().includes(lowerField)) {
          sanitized[key] = "[REDACTED]";
        }
      });
    });

    // Recursively sanitize nested objects
    Object.keys(sanitized).forEach((key) => {
      if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeData(sanitized[key]);
      }
    });

    return sanitized;
  }
}

// ============================================================================
// MIDDLEWARE WRAPPER FUNCTIONS
// ============================================================================

/**
 * Create audit middleware with custom configuration
 */
export function createAuditMiddleware(config?: Partial<AuditMiddlewareConfig>) {
  const middleware = new AuditMiddleware(config);
  return (request: NextRequest) => middleware.handle(request);
}

/**
 * Default audit middleware instance
 */
export const auditMiddleware = createAuditMiddleware();

// ============================================================================
// MANUAL AUDIT LOGGING HELPERS
// ============================================================================

/**
 * Manually log an API request (for use in API routes)
 */
export async function logApiRequest(
  request: NextRequest,
  action: string,
  resource: string,
  userId?: string,
  organizationId?: string,
  metadata?: Record<string, any>,
): Promise<void> {
  const url = new URL(request.url);
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  await AuditService.log({
    action,
    resource,
    resourceId: userId || "unknown",
    userId,
    organizationId,
    ipAddress: ip,
    userAgent: request.headers.get("user-agent") || "",
    endpoint: url.pathname,
    method: request.method,
    metadata: {
      query: Object.fromEntries(url.searchParams.entries()),
      ...metadata,
    },
    category: AuditLogCategory.DATA,
    severity: AuditLogSeverity.INFO,
  });
}

/**
 * Log authentication events
 */
export async function logAuthEvent(
  action: "LOGIN" | "LOGOUT" | "REGISTER",
  userId: string,
  request: NextRequest,
  success: boolean = true,
  metadata?: Record<string, any>,
): Promise<void> {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  await AuditService.logAuth(
    action,
    userId,
    {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") || "",
      endpoint: new URL(request.url).pathname,
      method: request.method,
    },
    {
      success,
      ...metadata,
    },
  );
}

/**
 * Log security events
 */
export async function logSecurityEvent(
  action: string,
  severity: AuditLogSeverity,
  request: NextRequest,
  userId?: string,
  organizationId?: string,
  metadata?: Record<string, any>,
): Promise<void> {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  await AuditService.logSecurity(
    action as any,
    severity,
    userId,
    organizationId,
    metadata,
    {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") || "",
      endpoint: new URL(request.url).pathname,
      method: request.method,
    },
  );
}

export default AuditMiddleware;
