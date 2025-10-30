import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { QueueHelpers } from "@/lib/queue";
import { PDFHelpers } from "@/lib/pdf";
import { generateRequestId } from "@/lib/utils";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { handleZodError } from "@/lib/error-handlers";
import { hasPermission, type UserRole } from "@/lib/permissions";
import { db } from "@/lib/db";

// Validation schemas
const ExportRequestSchema = z.object({
  exportType: z.enum(["pdf", "csv", "excel"]),
  reportType: z.enum([
    "users",
    "analytics",
    "financial",
    "system-health",
    "custom"
  ]),
  filters: z.record(z.any()).optional(),
  options: z.object({
    includeCharts: z.boolean().default(false),
    includeImages: z.boolean().default(false),
    format: z.enum(["A4", "Letter"]).default("A4"),
    orientation: z.enum(["portrait", "landscape"]).default("portrait"),
    fileName: z.string().optional(),
  }).optional(),
  notifyEmail: z.string().email().optional(),
  useQueue: z.boolean().default(true),
  priority: z.enum(["high", "normal", "low"]).default("normal"),
  delay: z.number().min(0).optional(),
});

const BatchExportRequestSchema = z.object({
  exports: z.array(ExportRequestSchema).min(1).max(10),
  batchOptions: z.object({
    zipResults: z.boolean().default(true),
    notifyEmail: z.string().email().optional(),
    batchName: z.string().optional(),
  }).optional(),
});

/**
 * POST /api/export - Create export jobs
 */
export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  let userId: string | null = null;
  let organizationId: string | null = null;

  try {
    // Authentication
    const { userId: authUserId } = auth();
    if (!authUserId) {
      return StandardErrorResponse.unauthorized(
        "Authentication required to create exports",
        requestId,
      );
    }
    userId = authUserId;

    // Get user's organization and check permissions
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: {
        organizationMemberships: {
          include: { organization: true },
        },
      },
    });

    if (!user?.organizationMemberships?.[0]) {
      return StandardErrorResponse.forbidden(
        "Organization membership required to create exports",
        requestId,
      );
    }

    organizationId = user.organizationMemberships[0].organizationId;

    // Check permissions
    const userWithRole = {
      id: user.id,
      email: user.email,
      role: user.organizationMemberships[0].role as UserRole,
      organizationId: user.organizationMemberships[0].organizationId,
    };

    if (!hasPermission(userWithRole, "create", "organizations")) {
      return StandardErrorResponse.forbidden(
        "Insufficient permissions to create exports",
        requestId,
      );
    }

    logger.info("Processing export request", "export", {
      requestId,
      userId,
      organizationId,
    });

    // Parse and validate request body
    const body = await request.json();
    const isBatchExport = Array.isArray(body.exports);

    if (isBatchExport) {
      const validatedData = BatchExportRequestSchema.parse(body);

      // Create batch export jobs
      const jobResults = [];
      for (const exportRequest of validatedData.exports) {
        const jobResult = await QueueHelpers.exportData(
          {
            exportType: exportRequest.exportType,
            reportType: exportRequest.reportType,
            filters: exportRequest.filters,
            options: exportRequest.options,
            notifyEmail: exportRequest.notifyEmail || validatedData.batchOptions?.notifyEmail,
            fileName: exportRequest.options?.fileName,
          },
          {
            priority: exportRequest.priority,
            delay: exportRequest.delay,
            userId: user.id,
            organizationId,
          }
        );
        if (jobResult) {
          jobResults.push(jobResult);
        }
      }

      if (jobResults.length === 0) {
        return StandardErrorResponse.create(
          "Failed to create any export jobs",
          "QUEUE_ERROR",
          500,
          undefined,
          requestId
        );
      }

      logger.info("Batch export jobs created successfully", "export", {
        requestId,
        userId,
        organizationId,
        exportCount: validatedData.exports.length,
        successfulJobs: jobResults.length,
        jobIds: jobResults.map(job => job.id),
      });

      return StandardSuccessResponse.create({
        message: "Batch export jobs created successfully",
        jobIds: jobResults.map(job => job.id),
        exportCount: validatedData.exports.length,
        successfulJobs: jobResults.length,
        estimatedProcessingTime: "5-15 minutes",
        requestId,
      });

    } else {
      const validatedData = ExportRequestSchema.parse(body);

      if (validatedData.useQueue) {
        // Create export job via queue
        const jobResult = await QueueHelpers.exportData(
          {
            exportType: validatedData.exportType,
            reportType: validatedData.reportType,
            filters: validatedData.filters,
            options: validatedData.options,
            notifyEmail: validatedData.notifyEmail,
            fileName: validatedData.options?.fileName,
          },
          {
            priority: validatedData.priority,
            delay: validatedData.delay,
            userId: user.id,
            organizationId,
          }
        );

        if (!jobResult) {
          return StandardErrorResponse.create(
            "Failed to create export job",
            "QUEUE_ERROR",
            500,
            undefined,
            requestId
          );
        }

        logger.info("Export job created successfully", "export", {
          requestId,
          userId,
          organizationId,
          exportType: validatedData.exportType,
          reportType: validatedData.reportType,
          jobId: jobResult.id,
        });

        return StandardSuccessResponse.create({
          message: "Export job created successfully",
          jobId: jobResult.id,
          exportType: validatedData.exportType,
          reportType: validatedData.reportType,
          estimatedProcessingTime: getEstimatedProcessingTime(validatedData.exportType),
          requestId,
        });

      } else {
        // Generate export directly (for small exports only)
        if (validatedData.exportType === "pdf") {
          let pdfBuffer;
          
          // Use appropriate PDF helper method based on report type
          switch (validatedData.reportType) {
            case 'users':
              pdfBuffer = await PDFHelpers.generateUserReport([], validatedData.options?.fileName);
              break;
            case 'analytics':
              pdfBuffer = await PDFHelpers.generateAnalyticsReport([], validatedData.options?.fileName);
              break;
            case 'financial':
              pdfBuffer = await PDFHelpers.generateFinancialReport([], validatedData.options?.fileName);
              break;
            case 'system-health':
              pdfBuffer = await PDFHelpers.generateSystemHealthReport([], validatedData.options?.fileName);
              break;
            case 'custom':
            default:
              pdfBuffer = await PDFHelpers.generateCustomReport(
                validatedData.reportType || 'Export Report',
                [],
                validatedData.options
              );
          }

          if (!pdfBuffer.success || !pdfBuffer.buffer) {
            return StandardErrorResponse.internal(
              `PDF generation failed: ${pdfBuffer.error || 'Unknown error'}`,
              undefined,
              requestId,
            );
          }

          logger.info("PDF export generated directly", "export", {
            requestId,
            userId,
            organizationId,
            reportType: validatedData.reportType,
            size: pdfBuffer.buffer.length,
          });

          return new Response(new Uint8Array(pdfBuffer.buffer), {
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": `attachment; filename="${validatedData.options?.fileName || `${validatedData.reportType}-report.pdf`}"`,
              "X-Request-ID": requestId,
            },
          });
        } else {
          return StandardErrorResponse.badRequest(
            "Direct export only supported for PDF format. Use queue for CSV/Excel exports.",
            requestId,
          );
        }
      }
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error, requestId);
    }

    logger.error("Error processing export request", "export", {
      requestId,
      userId,
      organizationId,
      error: error instanceof Error ? error.message : error,
      endpoint: "/api/export",
    });

    return StandardErrorResponse.internal(
      "Failed to process export request",
      process.env.NODE_ENV === "development"
        ? {
            originalError: error instanceof Error ? error.message : error,
          }
        : undefined,
      requestId,
    );
  }
}

