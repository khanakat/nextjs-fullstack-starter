import { NextRequest } from "next/server";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { logger } from "@/lib/logger";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { generateRequestId } from "@/lib/utils";
import { queueService } from "@/lib/services/queue";

// POST /api/export-jobs/[id]/retry - Retry a failed export job
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();
    if (!userId) {
      return StandardErrorResponse.unauthorized(
        "Authentication required to retry export job",
        requestId,
      );
    }

    const jobId = params.id;

    // Find the export job
    const exportJob = await db.exportJob.findUnique({
      where: { id: jobId },
      include: {
        report: true,
      },
    });

    if (!exportJob) {
      return StandardErrorResponse.notFound("Export job not found", requestId);
    }

    // Check if user owns the job
    if (exportJob.userId !== userId) {
      return StandardErrorResponse.forbidden("Access denied", requestId);
    }

    // Check if job can be retried
    if (exportJob.status !== "failed") {
      return StandardErrorResponse.badRequest(
        "Only failed jobs can be retried",
        requestId,
      );
    }

    // Reset job status and clear error information
    const updatedJob = await db.exportJob.update({
      where: { id: jobId },
      data: {
        status: "pending",
        errorMessage: null,
        downloadUrl: null,
      },
    });

    // ✅ Fixed: Queue the job for processing
    try {
      await queueService.addJob("export-job", {
        jobId: updatedJob.id,
        userId: auth().userId,
        type: updatedJob.format.toLowerCase(),
        reportId: updatedJob.reportId,
        options: updatedJob.options,
      });

      logger.info("Export job queued for retry", "export-jobs", {
        requestId,
        jobId: updatedJob.id,
        format: updatedJob.format,
      });
    } catch (queueError) {
      logger.error(
        "Failed to queue export job for retry",
        "export-jobs",
        queueError,
      );
    }

    return StandardSuccessResponse.ok({
      updatedJob,
      requestId,
    });
  } catch (error) {
    logger.error("Error processing export job request", {
      requestId,
      resourceId: params.id,
      endpoint: "/api/export-jobs/:id/retry",
      error: error instanceof Error ? error.message : error,
    });

    return StandardErrorResponse.internal(
      "Failed to process export job request",
      requestId,
    );
  }
}
