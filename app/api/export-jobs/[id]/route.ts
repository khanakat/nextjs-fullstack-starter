import { NextRequest } from "next/server";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { logger } from "@/lib/logger";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { generateRequestId } from "@/lib/utils";
import { FileStorageService } from "@/lib/services/file-storage-service";

// GET /api/export-jobs/[id] - Get a specific export job
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();
    if (!userId) {
      return StandardErrorResponse.unauthorized(
        "Authentication required to access export job",
        requestId,
      );
    }

    const exportJob = await db.exportJob.findFirst({
      where: {
        id: params.id,
        userId: userId,
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

    if (!exportJob) {
      return StandardErrorResponse.notFound("Export job not found", requestId);
    }

    return StandardSuccessResponse.ok({
      exportJob,
      requestId,
    });
  } catch (error) {
    logger.error("Error processing export job request", {
      requestId,
      resourceId: params.id,
      endpoint: "/api/export-jobs/:id",
      error: error instanceof Error ? error.message : error,
    });

    return StandardErrorResponse.internal(
      "Failed to process export job request",
      requestId,
    );
  }
}

// DELETE /api/export-jobs/[id] - Delete an export job
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();
    if (!userId) {
      return StandardErrorResponse.unauthorized(
        "Authentication required to delete export job",
        requestId,
      );
    }

    const exportJob = await db.exportJob.findFirst({
      where: {
        id: params.id,
        userId: userId,
      },
    });

    if (!exportJob) {
      return StandardErrorResponse.notFound("Export job not found", requestId);
    }

    // Delete actual file from storage
    if (exportJob.filePath) {
      await FileStorageService.deleteFile(exportJob.filePath);
    } else if (exportJob.downloadUrl) {
      const filePath = await FileStorageService.extractFilePathFromUrl(
        exportJob.downloadUrl,
      );
      if (filePath) {
        await FileStorageService.deleteFile(filePath);
      }
    }

    await db.exportJob.delete({
      where: { id: params.id },
    });

    return StandardSuccessResponse.ok({
      message: "Export job deleted successfully",
      requestId,
    });
  } catch (error) {
    logger.error("Error processing export job request", {
      requestId,
      resourceId: params.id,
      endpoint: "/api/export-jobs/:id",
      error: error instanceof Error ? error.message : error,
    });

    return StandardErrorResponse.internal(
      "Failed to process export job request",
      requestId,
    );
  }
}
