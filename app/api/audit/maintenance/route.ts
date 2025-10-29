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

const maintenanceQuerySchema = z.object({
  action: z.enum(["cleanup", "archive", "purge"]),
  daysOld: z.coerce.number().min(1).max(365).default(90),
  organizationId: z.string().optional(),
  category: z.nativeEnum(AuditLogCategory).optional(),
  severity: z.nativeEnum(AuditLogSeverity).optional(),
  dryRun: z.coerce.boolean().default(true),
});

// ============================================================================
// POST /api/audit/maintenance - Perform maintenance operations on audit logs
// ============================================================================

export async function POST(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();

    if (!userId) {
      logger.warn("Unauthorized audit maintenance attempt", "audit", {
        requestId,
        endpoint: "/api/audit/maintenance",
        method: "POST",
      });
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        requestId,
      );
    }

    logger.info("Processing audit maintenance request", "audit", {
      requestId,
      userId,
      endpoint: "/api/audit/maintenance",
      method: "POST",
    });

    // Check if user has permission to perform maintenance operations
    // Only allow admin users to perform maintenance
    if (!hasPermission({ id: userId, email: "" }, "admin", "audit")) {
      logger.warn("Insufficient permissions for audit maintenance", "audit", {
        requestId,
        userId,
      });
      return StandardErrorResponse.forbidden(
        "Insufficient permissions to perform audit maintenance",
        requestId,
      );
    }

    // Parse request body
    const body = await _request.json();
    const validatedData = maintenanceQuerySchema.parse(body);

    logger.info("Performing audit maintenance", "audit", {
      requestId,
      userId,
      action: validatedData.action,
      daysOld: validatedData.daysOld,
      dryRun: validatedData.dryRun,
    });

    let result: any;

    switch (validatedData.action) {
      case "archive":
        const archivedCount = await AuditService.archiveOldLogs(
          validatedData.daysOld,
        );
        result = {
          action: "archive",
          archivedCount,
          daysOld: validatedData.daysOld,
        };
        break;
      case "cleanup":
        const deletedCount = await AuditService.deleteExpiredLogs();
        result = { action: "cleanup", deletedCount };
        break;
      case "purge":
        // For now, use the same method as cleanup
        const purgedCount = await AuditService.deleteExpiredLogs();
        result = { action: "purge", purgedCount };
        break;
      default:
        logger.warn("Invalid maintenance action requested", "audit", {
          requestId,
          userId,
          action: validatedData.action,
        });
        return StandardErrorResponse.badRequest(
          "Invalid maintenance action",
          requestId,
        );
    }

    // Log the maintenance action
    await AuditService.log({
      action: `AUDIT_MAINTENANCE_${validatedData.action.toUpperCase()}`,
      resource: "AuditLog",
      resourceId: "audit-maintenance",
      userId,
      organizationId: validatedData.organizationId,
      ipAddress:
        _request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        "unknown",
      userAgent: _request.headers.get("user-agent") || "",
      endpoint: "/api/audit/maintenance",
      method: "POST",
      metadata: {
        maintenanceAction: validatedData.action,
        daysOld: validatedData.daysOld,
        dryRun: validatedData.dryRun,
        result,
      },
      category: AuditLogCategory.SYSTEM,
      severity: AuditLogSeverity.HIGH,
    });

    logger.info("Successfully completed audit maintenance", "audit", {
      requestId,
      userId,
      action: validatedData.action,
      result,
    });

    return StandardSuccessResponse.ok(result, requestId);
  } catch (error) {
    logger.apiError("Error performing audit maintenance", "audit", error, {
      requestId,
      endpoint: "/api/audit/maintenance",
      method: "POST",
    });

    if (error instanceof z.ZodError) {
      return handleZodError(error, requestId);
    }

    if (error instanceof ApiError) {
      return StandardErrorResponse.fromApiError(error, requestId);
    }

    return StandardErrorResponse.internal(
      "Failed to perform audit maintenance",
      requestId,
    );
  }
}

// ============================================================================
// GET /api/audit/maintenance - Get maintenance information
// ============================================================================

// ============================================================================
// GET /api/audit/maintenance - Get maintenance information
// ============================================================================

export async function GET(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();

    if (!userId) {
      logger.warn(
        "Unauthorized audit maintenance info access attempt",
        "audit",
        {
          requestId,
          endpoint: "/api/audit/maintenance",
          method: "GET",
        },
      );
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        requestId,
      );
    }

    logger.info("Processing audit maintenance info request", "audit", {
      requestId,
      userId,
      endpoint: "/api/audit/maintenance",
      method: "GET",
    });

    // Check if user has permission to view maintenance info
    if (!hasPermission({ id: userId, email: "" }, "admin", "audit")) {
      logger.warn(
        "Insufficient permissions for audit maintenance info access",
        "audit",
        {
          requestId,
          userId,
        },
      );
      return StandardErrorResponse.forbidden(
        "Insufficient permissions to view audit maintenance information",
        requestId,
      );
    }

    logger.info("Fetching audit maintenance information", "audit", {
      requestId,
      userId,
    });

    // Get storage statistics
    const storageStats = await AuditService.getStorageStats();

    // Calculate recommendations
    const recommendations = [];

    if (storageStats.totalLogs > 100000) {
      recommendations.push({
        type: "archive",
        message: "Consider archiving old logs to improve performance",
        priority: "medium",
      });
    }

    if (storageStats.archivedLogs > 50000) {
      recommendations.push({
        type: "cleanup",
        message: "Consider cleaning up expired archived logs",
        priority: "low",
      });
    }

    const maintenanceInfo = {
      storageStats,
      recommendations,
      lastMaintenanceCheck: new Date().toISOString(),
    };

    // Log the maintenance info access
    await AuditService.log({
      action: "AUDIT_MAINTENANCE_INFO_ACCESS",
      resource: "AuditLog",
      resourceId: "audit-maintenance-info",
      userId,
      organizationId: undefined, // No specific organization for maintenance info
      ipAddress:
        _request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        "unknown",
      userAgent: _request.headers.get("user-agent") || "",
      endpoint: "/api/audit/maintenance",
      method: "GET",
      metadata: {
        storageStats,
        recommendationCount: recommendations.length,
      },
      category: AuditLogCategory.SYSTEM,
      severity: AuditLogSeverity.LOW,
    });

    logger.info(
      "Successfully retrieved audit maintenance information",
      "audit",
      {
        requestId,
        userId,
        totalLogs: storageStats.totalLogs,
        recommendationCount: recommendations.length,
      },
    );

    return StandardSuccessResponse.ok(maintenanceInfo, requestId);
  } catch (error) {
    logger.apiError("Error fetching audit maintenance info", "audit", error, {
      requestId,
      endpoint: "/api/audit/maintenance",
      method: "GET",
    });

    if (error instanceof ApiError) {
      return StandardErrorResponse.fromApiError(error, requestId);
    }

    return StandardErrorResponse.internal(
      "Failed to fetch audit maintenance information",
      requestId,
    );
  }
}
