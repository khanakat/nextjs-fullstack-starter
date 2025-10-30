import { NextRequest, NextResponse } from "next/server";
import { AuditService } from "@/lib/services/audit";
import {
  AuditLogSeverity,
  AuditLogCategory,
  AuditLogStatus,
} from "@/lib/types/audit";

// ============================================================================
// AUDIT MIDDLEWARE CONFIGURATION
// ============================================================================

interface AuditMiddlewareConfig {
  enabled: boolean;
  excludePaths: string[];
  excludeMethods: string[];
  logRequestBody: boolean;
  logResponseBody: boolean;
  maxBodySize: number;
  sensitiveFields: string[];
}

const DEFAULT_CONFIG: AuditMiddlewareConfig = {
  enabled: true,
  excludePaths: [
    "/api/health",
    "/api/ping",
    "/api/audit/logs", // Avoid recursive logging
    "/_next",
    "/favicon.ico",
    "/robots.txt",
  ],
  excludeMethods: ["OPTIONS"],
  logRequestBody: true,
  logResponseBody: false, // Usually too large and sensitive
  maxBodySize: 10000, // 10KB
  sensitiveFields: [
    "password",
    "token",
    "secret",
    "key",
    "authorization",
    "cookie",
    "session",
  ],
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if path should be excluded from audit logging
 */
function shouldExcludePath(
  pathname: string,
  config: AuditMiddlewareConfig,
): boolean {
  return config.excludePaths.some((excludePath) =>
    pathname.startsWith(excludePath),
  );
}

/**
 * Check if method should be excluded from audit logging
 */
function shouldExcludeMethod(
  method: string,
  config: AuditMiddlewareConfig,
): boolean {
  return config.excludeMethods.includes(method.toUpperCase());
}

/**
 * Sanitize sensitive data from object
 */
function sanitizeData(data: any, sensitiveFields: string[]): any {
  if (!data || typeof data !== "object") return data;

  const sanitized = Array.isArray(data) ? [...data] : { ...data };

  for (const key in sanitized) {
    if (
      sensitiveFields.some((field) =>
        key.toLowerCase().includes(field.toLowerCase()),
      )
    ) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof sanitized[key] === "object") {
      sanitized[key] = sanitizeData(sanitized[key], sensitiveFields);
    }
  }

  return sanitized;
}

/**
 * Get client IP address from request
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const remoteAddr = request.headers.get("x-vercel-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  return realIP || remoteAddr || "unknown";
}

/**
 * Determine audit severity based on HTTP method and status
 */
function getAuditSeverity(method: string, status: number): AuditLogSeverity {
  // Critical for security-related failures
  if (status === 401 || status === 403) {
    return AuditLogSeverity.HIGH;
  }

  // High for server errors
  if (status >= 500) {
    return AuditLogSeverity.HIGH;
  }

  // Medium for client errors
  if (status >= 400) {
    return AuditLogSeverity.MEDIUM;
  }

  // Medium for destructive operations
  if (["DELETE", "PUT", "PATCH"].includes(method.toUpperCase())) {
    return AuditLogSeverity.MEDIUM;
  }

  // Low for read operations
  return AuditLogSeverity.INFO;
}

/**
 * Determine audit category based on endpoint
 */
function getAuditCategory(pathname: string): AuditLogCategory {
  if (
    pathname.includes("/auth") ||
    pathname.includes("/login") ||
    pathname.includes("/register")
  ) {
    return AuditLogCategory.AUTHENTICATION;
  }

  if (pathname.includes("/user") || pathname.includes("/profile")) {
    return AuditLogCategory.USER;
  }

  if (pathname.includes("/org") || pathname.includes("/organization")) {
    return AuditLogCategory.ORGANIZATION;
  }

  if (pathname.includes("/admin") || pathname.includes("/settings")) {
    return AuditLogCategory.SYSTEM;
  }

  if (pathname.includes("/report") || pathname.includes("/export")) {
    return AuditLogCategory.REPORT;
  }

  if (pathname.includes("/api/")) {
    return AuditLogCategory.SYSTEM;
  }

  return AuditLogCategory.GENERAL;
}

