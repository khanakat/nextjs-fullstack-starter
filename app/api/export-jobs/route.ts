import { NextRequest } from "next/server";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { logger } from "@/lib/logger";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { ExportFormat, ExportStatus } from "@/lib/types/reports";
import { generateRequestId } from "@/lib/utils";
import { handleZodError } from "@/lib/error-handlers";
import { queueService } from "@/lib/services/queue";

// Validation schema
const createExportJobSchema = z.object({
  reportId: z.string().min(1, "Report ID is required"),
  format: z.nativeEnum(ExportFormat),
  options: z
    .object({
      includeCharts: z.boolean().default(true),
      includeData: z.boolean().default(true),
      pageSize: z.enum(["A4", "A3", "LETTER"]).default("A4"),
      orientation: z.enum(["portrait", "landscape"]).default("portrait"),
      quality: z.enum(["low", "medium", "high"]).default("medium"),
    })
    .optional(),
});

// GET /api/export-jobs - List export jobs for the current user
export async function GET(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();
    if (!userId) {
      return StandardErrorResponse.unauthorized(
        "Authentication required to access export jobs",
        requestId,
      );
    }

    const { searchParams } = new URL(_request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status") as ExportStatus;
    const reportId = searchParams.get("reportId") || "";
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { createdBy: userId };

    if (status) {
      where.status = status;
    }

    if (reportId) {
      where.reportId = reportId;
    }

    // Get export jobs with relations
    const [exportJobs, total] = await Promise.all([
      db.exportJob.findMany({
        where,
        include: {
          report: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.exportJob.count({ where }),
    ]);

    return StandardSuccessResponse.ok({
      exportJobs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      requestId,
    });
  } catch (error) {
    logger.error("Error processing export job request", {
      requestId,
      endpoint: "/api/export-jobs",
      error: error instanceof Error ? error.message : error,
    });

    return StandardErrorResponse.internal(
      "Failed to process export job request",
      requestId,
    );
  }
}

// POST /api/export-jobs - Create a new export job
export async function POST(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();
    if (!userId) {
      return StandardErrorResponse.unauthorized(
        "Authentication required to create export jobs",
        requestId,
      );
    }

    const body = await _request.json();
    const validatedData = createExportJobSchema.parse(body);

    // Verify report exists and user has access
    const report = await db.report.findFirst({
      where: {
        id: validatedData.reportId,
        OR: [
          { createdBy: userId },
          { isPublic: true },
          {
            permissions: {
              some: {
                userId: userId,
                permissionType: {
                  in: ["view", "edit", "admin"],
                },
              },
            },
          },
        ],
      },
    });

    if (!report) {
      return StandardErrorResponse.notFound(
        "Report not found or access denied",
        requestId,
      );
    }

    // Create export job
    const exportJob = await db.exportJob.create({
      data: {
        reportId: validatedData.reportId,
        userId: userId,
        format: validatedData.format,
        options: JSON.stringify(validatedData.options || {}),
        status: ExportStatus.PENDING,
      },
      include: {
        report: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    // ✅ Fixed: Queue the export job for processing
    try {
      await queueService.addJob("export-job", {
        jobId: exportJob.id,
        userId: auth().userId,
        type: exportJob.format.toLowerCase(),
        reportId: exportJob.reportId,
        options: exportJob.options,
      });

      logger.info("Export job queued for processing", "export-jobs", {
        requestId,
        jobId: exportJob.id,
        format: exportJob.format,
        reportId: exportJob.reportId,
      });
    } catch (queueError) {
      logger.error("Failed to queue export job", "export-jobs", queueError);

      // Update job status to failed if queueing fails
      await db.exportJob.update({
        where: { id: exportJob.id },
        data: {
          status: ExportStatus.FAILED,
          errorMessage: "Failed to queue job for processing",
        },
      });
    }

    return StandardSuccessResponse.created({
      exportJob,
      requestId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error, requestId);
    }

    logger.error("Error processing export job request", {
      requestId,
      endpoint: "/api/export-jobs",
      error: error instanceof Error ? error.message : error,
    });

    return StandardErrorResponse.internal(
      "Failed to process export job request",
      requestId,
    );
  }
}
