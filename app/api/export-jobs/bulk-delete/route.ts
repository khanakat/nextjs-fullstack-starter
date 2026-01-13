import { NextRequest } from "next/server";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { logger } from "@/lib/logger";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { generateRequestId } from "@/lib/utils";
import { handleZodError } from "@/lib/error-handlers";
import { FileStorageService } from "@/lib/services/file-storage-service";
import { queueService } from "@/lib/services/queue";

const bulkDeleteSchema = z.object({
  jobIds: z.array(z.string()).min(1, "At least one job ID is required"),
});

// POST /api/export-jobs/bulk-delete - Delete multiple export jobs
export async function POST(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();
    if (!userId) {
      return StandardErrorResponse.unauthorized(
        "Authentication required to delete export jobs",
        requestId,
      );
    }

    const body = await _request.json();
    const { jobIds } = bulkDeleteSchema.parse(body);

    // Find all jobs that belong to the user
    const jobs = await db.exportJob.findMany({
      where: {
        id: { in: jobIds },
        userId,
      },
    });

    if (jobs.length === 0) {
      return StandardErrorResponse.notFound(
        "No jobs found or access denied",
        requestId,
      );
    }

    // Cancel any running/pending jobs before deletion to avoid orphaned workers
    const pendingIds = jobs
      .filter((job) => ["pending", "processing"].includes(job.status))
      .map((job) => job.id);

    if (pendingIds.length) {
      await db.exportJob.updateMany({
        where: {
          id: { in: pendingIds },
          userId,
          status: { in: ["pending", "processing"] },
        },
        data: {
          status: "cancelled",
          completedAt: new Date(),
          errorMessage: "Cancelled via bulk delete",
        },
      });
    }

    // Best-effort queue cancellation for any job that has queueJobId
    await Promise.all(
      jobs
        .filter((job) => job.queueJobId)
        .map(async (job) => {
          try {
            await queueService.cancelJob(job.queueJobId!);
          } catch (err) {
            logger.warn("Failed to cancel queue job during bulk delete", "export-jobs", {
              jobId: job.id,
              queueJobId: job.queueJobId,
              error: err instanceof Error ? err.message : err,
            });
          }
        }),
    );

    // Delete the jobs
    const deleteResult = await db.exportJob.deleteMany({
      where: {
        id: { in: jobs.map((job) => job.id) },
        userId,
      },
    });

    // Delete files from storage
    const filePaths: string[] = [];

    for (const job of jobs) {
      if (job.filePath) {
        filePaths.push(job.filePath);
      } else if (job.downloadUrl) {
        const filePath = await FileStorageService.extractFilePathFromUrl(
          job.downloadUrl,
        );
        if (filePath) {
          filePaths.push(filePath);
        }
      }
    }

    if (filePaths.length > 0) {
      await FileStorageService.deleteFiles(filePaths);
    }

    // Best-effort cleanup hook for future process/queue integration
    logger.info("Export jobs cancelled and files cleaned", "export-jobs", {
      requestId,
      userId,
      jobCount: jobs.length,
    });

    return StandardSuccessResponse.ok({
      success: true,
      deletedCount: deleteResult.count,
      requestedCount: jobIds.length,
      requestId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error, requestId);
    }

    logger.error("Error processing bulk delete request", {
      requestId,
      endpoint: "/api/export-jobs/bulk-delete",
      error: error instanceof Error ? error.message : error,
    });

    return StandardErrorResponse.internal(
      "Failed to process bulk delete request",
      requestId,
    );
  }
}
