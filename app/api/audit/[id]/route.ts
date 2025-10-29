import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db as prisma } from "@/lib/db";
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

const updateAuditLogSchema = z.object({
  metadata: z.record(z.any()).optional(),
  category: z.nativeEnum(AuditLogCategory).optional(),
  severity: z.nativeEnum(AuditLogSeverity).optional(),
});

// ============================================================================
// GET /api/audit/[id] - Get specific audit log by ID
// ============================================================================

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();

    if (!userId) {
      logger.warn("Unauthorized audit log access attempt", "audit", {
        requestId,
        endpoint: `/api/audit/${params.id}`,
        method: "GET",
        auditLogId: params.id,
      });
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        requestId,
      );
    }

    logger.info("Processing audit log retrieval request", "audit", {
      requestId,
      userId,
      endpoint: `/api/audit/${params.id}`,
      method: "GET",
      auditLogId: params.id,
    });

    // Check if user has permission to read audit logs
    if (!hasPermission({ id: userId, email: "" }, "read", "audit")) {
      logger.warn("Insufficient permissions for audit log access", "audit", {
        requestId,
        userId,
        auditLogId: params.id,
      });
      return StandardErrorResponse.forbidden(
        "Insufficient permissions to access audit logs",
        requestId,
      );
    }

    // Validate audit log ID format
    if (!params.id || params.id.length < 1) {
      logger.warn("Invalid audit log ID provided", "audit", {
        requestId,
        userId,
        auditLogId: params.id,
      });
      return StandardErrorResponse.badRequest(
        "Invalid audit log ID",
        requestId,
      );
    }

    logger.info("Fetching audit log by ID", "audit", {
      requestId,
      userId,
      auditLogId: params.id,
    });

    // Get specific audit log
    const auditLog = await AuditService.getLogById(params.id);

    if (!auditLog) {
      logger.warn("Audit log not found", "audit", {
        requestId,
        userId,
        auditLogId: params.id,
      });
      return StandardErrorResponse.notFound("Audit log not found", requestId);
    }

    // Check if user has access to this specific audit log
    // Users can only access logs from their organization or their own logs
    const canAccess =
      !auditLog.organizationId ||
      auditLog.userId === userId ||
      hasPermission({ id: userId, email: "" }, "admin", "audit");

    if (!canAccess) {
      logger.warn("Access denied to audit log", "audit", {
        requestId,
        userId,
        auditLogId: params.id,
        auditLogUserId: auditLog.userId,
        auditLogOrganizationId: auditLog.organizationId,
      });
      return StandardErrorResponse.forbidden(
        "Access denied to this audit log",
        requestId,
      );
    }

    // Log this audit log access
    await AuditService.log({
      action: "AUDIT_LOG_VIEWED",
      resource: "AuditLog",
      resourceId: params.id, // Agregar resourceId requerido
      userId,
      organizationId: auditLog.organizationId || undefined,
      ipAddress:
        _request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        "unknown",
      userAgent: _request.headers.get("user-agent") || "",
      endpoint: `/api/audit/${params.id}`,
      method: "GET",
      metadata: {
        viewedAuditLogId: params.id,
        viewedAuditLogAction: auditLog.action,
        viewedAuditLogResource: auditLog.resource,
      },
      category: AuditLogCategory.SECURITY,
      severity: AuditLogSeverity.LOW,
    });

    logger.info("Successfully retrieved audit log", "audit", {
      requestId,
      userId,
      auditLogId: params.id,
      auditLogAction: auditLog.action,
      auditLogResource: auditLog.resource,
    });

    return StandardSuccessResponse.ok({ auditLog }, requestId);
  } catch (error) {
    logger.apiError("Error fetching audit log", "audit", error, {
      requestId,
      endpoint: `/api/audit/${params.id}`,
      method: "GET",
      auditLogId: params.id,
    });

    if (error instanceof ApiError) {
      return StandardErrorResponse.fromApiError(error, requestId);
    }

    return StandardErrorResponse.internal(
      "Failed to fetch audit log",
      requestId,
    );
  }
}

