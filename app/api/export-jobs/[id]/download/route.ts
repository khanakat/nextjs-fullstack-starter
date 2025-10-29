import { NextRequest, NextResponse } from "next/server";
import { StandardErrorResponse } from "@/lib/standardized-error-responses";
import { logger } from "@/lib/logger";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { generateRequestId } from "@/lib/utils";
import { FileStorageService } from "@/lib/services/file-storage-service";
import { promises as fs } from "fs";

// GET /api/export-jobs/[id]/download - Download exported file
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();
    if (!userId) {
      return StandardErrorResponse.unauthorized(
        "Authentication required to download export job",
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

    // Check if job is completed and has a file
    if (exportJob.status !== "completed" || !exportJob.downloadUrl) {
      return StandardErrorResponse.badRequest(
        "File not available for download",
        requestId,
      );
    }

    // Check if file has expired (if completedAt is more than 24 hours ago)
    if (
      exportJob.completedAt &&
      new Date().getTime() - exportJob.completedAt.getTime() >
        24 * 60 * 60 * 1000
    ) {
      return StandardErrorResponse.badRequest("File has expired", requestId);
    }

    // ✅ Fixed: Proper file serving implementation
    try {
      // Use filePath from database if available, otherwise extract from URL
      let filePath = exportJob.filePath;

      if (!filePath) {
        filePath = await FileStorageService.extractFilePathFromUrl(
          exportJob.downloadUrl,
        );
      }

      if (!filePath) {
        logger.error("Could not find file path for export job", "export-jobs", {
          requestId,
          downloadUrl: exportJob.downloadUrl,
          exportJobId: params.id,
        });

        return StandardErrorResponse.notFound("File not found", requestId);
      }

      // Check if file exists
      const fileInfo = await FileStorageService.getFileInfo(filePath);
      if (!fileInfo.exists) {
        logger.error("Export file not found in storage", "export-jobs", {
          requestId,
          filePath,
          exportJobId: params.id,
        });

        return StandardErrorResponse.notFound(
          "Export file not found",
          requestId,
        );
      }

      // Read file content
      const fileContent = await fs.readFile(filePath);

      // Generate appropriate filename
      const fileExtension =
        exportJob.format === "excel" ? "xlsx" : exportJob.format;
      const fileName = `${exportJob.report.name.replace(/[^a-zA-Z0-9]/g, "_")}.${fileExtension}`;

      // Set headers for file download
      const headers = new Headers();
      headers.set("Content-Disposition", `attachment; filename="${fileName}"`);
      headers.set("Content-Type", getContentType(exportJob.format));
      headers.set("Content-Length", fileContent.length.toString());
      headers.set("Cache-Control", "no-cache, no-store, must-revalidate");

      logger.info("File served successfully", "export-jobs", {
        requestId,
        fileName,
        fileSize: fileContent.length,
        contentType: getContentType(exportJob.format),
        exportJobId: params.id,
      });

      // Return file as response
      return new NextResponse(new Uint8Array(fileContent), {
        status: 200,
        headers,
      });
    } catch (fileError) {
      logger.error("Failed to serve export file", "export-jobs", fileError);

      return StandardErrorResponse.internal(
        "Failed to serve export file",
        requestId,
      );
    }
  } catch (error) {
    logger.error("Error processing export job request", {
      requestId,
      resourceId: params.id,
      endpoint: "/api/export-jobs/:id/download",
      error: error instanceof Error ? error.message : error,
    });

    return StandardErrorResponse.internal(
      "Failed to process export job request",
      requestId,
    );
  }
}

function getContentType(format: string): string {
  switch (format) {
    case "pdf":
      return "application/pdf";
    case "excel":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case "csv":
      return "text/csv";
    case "png":
      return "image/png";
    default:
      return "application/octet-stream";
  }
}
