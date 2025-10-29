import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { AuditService } from "@/lib/services/audit";
import { AuditLogCategory, AuditLogSeverity } from "@/lib/types/audit";
import { hasPermission } from "@/lib/permissions";
import { z } from "zod";
import { generateRequestId } from "@/lib/utils";
import { logger } from "@/lib/logger";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { handleZodError } from "@/lib/error-handlers";
import { ApiError } from "@/lib/api-utils";

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const statsQuerySchema = z.object({
  organizationId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// ============================================================================
// GET /api/audit/stats - Get audit log statistics and analytics
// ============================================================================

export async function GET(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();

    if (!userId) {
      logger.warn("Unauthorized audit stats access attempt", "audit", {
        requestId,
        endpoint: "/api/audit/stats",
        method: "GET",
      });
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        requestId,
      );
    }

    logger.info("Processing audit stats request", "audit", {
      requestId,
      userId,
      endpoint: "/api/audit/stats",
      method: "GET",
    });

    // Check if user has permission to access audit logs
    if (!hasPermission({ id: userId, email: "" }, "read", "audit")) {
      logger.warn("Insufficient permissions for audit stats access", "audit", {
        requestId,
        userId,
      });
      return StandardErrorResponse.forbidden(
        "Insufficient permissions to access audit statistics",
        requestId,
      );
    }

    // Parse and validate query parameters
    const url = new URL(_request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const validatedQuery = statsQuerySchema.parse(queryParams);

    // Parse dates
    const startDate = validatedQuery.startDate
      ? new Date(validatedQuery.startDate)
      : undefined;
    const endDate = validatedQuery.endDate
      ? new Date(validatedQuery.endDate)
      : undefined;

    logger.info("Fetching audit statistics", "audit", {
      requestId,
      userId,
      organizationId: validatedQuery.organizationId,
      dateRange: {
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
      },
    });

    // Get audit statistics
    const stats = await AuditService.getStats(
      validatedQuery.organizationId || undefined,
      startDate,
      endDate,
    );

    // Log this stats access
    await AuditService.log({
      action: "AUDIT_STATS_ACCESS",
      resource: "AuditLog",
      resourceId: "audit-stats",
      userId,
      organizationId: validatedQuery.organizationId,
      ipAddress:
        _request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        "unknown",
      userAgent: _request.headers.get("user-agent") || "",
      endpoint: "/api/audit/stats",
      method: "GET",
      metadata: {
        filters: validatedQuery,
        statsScope: validatedQuery.organizationId ? "organization" : "global",
      },
      category: AuditLogCategory.SECURITY,
      severity: AuditLogSeverity.LOW,
    });

    logger.info("Successfully retrieved audit statistics", "audit", {
      requestId,
      userId,
      organizationId: validatedQuery.organizationId,
      statsCount: Object.keys(stats).length,
    });

    return StandardSuccessResponse.ok(stats, requestId);
  } catch (error) {
    logger.apiError("Error fetching audit stats", "audit", error, {
      requestId,
      endpoint: "/api/audit/stats",
      method: "GET",
    });

    if (error instanceof z.ZodError) {
      return handleZodError(error, requestId);
    }

    if (error instanceof ApiError) {
      return StandardErrorResponse.fromApiError(error, requestId);
    }

    return StandardErrorResponse.internal(
      "Failed to fetch audit statistics",
      requestId,
    );
  }
}