// ============================================================================
// PATCH /api/audit/[id] - Update specific audit log metadata
// ============================================================================

export async function PATCH(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();

    if (!userId) {
      logger.warn("Unauthorized audit log update attempt", "audit", {
        requestId,
        endpoint: `/api/audit/${params.id}`,
        method: "PATCH",
        auditLogId: params.id,
      });
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        requestId,
      );
    }

    logger.info("Processing audit log update request", "audit", {
      requestId,
      userId,
      endpoint: `/api/audit/${params.id}`,
      method: "PATCH",
      auditLogId: params.id,
    });

    // Check if user has permission to update audit logs (admin only)
    if (!hasPermission({ id: userId, email: "" }, "admin", "audit")) {
      logger.warn("Insufficient permissions for audit log update", "audit", {
        requestId,
        userId,
        auditLogId: params.id,
      });
      return StandardErrorResponse.forbidden(
        "Insufficient permissions to update audit logs",
        requestId,
      );
    }

    // Validate audit log ID format
    if (!params.id || params.id.length < 1) {
      logger.warn("Invalid audit log ID provided for update", "audit", {
        requestId,
        userId,
        auditLogId: params.id,
      });
      return StandardErrorResponse.badRequest(
        "Invalid audit log ID",
        requestId,
      );
    }

    // Parse and validate request body
    const body = await _request.json();
    const validatedData = updateAuditLogSchema.parse(body);

    // Get existing audit log to verify it exists
    const existingAuditLog = await AuditService.getLogById(params.id);

    if (!existingAuditLog) {
      logger.warn("Audit log not found for update", "audit", {
        requestId,
        userId,
        auditLogId: params.id,
      });
      return StandardErrorResponse.notFound("Audit log not found", requestId);
    }

    logger.info("Updating audit log", "audit", {
      requestId,
      userId,
      auditLogId: params.id,
      updateFields: Object.keys(validatedData),
    });

    // Update audit log (only metadata, category, severity, and notes can be updated)
    const updatedAuditLog = await prisma.auditLog.update({
      where: { id: params.id },
      data: {
        ...(validatedData.metadata && {
          metadata: JSON.stringify(validatedData.metadata),
        }),
        ...(validatedData.category && { category: validatedData.category }),
        ...(validatedData.severity && { severity: validatedData.severity }),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Log the audit log update (meta-audit)
    await AuditService.log({
      action: "AUDIT_LOG_UPDATED",
      resource: "AuditLog",
      resourceId: params.id, // Agregar resourceId requerido
      userId,
      organizationId: existingAuditLog.organizationId || undefined,
      ipAddress:
        _request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        "unknown",
      userAgent: _request.headers.get("user-agent") || "",
      endpoint: `/api/audit/${params.id}`,
      method: "PATCH",
      metadata: {
        updatedAuditLogId: params.id,
        originalAction: existingAuditLog.action,
        originalResource: existingAuditLog.resource,
        updatedFields: validatedData,
        previousMetadata: existingAuditLog.metadata,
      },
      category: AuditLogCategory.SYSTEM,
      severity: AuditLogSeverity.MEDIUM,
    });

    logger.info("Successfully updated audit log", "audit", {
      requestId,
      userId,
      auditLogId: params.id,
      updatedFields: Object.keys(validatedData),
    });

    return StandardSuccessResponse.ok(
      {
        auditLog: {
          id: updatedAuditLog.id,
          action: updatedAuditLog.action,
          resource: updatedAuditLog.resource,
          userId: updatedAuditLog.userId,
          organizationId: updatedAuditLog.organizationId || undefined,
          category: updatedAuditLog.category,
          severity: updatedAuditLog.severity,
          metadata: updatedAuditLog.metadata,

          createdAt: updatedAuditLog.createdAt,
        },
      },
      requestId,
    );
  } catch (error) {
    logger.apiError("Error updating audit log", "audit", error, {
      requestId,
      endpoint: `/api/audit/${params.id}`,
      method: "PATCH",
      auditLogId: params.id,
    });

    if (error instanceof z.ZodError) {
      return handleZodError(error, requestId);
    }

    if (error instanceof ApiError) {
      return StandardErrorResponse.fromApiError(error, requestId);
    }

    return StandardErrorResponse.internal(
      "Failed to update audit log",
      requestId,
    );
  }
}

// ============================================================================
// DELETE /api/audit/[id] - Delete specific audit log (admin only)
// ============================================================================

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();

    if (!userId) {
      logger.warn("Unauthorized audit log deletion attempt", "audit", {
        requestId,
        endpoint: `/api/audit/${params.id}`,
        method: "DELETE",
        auditLogId: params.id,
      });
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        requestId,
      );
    }

    logger.info("Processing audit log deletion request", "audit", {
      requestId,
      userId,
      endpoint: `/api/audit/${params.id}`,
      method: "DELETE",
      auditLogId: params.id,
    });

    // Check if user has permission to delete audit logs (super admin only)
    if (!hasPermission({ id: userId, email: "" }, "admin", "audit")) {
      logger.warn("Insufficient permissions for audit log deletion", "audit", {
        requestId,
        userId,
        auditLogId: params.id,
      });
      return StandardErrorResponse.forbidden(
        "Insufficient permissions to delete audit logs",
        requestId,
      );
    }

    // Validate audit log ID format
    if (!params.id || params.id.length < 1) {
      logger.warn("Invalid audit log ID provided for deletion", "audit", {
        requestId,
        userId,
        auditLogId: params.id,
      });
      return StandardErrorResponse.badRequest(
        "Invalid audit log ID",
        requestId,
      );
    }

    // Get existing audit log to verify it exists and log details
    const existingAuditLog = await AuditService.getLogById(params.id);

    if (!existingAuditLog) {
      logger.warn("Audit log not found for deletion", "audit", {
        requestId,
        userId,
        auditLogId: params.id,
      });
      return StandardErrorResponse.notFound("Audit log not found", requestId);
    }

    logger.warn("Deleting audit log", "audit", {
      requestId,
      userId,
      auditLogId: params.id,
      auditLogAction: existingAuditLog.action,
      auditLogResource: existingAuditLog.resource,
    });

    // Delete audit log
    await prisma.auditLog.delete({
      where: { id: params.id },
    });

    // Log the audit log deletion (meta-audit) - this is critical for compliance
    await AuditService.log({
      action: "AUDIT_LOG_DELETED",
      resource: "AuditLog",
      resourceId: params.id, // Agregar resourceId requerido
      userId,
      organizationId: existingAuditLog.organizationId || undefined,
      ipAddress:
        _request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        "unknown",
      userAgent: _request.headers.get("user-agent") || "",
      endpoint: `/api/audit/${params.id}`,
      method: "DELETE",
      metadata: {
        deletedAuditLogId: params.id,
        deletedAuditLogAction: existingAuditLog.action,
        deletedAuditLogResource: existingAuditLog.resource,
        deletedAuditLogUserId: existingAuditLog.userId,
        deletedAuditLogCreatedAt: existingAuditLog.createdAt,
        deletedAuditLogMetadata: existingAuditLog.metadata,
        deletionReason: "Manual deletion by super admin",
      },
      category: AuditLogCategory.SECURITY,
      severity: AuditLogSeverity.HIGH,
    });

    logger.warn("Successfully deleted audit log", "audit", {
      requestId,
      userId,
      auditLogId: params.id,
    });

    return StandardSuccessResponse.ok(
      {
        message: "Audit log deleted successfully",
        deletedId: params.id,
      },
      requestId,
    );
  } catch (error) {
    logger.apiError("Error deleting audit log", "audit", error, {
      requestId,
      endpoint: `/api/audit/${params.id}`,
      method: "DELETE",
      auditLogId: params.id,
    });

    if (error instanceof ApiError) {
      return StandardErrorResponse.fromApiError(error, requestId);
    }

    return StandardErrorResponse.internal(
      "Failed to delete audit log",
      requestId,
    );
  }
}