/**
 * Get audit status from HTTP status code
 */
function getAuditStatus(status: number): AuditLogStatus {
  if (status >= 200 && status < 300) {
    return AuditLogStatus.SUCCESS;
  }

  if (status >= 400 && status < 500) {
    return AuditLogStatus.WARNING;
  }

  if (status >= 500) {
    return AuditLogStatus.FAILURE;
  }

  return AuditLogStatus.SUCCESS;
}

// ============================================================================
// AUDIT MIDDLEWARE CLASS
// ============================================================================

export class AuditMiddleware {
  private config: AuditMiddlewareConfig;

  constructor(config: Partial<AuditMiddlewareConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Main middleware function for Next.js API routes
   */
  async middleware(request: NextRequest): Promise<NextResponse> {
    const startTime = Date.now();

    // Skip if audit logging is disabled
    if (!this.config.enabled) {
      return NextResponse.next();
    }

    const { pathname } = request.nextUrl;
    const method = request.method;

    // Skip excluded paths and methods
    if (
      shouldExcludePath(pathname, this.config) ||
      shouldExcludeMethod(method, this.config)
    ) {
      return NextResponse.next();
    }

    // Get request data
    const ipAddress = getClientIP(request);
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Get current user (if authenticated)
    let currentUser: any = null;
    let organizationId: string | undefined = undefined;

    try {
      const user = await currentUser();
      currentUser = user;
      // Assuming user has organizationId or we can derive it
      organizationId = user?.organizationId;
    } catch (error) {
      // User not authenticated, continue without user context
    }

    // Capture request body if enabled and method allows it
    let requestBody: any = null;
    if (
      this.config.logRequestBody &&
      ["POST", "PUT", "PATCH"].includes(method)
    ) {
      try {
        const body = await request.text();
        if (body && body.length <= this.config.maxBodySize) {
          requestBody = JSON.parse(body);
          requestBody = sanitizeData(requestBody, this.config.sensitiveFields);
        }
      } catch (error) {
        // Failed to parse body, skip it
      }
    }

    // Continue with the request
    const response = NextResponse.next();

    // Log the audit event after response (in background)
    setTimeout(async () => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      const status = response.status || 200;

      try {
        await AuditService.log({
          action: `${method}_${pathname
            .replace(/^\/api\//, "")
            .replace(/\//g, "_")
            .toUpperCase()}`,
          resource: "api_endpoint",
          resourceId: pathname,
          userId: currentUser?.id,
          organizationId,
          ipAddress,
          userAgent,
          endpoint: pathname,
          method,
          severity: getAuditSeverity(method, status),
          category: getAuditCategory(pathname),
          status: getAuditStatus(status),
          metadata: {
            httpStatus: status,
            duration,
            requestHeaders: sanitizeData(
              Object.fromEntries(request.headers.entries()),
              this.config.sensitiveFields,
            ),
            requestBody: requestBody,
            query: Object.fromEntries(request.nextUrl.searchParams.entries()),
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        console.error("Failed to log audit event:", error);
      }
    }, 0);

    return response;
  }

  /**
   * Update middleware configuration
   */
  updateConfig(newConfig: Partial<AuditMiddlewareConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): AuditMiddlewareConfig {
    return { ...this.config };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

// Default instance
export const auditMiddleware = new AuditMiddleware();

// Factory function for custom configuration
export function createAuditMiddleware(
  config: Partial<AuditMiddlewareConfig> = {},
) {
  return new AuditMiddleware(config);
}

// Convenience function for API route handlers
export function withAudit(
  handler: Function,
  config?: Partial<AuditMiddlewareConfig>,
) {
  const middleware = config ? new AuditMiddleware(config) : auditMiddleware;

  return async (request: NextRequest, context: any) => {
    // Apply audit middleware
    await middleware.middleware(request);

    // Call original handler
    return handler(request, context);
  };
}

export default AuditMiddleware;
