import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { AuditService } from "@/lib/services/audit";
import { AuditLogCategory, AuditLogSeverity } from "@/lib/types/audit";
import { hasPermission } from "@/lib/permissions";
import { z } from "zod";
import { generateRequestId } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { StandardErrorResponse } from "@/lib/standardized-error-responses";
import { handleZodError } from "@/lib/error-handlers";
import { ApiError } from "@/lib/api-utils";

// Define the query parameters schema
const exportQuerySchema = z.object({
  format: z.enum(["csv", "json", "pdf"]).default("csv"),
  organizationId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  category: z.nativeEnum(AuditLogCategory).optional(),
  severity: z.nativeEnum(AuditLogSeverity).optional(),
  userId: z.string().optional(),
  resource: z.string().optional(),
  action: z.string().optional(),
  limit: z.coerce.number().min(1).max(10000).default(1000),
});

/**
 * GET /api/audit/export
 * Export audit logs in various formats
 */
export async function GET(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();

    if (!userId) {
      logger.warn("Unauthorized audit export attempt", "audit", {
        requestId,
        endpoint: "/api/audit/export",
        method: "GET",
      });
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        requestId,
      );
    }

    logger.info("Processing audit export request", "audit", {
      requestId,
      userId,
      endpoint: "/api/audit/export",
      method: "GET",
    });

    // Check if user has permission to export audit logs
    if (!hasPermission({ id: userId, email: "" }, "read", "audit")) {
      logger.warn("Insufficient permissions for audit export", "audit", {
        requestId,
        userId,
      });
      return StandardErrorResponse.forbidden(
        "Insufficient permissions to export audit logs",
        requestId,
      );
    }

    // Parse and validate query parameters
    const url = new URL(_request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const validatedQuery = exportQuerySchema.parse(queryParams);

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

    logger.info("Exporting audit logs", "audit", {
      requestId,
      userId,
      format: validatedQuery.format,
      filters,
      limit: validatedQuery.limit,
    });

    // Get audit logs for export
    const result = await AuditService.getLogs(filters);

    // Generate export data based on format
    let exportData: string | Buffer;
    let contentType: string;
    let filename: string;

    const timestamp = new Date().toISOString().split("T")[0];

    switch (validatedQuery.format) {
      case "csv":
        exportData = generateCSV(result.logs);
        contentType = "text/csv";
        filename = `audit-logs-${timestamp}.csv`;
        break;

      case "json":
        exportData = JSON.stringify(result.logs, null, 2);
        contentType = "application/json";
        filename = `audit-logs-${timestamp}.json`;
        break;

      case "pdf":
        // PDF generation would require additional libraries
        logger.warn("PDF export not implemented", "audit", {
          requestId,
          userId,
          format: validatedQuery.format,
        });
        return StandardErrorResponse.internal(
          "PDF export not implemented",
          undefined,
          requestId,
        );

      default:
        logger.warn("Invalid export format requested", "audit", {
          requestId,
          userId,
          format: validatedQuery.format,
        });
        return StandardErrorResponse.badRequest(
          "Invalid export format",
          requestId,
        );
    }

    // Log the export action
    await AuditService.log({
      action: "AUDIT_LOGS_EXPORT",
      resource: "AuditLog",
      resourceId: "audit-export",
      userId,
      organizationId: validatedQuery.organizationId,
      ipAddress:
        _request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        "unknown",
      userAgent: _request.headers.get("user-agent") || "",
      endpoint: "/api/audit/export",
      method: "GET",
      metadata: {
        format: validatedQuery.format,
        filters: filters,
        recordCount: result.logs.length,
        filename,
      },
      category: AuditLogCategory.SECURITY,
      severity: AuditLogSeverity.HIGH,
    });

    logger.info("Successfully exported audit logs", "audit", {
      requestId,
      userId,
      format: validatedQuery.format,
      recordCount: result.logs.length,
      filename,
    });

    // Return the export file
    return new NextResponse(exportData, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": exportData.length.toString(),
        "X-Request-ID": requestId,
      },
    });
  } catch (error) {
    logger.apiError("Error exporting audit logs", "audit", error, {
      requestId,
      endpoint: "/api/audit/export",
      method: "GET",
    });

    if (error instanceof z.ZodError) {
      return handleZodError(error, requestId);
    }

    if (error instanceof ApiError) {
      return StandardErrorResponse.fromApiError(error, requestId);
    }

    return StandardErrorResponse.internal(
      "Failed to export audit logs",
      requestId,
    );
  }
}

// ============================================================================
// EXPORT HELPERS
// ============================================================================

function generateCSV(logs: any[]): string {
  if (logs.length === 0) {
    return "No data to export";
  }

  // Define CSV headers
  const headers = [
    "ID",
    "Timestamp",
    "Action",
    "Resource",
    "Resource ID",
    "User",
    "User Email",
    "Organization",
    "IP Address",
    "User Agent",
    "Endpoint",
    "Method",
    "Status",
    "Severity",
    "Category",
    "Old Values",
    "New Values",
    "Metadata",
  ];

  // Generate CSV rows
  const rows = logs.map((log) => [
    log.id,
    log.createdAt.toISOString(),
    log.action,
    log.resource,
    log.resourceId || "",
    log.user?.name || "",
    log.user?.email || "",
    log.organization?.name || "",
    log.ipAddress || "",
    log.userAgent || "",
    log.endpoint || "",
    log.method || "",
    log.status,
    log.severity,
    log.category,
    log.oldValues || "",
    log.newValues || "",
    log.metadata || "{}",
  ]);

  // Escape CSV values
  const escapeCSV = (value: string) => {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  // Build CSV content
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => escapeCSV(String(cell))).join(",")),
  ].join("\n");

  return csvContent;
}
