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

// POST /api/export-jobs/[id]/cancel - Cancel an export job
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();
    if (!userId) {
      return StandardErrorResponse.unauthorized(
        "Authentication required to cancel export job",
        requestId,
      );
    }

    const jobId = params.id;

    // Find the export job
    const exportJob = await db.exportJob.findUnique({
      where: { id: jobId },
    });

    if (!exportJob) {
      return StandardErrorResponse.notFound("Export job not found", requestId);
    }

    // Check if user owns the job
    if (exportJob.userId !== userId) {
      return StandardErrorResponse.forbidden("Access denied", requestId);
    }

    // Check if job can be cancelled
    if (!["pending", "processing"].includes(exportJob.status)) {
      return StandardErrorResponse.badRequest(
        "Job cannot be cancelled in current status",
        requestId,
      );
    }

    // Cancel the job in the queue system if it exists
    let queueJobCancelled = false;
    if (exportJob.queueJobId) {
      try {
        queueJobCancelled = await queueService.cancelJob(exportJob.queueJobId);
        if (queueJobCancelled) {
          logger.info("Queue job cancelled successfully", "export-jobs");
        }
      } catch (queueError) {
        logger.warn(
          "Failed to cancel queue job, proceeding with database update",
          "export-jobs",
          queueError,
        );
      }
    }

    // Update job status to cancelled
    const updatedJob = await db.exportJob.update({
      where: { id: jobId },
      data: {
        status: "cancelled",
        completedAt: new Date(),
        errorMessage: queueJobCancelled
          ? null
          : "Cancelled by user (queue job may still be running)",
      },
    });

    logger.info("Export job cancelled successfully", "export-jobs");

    return StandardSuccessResponse.ok({
      job: updatedJob,
      queueJobCancelled,
      message: queueJobCancelled
        ? "Export job cancelled successfully"
        : "Export job marked as cancelled (background process may continue)",
      requestId,
    });
  } catch (error) {
    logger.error("Error cancelling export job", "export-jobs", error);

    return StandardErrorResponse.internal(
      "Failed to cancel export job",
      requestId,
    );
  }
}
