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

const auditQuerySchema = z.object({
  organizationId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  category: z.nativeEnum(AuditLogCategory).optional(),
  severity: z.nativeEnum(AuditLogSeverity).optional(),
  userId: z.string().optional(),
  resource: z.string().optional(),
  action: z.string().optional(),
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .optional()
    .default("1"),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .optional()
    .default("50"),
});

const createAuditLogSchema = z.object({
  action: z.string().min(1, "Action is required"),
  resource: z.string().min(1, "Resource is required"),
  organizationId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  category: z.nativeEnum(AuditLogCategory),
  severity: z.nativeEnum(AuditLogSeverity),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

// ============================================================================
// GET /api/audit - List audit logs with filtering and pagination
// ============================================================================

export async function GET(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();

    if (!userId) {
      logger.warn("Unauthorized audit logs access attempt", "audit", {
        requestId,
        endpoint: "/api/audit",
        method: "GET",
      });
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        requestId,
      );
    }

    logger.info("Processing audit logs request", "audit", {
      requestId,
      userId,
      endpoint: "/api/audit",
      method: "GET",
    });

    // Check if user has permission to read audit logs
    if (!hasPermission({ id: userId, email: "" }, "read", "audit")) {
      logger.warn("Insufficient permissions for audit logs access", "audit", {
        requestId,
        userId,
      });
      return StandardErrorResponse.forbidden(
        "Insufficient permissions to access audit logs",
        requestId,
      );
    }

    // Parse and validate query parameters
    const url = new URL(_request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const validatedQuery = auditQuerySchema.parse(queryParams);

    // Build filters object
    const filters = {
      organizationId: validatedQuery.organizationId || undefined,
      startDate: validatedQuery.startDate
        ? new Date(validatedQuery.startDate)
        : undefined,
      endDate: validatedQuery.endDate
        ? new Date(validatedQuery.endDate)
        : undefined,
      category: validatedQuery.category,
      severity: validatedQuery.severity,
      userId: validatedQuery.userId,
      resource: validatedQuery.resource,
      action: validatedQuery.action,
    };

    const pagination = {
      page: validatedQuery.page,
      limit: Math.min(validatedQuery.limit, 100), // Cap at 100 for performance
    };

    logger.info("Fetching audit logs", "audit", {
      requestId,
      userId,
      filters,
      pagination,
    });

    // Get audit logs with pagination
    const result = await AuditService.getLogs({
      ...filters,
      ...pagination,
    });

    // Log this audit access
    await AuditService.log({
      action: "AUDIT_LOGS_ACCESS",
      resource: "AuditLog",
      resourceId: "audit-logs",
      userId,
      organizationId: validatedQuery.organizationId,
      ipAddress:
        _request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        "unknown",
      userAgent: _request.headers.get("user-agent") || "",
      endpoint: "/api/audit",
      method: "GET",
      metadata: {
        filters,
        pagination,
        resultCount: result.logs.length,
      },
      category: AuditLogCategory.SECURITY,
      severity: AuditLogSeverity.LOW,
    });

    logger.info("Successfully retrieved audit logs", "audit", {
      requestId,
      userId,
      resultCount: result.logs.length,
      totalCount: result.total,
      page: pagination.page,
    });

    return StandardSuccessResponse.ok(
      {
        logs: result.logs,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / pagination.limit),
        },
      },
      requestId,
    );
  } catch (error) {
    logger.apiError("Error fetching audit logs", "audit", error, {
      requestId,
      endpoint: "/api/audit",
      method: "GET",
    });

    if (error instanceof z.ZodError) {
      return handleZodError(error, requestId);
    }

    if (error instanceof ApiError) {
      return StandardErrorResponse.fromApiError(error, requestId);
    }

    return StandardErrorResponse.internal(
      "Failed to fetch audit logs",
      requestId,
    );
  }
}

// ============================================================================
// POST /api/audit - Create new audit log entry
// ============================================================================

export async function POST(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();

    if (!userId) {
      logger.warn("Unauthorized audit log creation attempt", "audit", {
        requestId,
        endpoint: "/api/audit",
        method: "POST",
      });
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        requestId,
      );
    }

    logger.info("Processing audit log creation request", "audit", {
      requestId,
      userId,
      endpoint: "/api/audit",
      method: "POST",
    });

    // Check if user has permission to create audit logs
    if (!hasPermission({ id: userId, email: "" }, "create", "audit")) {
      logger.warn("Insufficient permissions for audit log creation", "audit", {
        requestId,
        userId,
      });
      return StandardErrorResponse.forbidden(
        "Insufficient permissions to create audit logs",
        requestId,
      );
    }

    // Parse and validate request body
    const body = await _request.json();
    const validatedData = createAuditLogSchema.parse(body);

    // Create audit log entry
    const auditLogData = {
      ...validatedData,
      resourceId: "audit-log-entry",
      userId,
      ipAddress:
        validatedData.ipAddress ||
        _request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        "unknown",
      userAgent:
        validatedData.userAgent ||
        _request.headers.get("user-agent") ||
        "unknown",
      endpoint: "/api/audit",
      method: "POST",
    };

    logger.info("Creating audit log entry", "audit", {
      requestId,
      userId,
      action: validatedData.action,
      resource: validatedData.resource,
      category: validatedData.category,
      severity: validatedData.severity,
    });

    const auditLog = await AuditService.log(auditLogData);

    // Log the audit log creation (meta-audit)
    if (auditLog) {
      await AuditService.log({
        action: "AUDIT_LOG_CREATED",
        resource: "AuditLog",
        resourceId: auditLog.id,
        userId,
        organizationId: validatedData.organizationId,
        ipAddress: auditLogData.ipAddress,
        userAgent: auditLogData.userAgent,
        endpoint: "/api/audit",
        method: "POST",
        metadata: {
          createdAuditLogId: auditLog.id,
          originalAction: validatedData.action,
          originalResource: validatedData.resource,
        },
        category: AuditLogCategory.SYSTEM,
        severity: AuditLogSeverity.MEDIUM,
      });
    }

    if (!auditLog) {
      logger.error("Failed to create audit log entry", "audit", {
        requestId,
        userId,
        action: validatedData.action,
        resource: validatedData.resource,
      });
      return StandardErrorResponse.internal(
        "Failed to create audit log entry",
        undefined,
        requestId,
      );
    }

    logger.info("Successfully created audit log entry", "audit", {
      requestId,
      userId,
      auditLogId: auditLog.id,
      action: validatedData.action,
      resource: validatedData.resource,
    });

    return StandardSuccessResponse.created(
      {
        auditLog: {
          id: auditLog.id,
          action: auditLog.action,
          resource: auditLog.resource,
          userId: auditLog.userId,
          organizationId: auditLog.organizationId || undefined,
          category: auditLog.category,
          severity: auditLog.severity,
          createdAt: auditLog.createdAt,
        },
      },
      requestId,
    );
  } catch (error) {
    logger.apiError("Error creating audit log", "audit", error, {
      requestId,
      endpoint: "/api/audit",
      method: "POST",
    });

    if (error instanceof z.ZodError) {
      return handleZodError(error, requestId);
    }

    if (error instanceof ApiError) {
      return StandardErrorResponse.fromApiError(error, requestId);
    }

    return StandardErrorResponse.internal(
      "Failed to create audit log",
      requestId,
    );
  }
}
