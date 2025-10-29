import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ComplianceService } from "@/lib/services/compliance";
import { AuditService } from "@/lib/services/audit";
import { hasPermission } from "@/lib/permissions";

import { z } from "zod";
import { ComplianceStandard, ExportFormat } from "@/lib/types/audit";
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

const complianceReportSchema = z.object({
  standard: z.nativeEnum(ComplianceStandard),
  organizationId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  format: z.nativeEnum(ExportFormat).optional().default(ExportFormat.JSON),
});

// ============================================================================
// POST /api/audit/compliance - Generate compliance report
// ============================================================================

export async function POST(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();

    if (!userId) {
      logger.warn(
        "Unauthorized compliance report generation attempt",
        "audit",
        {
          requestId,
          endpoint: "/api/audit/compliance",
          method: "POST",
        },
      );
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        requestId,
      );
    }

    logger.info("Processing compliance report generation request", "audit", {
      requestId,
      userId,
      endpoint: "/api/audit/compliance",
      method: "POST",
    });

    const body = await _request.json();
    const validatedData = complianceReportSchema.parse(body);

    const { standard, organizationId, startDate, endDate, format } =
      validatedData;

    // Check permissions
    const canGenerateReports = hasPermission(
      { id: userId, email: "", role: "VIEWER", organizationId: undefined },
      "read",
      "audit",
    );

    if (!canGenerateReports) {
      logger.warn(
        "Insufficient permissions for compliance report generation",
        "audit",
        {
          requestId,
          userId,
          standard,
          organizationId,
        },
      );
      return StandardErrorResponse.forbidden(
        "Insufficient permissions to generate compliance reports",
        requestId,
      );
    }

    // For now, use the provided organizationId or default to undefined
    let finalOrganizationId = organizationId;

    logger.info("Generating compliance report", "audit", {
      requestId,
      userId,
      standard,
      organizationId: finalOrganizationId,
      format,
      dateRange: {
        startDate,
        endDate,
      },
    });

    // Generate compliance report
    const report = await ComplianceService.generateComplianceReport(
      standard,
      finalOrganizationId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );

    // Log the compliance report generation
    await AuditService.logComplianceReport({
      userId,
      organizationId: finalOrganizationId,
      standard,
      reportId: report.id,
      format,
      ipAddress:
        _request.headers.get("x-forwarded-for") ||
        _request.headers.get("x-real-ip") ||
        "unknown",
      userAgent: _request.headers.get("user-agent") || "unknown",
    });

    logger.info("Successfully generated compliance report", "audit", {
      requestId,
      userId,
      reportId: report.id,
      standard,
      format,
      organizationId: finalOrganizationId,
    });

    // Return report based on format
    if (format === ExportFormat.JSON) {
      return StandardSuccessResponse.ok({ report }, requestId);
    } else {
      // Export in requested format
      const exportedData = await ComplianceService.exportComplianceReport(
        report,
        format,
      );

      const filename = `compliance-report-${standard.toLowerCase()}-${new Date().toISOString().split("T")[0]}.${format}`;

      return new NextResponse(exportedData as BodyInit, {
        headers: {
          "Content-Type":
            format === ExportFormat.CSV
              ? "text/csv"
              : "application/octet-stream",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "X-Request-ID": requestId,
        },
      });
    }
  } catch (error) {
    logger.apiError("Error generating compliance report", "audit", error, {
      requestId,
      endpoint: "/api/audit/compliance",
      method: "POST",
    });

    if (error instanceof z.ZodError) {
      return handleZodError(error, requestId);
    }

    if (error instanceof ApiError) {
      return StandardErrorResponse.fromApiError(error, requestId);
    }

    return StandardErrorResponse.internal(
      "Failed to generate compliance report",
      requestId,
    );
  }
}

// ============================================================================
// GET /api/audit/compliance - Get available compliance standards
// ============================================================================

export async function GET() {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();

    if (!userId) {
      logger.warn("Unauthorized compliance standards access attempt", "audit", {
        requestId,
        endpoint: "/api/audit/compliance",
        method: "GET",
      });
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        requestId,
      );
    }

    logger.info("Processing compliance standards request", "audit", {
      requestId,
      userId,
      endpoint: "/api/audit/compliance",
      method: "GET",
    });

    // Check permissions
    const canViewCompliance = hasPermission(
      { id: userId, email: "", role: "VIEWER", organizationId: undefined },
      "read",
      "audit",
    );

    if (!canViewCompliance) {
      logger.warn(
        "Insufficient permissions for compliance standards access",
        "audit",
        {
          requestId,
          userId,
        },
      );
      return StandardErrorResponse.forbidden(
        "Insufficient permissions to view compliance standards",
        requestId,
      );
    }

    // Return available compliance standards and their descriptions
    const standards = [
      {
        value: ComplianceStandard.SOX,
        label: "Sarbanes-Oxley Act (SOX)",
        description: "Financial reporting and corporate governance compliance",
        categories: [
          "Financial Controls",
          "Access Management",
          "Data Integrity",
        ],
      },
      {
        value: ComplianceStandard.GDPR,
        label: "General Data Protection Regulation (GDPR)",
        description: "European Union data protection and privacy regulation",
        categories: [
          "Data Processing",
          "Consent Management",
          "Data Subject Rights",
        ],
      },
      {
        value: ComplianceStandard.HIPAA,
        label: "Health Insurance Portability and Accountability Act (HIPAA)",
        description: "Healthcare data privacy and security standards",
        categories: ["PHI Protection", "Access Controls", "Audit Trails"],
      },
      {
        value: ComplianceStandard.PCI_DSS,
        label: "Payment Card Industry Data Security Standard (PCI DSS)",
        description: "Payment card data security requirements",
        categories: ["Data Encryption", "Access Controls", "Network Security"],
      },
      {
        value: ComplianceStandard.ISO_27001,
        label: "ISO/IEC 27001",
        description: "Information security management systems standard",
        categories: [
          "Security Management",
          "Risk Assessment",
          "Incident Response",
        ],
      },
    ];

    const exportFormats = [
      {
        value: ExportFormat.JSON,
        label: "JSON",
        description: "Machine-readable JSON format",
        mimeType: "application/json",
      },
      {
        value: ExportFormat.CSV,
        label: "CSV",
        description: "Comma-separated values for spreadsheet applications",
        mimeType: "text/csv",
      },
      {
        value: ExportFormat.XLSX,
        label: "Excel",
        description: "Microsoft Excel format (coming soon)",
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        disabled: true,
      },
    ];

    const responseData = {
      standards,
      exportFormats,
      supportedFeatures: {
        customDateRanges: true,
        organizationFiltering: true,
        realTimeGeneration: true,
        scheduledReports: false, // TODO: Implement scheduled reports
      },
    };

    logger.info("Successfully retrieved compliance standards", "audit", {
      requestId,
      userId,
      standardsCount: standards.length,
      formatsCount: exportFormats.length,
    });

    return StandardSuccessResponse.ok(responseData, requestId);
  } catch (error) {
    logger.apiError("Error fetching compliance standards", "audit", error, {
      requestId,
      endpoint: "/api/audit/compliance",
      method: "GET",
    });

    if (error instanceof ApiError) {
      return StandardErrorResponse.fromApiError(error, requestId);
    }

    return StandardErrorResponse.internal(
      "Failed to fetch compliance standards",
      requestId,
    );
  }
}
