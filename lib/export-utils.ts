import * as XLSX from "xlsx";
import { logger } from "@/lib/logger";
import { queueService } from "@/lib/services/queue";
import fs from "fs/promises";
import path from "path";

export type ExportFormat = "csv" | "json" | "pdf" | "xlsx";

export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  headers?: string[];
  includeHeaders?: boolean;
  maxRows?: number;
  compression?: boolean;
  chunkSize?: number;
  jobId?: string;
}

export interface ExportProgress {
  jobId: string;
  progress: number;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  message?: string;
}

export interface ExportResult {
  success: boolean;
  filePath?: string;
  filename?: string;
  size?: number;
  rowCount?: number;
  error?: string;
}

/**
 * Export data to CSV format
 */
export async function exportToCSV(
  data: any[],
  options: ExportOptions = { format: "csv" },
): Promise<ExportResult> {
  try {
    const {
      filename = "export.csv",
      headers,
      includeHeaders = true,
      maxRows,
    } = options;

    // Limit rows if specified
    const limitedData = maxRows ? data.slice(0, maxRows) : data;

    if (limitedData.length === 0) {
      return { success: false, error: "No data to export" };
    }

    // Generate CSV content
    let csvContent = "";

    // Add headers if specified or auto-generate from first row
    if (includeHeaders) {
      const csvHeaders = headers || Object.keys(limitedData[0]);
      csvContent += csvHeaders.map((header) => `"${header}"`).join(",") + "\n";
    }

    // Add data rows
    for (const row of limitedData) {
      const values = headers
        ? headers.map((header) => row[header] ?? "")
        : Object.values(row);

      csvContent +=
        values
          .map((value) => {
            const stringValue = String(value ?? "");
            // Escape quotes and wrap in quotes if contains comma, quote, or newline
            if (
              stringValue.includes(",") ||
              stringValue.includes('"') ||
              stringValue.includes("\n")
            ) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          })
          .join(",") + "\n";
    }

    const buffer = Buffer.from(csvContent, "utf-8");

    logger.info("CSV export completed", "export", {
      filename,
      rowCount: limitedData.length,
      size: buffer.length,
    });

    return {
      success: true,
      filename,
      size: buffer.length,
      rowCount: limitedData.length,
    };
  } catch (error) {
    logger.error("CSV export failed", "export", {
      error: error instanceof Error ? error.message : "Unknown error",
      options,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Export data to JSON format
 */
export async function exportToJSON(
  data: any[],
  options: ExportOptions = { format: "json" },
): Promise<ExportResult> {
  try {
    const { filename = "export.json", maxRows } = options;

    // Limit rows if specified
    const limitedData = maxRows ? data.slice(0, maxRows) : data;

    if (limitedData.length === 0) {
      return { success: false, error: "No data to export" };
    }

    const jsonContent = JSON.stringify(limitedData, null, 2);
    const buffer = Buffer.from(jsonContent, "utf-8");

    logger.info("JSON export completed", "export", {
      filename,
      rowCount: limitedData.length,
      size: buffer.length,
    });

    return {
      success: true,
      filename,
      size: buffer.length,
      rowCount: limitedData.length,
    };
  } catch (error) {
    logger.error("JSON export failed", "export", {
      error: error instanceof Error ? error.message : "Unknown error",
      options,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Export data to XLSX format
 */
export async function exportToXLSX(
  data: any[],
  options: ExportOptions = { format: "xlsx" },
): Promise<ExportResult> {
  try {
    const { filename = "export.xlsx", headers, maxRows } = options;

    // Limit rows if specified
    const limitedData = maxRows ? data.slice(0, maxRows) : data;

    if (limitedData.length === 0) {
      return { success: false, error: "No data to export" };
    }

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();

    // Prepare data for worksheet
    let worksheet: any;

    if (headers) {
      // Use specified headers
      const worksheetData = [
        headers,
        ...limitedData.map((row) => headers.map((header) => row[header] ?? "")),
      ];
      worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    } else {
      // Auto-generate from data
      worksheet = XLSX.utils.json_to_sheet(limitedData, {
        header: Object.keys(limitedData[0]),
      });
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    logger.info("XLSX export completed", "export", {
      filename,
      rowCount: limitedData.length,
      size: buffer.length,
    });

    return {
      success: true,
      filename,
      size: buffer.length,
      rowCount: limitedData.length,
    };
  } catch (error) {
    logger.error("XLSX export failed", "export", {
      error: error instanceof Error ? error.message : "Unknown error",
      options,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Export data to PDF format (placeholder - requires additional PDF library)
 */
export async function exportToPDF(
  _data: any[],
  options: ExportOptions = { format: "pdf" },
): Promise<ExportResult> {
  try {
    const { filename = "export.pdf" } = options;

    // TODO: Implement PDF export using a library like jsPDF or PDFKit
    // For now, return a placeholder implementation

    logger.warn("PDF export not fully implemented", "export", { filename });

    return {
      success: false,
      error:
        "PDF export is not yet implemented. Please use CSV, JSON, or XLSX formats.",
    };
  } catch (error) {
    logger.error("PDF export failed", "export", {
      error: error instanceof Error ? error.message : "Unknown error",
      options,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Main export function that delegates to format-specific functions
 */
export async function exportData(
  data: any[],
  options: ExportOptions,
): Promise<ExportResult> {
  const { format } = options;

  logger.info("Export started", "export", {
    format,
    dataLength: data.length,
    options: { ...options, data: undefined }, // Don't log the actual data
  });

  switch (format) {
    case "csv":
      return exportToCSV(data, options);
    case "json":
      return exportToJSON(data, options);
    case "xlsx":
      return exportToXLSX(data, options);
    case "pdf":
      return exportToPDF(data, options);
    default:
      logger.error("Unsupported export format", "export", { format });
      return {
        success: false,
        error: `Unsupported export format: ${format}`,
      };
  }
}

/**
 * Validate export options
 */
export function validateExportOptions(options: ExportOptions): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!options.format) {
    errors.push("Export format is required");
  } else if (!["csv", "json", "pdf", "xlsx"].includes(options.format)) {
    errors.push(
      "Invalid export format. Supported formats: csv, json, xlsx, pdf",
    );
  }

  if (options.maxRows && (options.maxRows < 1 || options.maxRows > 1000000)) {
    errors.push("maxRows must be between 1 and 1,000,000");
  }

  if (options.filename && !/^[a-zA-Z0-9._-]+$/.test(options.filename)) {
    errors.push("Filename contains invalid characters");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get file extension for export format
 */
export function getFileExtension(format: ExportFormat): string {
  switch (format) {
    case "csv":
      return ".csv";
    case "json":
      return ".json";
    case "xlsx":
      return ".xlsx";
    case "pdf":
      return ".pdf";
    default:
      return ".txt";
  }
}

/**
 * Process large export with progress tracking and cancellation support
 */
export async function processLargeExport(
  data: any[],
  options: ExportOptions,
  onProgress?: (progress: ExportProgress) => void,
): Promise<ExportResult> {
  const { jobId, chunkSize = 1000 } = options;

  if (!jobId) {
    return exportData(data, options);
  }

  try {
    // Check if job is cancelled before starting
    const jobStatus = await queueService.getJobStatus(jobId);
    if (jobStatus?.status === "cancelled") {
      return { success: false, error: "Export job was cancelled" };
    }

    const totalRows = data.length;
    const chunks = Math.ceil(totalRows / chunkSize);
    let processedRows = 0;

    // Update progress
    onProgress?.({
      jobId,
      progress: 0,
      status: "processing",
      message: "Starting export...",
    });

    // Process data in chunks for large exports
    if (totalRows > chunkSize) {
      const tempFiles: string[] = [];

      for (let i = 0; i < chunks; i++) {
        // Check for cancellation before each chunk
        const currentJobStatus = await queueService.getJobStatus(jobId);
        if (currentJobStatus?.status === "cancelled") {
          // Clean up temp files
          await Promise.all(
            tempFiles.map(
              (file) => fs.unlink(file).catch(() => {}), // Ignore errors
            ),
          );
          return { success: false, error: "Export job was cancelled" };
        }

        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, totalRows);
        const chunk = data.slice(start, end);

        // Process chunk
        const chunkOptions = {
          ...options,
          filename: `${options.filename || "export"}_chunk_${i}${getFileExtension(options.format)}`,
        };

        const chunkResult = await exportData(chunk, chunkOptions);
        if (!chunkResult.success || !chunkResult.filePath) {
          throw new Error(`Failed to process chunk ${i}: ${chunkResult.error}`);
        }

        tempFiles.push(chunkResult.filePath);
        processedRows += chunk.length;

        // Update progress
        const progress = Math.round((processedRows / totalRows) * 100);
        onProgress?.({
          jobId,
          progress,
          status: "processing",
          message: `Processed ${processedRows}/${totalRows} rows`,
        });
      }

      // Merge chunks if needed (for formats that support it)
      if (options.format === "csv" || options.format === "json") {
        const finalResult = await mergeExportFiles(tempFiles, options);

        // Clean up temp files
        await Promise.all(
          tempFiles.map(
            (file) => fs.unlink(file).catch(() => {}), // Ignore errors
          ),
        );

        return finalResult;
      } else {
        // For XLSX and PDF, return the last chunk (or implement proper merging)
        const lastFile = tempFiles[tempFiles.length - 1];
        const stats = await fs.stat(lastFile);

        return {
          success: true,
          filePath: lastFile,
          filename: path.basename(lastFile),
          size: stats.size,
          rowCount: totalRows,
        };
      }
    } else {
      // Small export, process normally
      return exportData(data, options);
    }
  } catch (error) {
    logger.error("Error in large export processing", "export", { jobId, error });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Merge multiple export files into one
 */
async function mergeExportFiles(
  filePaths: string[],
  options: ExportOptions,
): Promise<ExportResult> {
  const { format, filename = "merged_export" } = options;
  const outputPath = path.join(
    process.cwd(),
    "tmp",
    `${filename}${getFileExtension(format)}`,
  );

  try {
    // Ensure output directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    if (format === "csv") {
      // Merge CSV files
      let isFirstFile = true;
      let totalRows = 0;

      for (const filePath of filePaths) {
        const content = await fs.readFile(filePath, "utf-8");
        const lines = content.split("\n").filter((line) => line.trim());

        if (isFirstFile) {
          await fs.writeFile(outputPath, content);
          isFirstFile = false;
        } else {
          // Skip header for subsequent files
          const dataLines = lines.slice(1);
          if (dataLines.length > 0) {
            await fs.appendFile(outputPath, "\n" + dataLines.join("\n"));
          }
        }

        totalRows += lines.length - (isFirstFile ? 0 : 1); // Subtract header
      }

      const stats = await fs.stat(outputPath);
      return {
        success: true,
        filePath: outputPath,
        filename: path.basename(outputPath),
        size: stats.size,
        rowCount: totalRows,
      };
    } else if (format === "json") {
      // Merge JSON files
      const mergedData: any[] = [];

      for (const filePath of filePaths) {
        const content = await fs.readFile(filePath, "utf-8");
        const data = JSON.parse(content);
        mergedData.push(...(Array.isArray(data) ? data : [data]));
      }

      await fs.writeFile(outputPath, JSON.stringify(mergedData, null, 2));

      const stats = await fs.stat(outputPath);
      return {
        success: true,
        filePath: outputPath,
        filename: path.basename(outputPath),
        size: stats.size,
        rowCount: mergedData.length,
      };
    }

    throw new Error(`Merging not supported for format: ${format}`);
  } catch (error) {
    logger.error("Error merging export files", { filePaths, error });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to merge files",
    };
  }
}

/**
 * Get MIME type for export format
 */
export function getMimeType(format: ExportFormat): string {
  switch (format) {
    case "csv":
      return "text/csv";
    case "json":
      return "application/json";
    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case "pdf":
      return "application/pdf";
    default:
      return "text/plain";
  }
}
