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

    // TODO: Cancel any running export processes
    // TODO: Clean up any temporary resources

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