/**
 * GET /api/export - Get export history and status
 */
export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  let userId: string | null = null;
  let organizationId: string | null = null;

  try {
    // Authentication
    const { userId: authUserId } = auth();
    if (!authUserId) {
      return StandardErrorResponse.unauthorized(
        "Authentication required to access export history",
        requestId,
      );
    }
    userId = authUserId;

    // Get user's organization and check permissions
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: {
        organizationMemberships: {
          include: { organization: true },
        },
      },
    });

    if (!user?.organizationMemberships?.[0]) {
      return StandardErrorResponse.forbidden(
        "Organization membership required to access export history",
        requestId,
      );
    }

    organizationId = user.organizationMemberships[0].organizationId;

    // Check permissions
    const userWithRole = {
      id: user.id,
      email: user.email,
      role: user.organizationMemberships[0].role as UserRole,
      organizationId: user.organizationMemberships[0].organizationId,
    };

    if (!hasPermission(userWithRole, "read", "organizations")) {
      return StandardErrorResponse.forbidden(
        "Insufficient permissions to access export history",
        requestId,
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const status = searchParams.get("status");
    const exportType = searchParams.get("exportType");

    logger.info("Fetching export history", "export", {
      requestId,
      userId,
      organizationId,
      limit,
      offset,
      status,
      exportType,
    });

    // Mock export history - replace with actual database query
    const mockExports = [
      {
        id: "export_1",
        exportType: "pdf",
        reportType: "users",
        status: "completed",
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        fileName: "users-report.pdf",
        fileSize: 1024000,
        downloadUrl: "/api/export/download/export_1",
      },
      {
        id: "export_2",
        exportType: "csv",
        reportType: "analytics",
        status: "processing",
        createdAt: new Date(Date.now() - 300000).toISOString(),
        completedAt: null,
        fileName: "analytics-report.csv",
        fileSize: null,
        downloadUrl: null,
      },
    ];

    const filteredExports = mockExports
      .filter(exp => !status || exp.status === status)
      .filter(exp => !exportType || exp.exportType === exportType)
      .slice(offset, offset + limit);

    return StandardSuccessResponse.create({
      message: "Export history retrieved successfully",
      exports: filteredExports,
      pagination: {
        limit,
        offset,
        total: mockExports.length,
        hasMore: offset + limit < mockExports.length,
      },
      availableTypes: ["pdf", "csv", "excel"],
      availableReports: ["users", "analytics", "financial", "system-health", "custom"],
      requestId,
    });

  } catch (error) {
    logger.error("Error fetching export history", "export", {
      requestId,
      userId,
      organizationId,
      error: error instanceof Error ? error.message : error,
      endpoint: "/api/export",
    });

    return StandardErrorResponse.internal(
      "Failed to fetch export history",
      process.env.NODE_ENV === "development"
        ? {
            originalError: error instanceof Error ? error.message : error,
          }
        : undefined,
      requestId,
    );
  }
}

/**
 * Get estimated processing time for export type
 */
function getEstimatedProcessingTime(exportType: string): string {
  const estimates: Record<string, string> = {
    "pdf": "3-5 minutes",
    "csv": "2-4 minutes",
    "excel": "4-8 minutes",
  };

  return estimates[exportType] || "3-10 minutes";
}