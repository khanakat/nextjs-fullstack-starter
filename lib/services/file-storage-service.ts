// import { logger } from "@/lib/logger";
import { promises as fs } from "fs";
import * as path from "path";

// Mock logger
const logger = {
  info: (message: string, context?: string, data?: any) => console.log(message, context, data),
  error: (message: string, context?: string, error?: any) => console.error(message, context, error),
  warn: (message: string, context?: string, data?: any) => console.warn(message, context, data),
  debug: (message: string, context?: string, data?: any) => console.log(message, context, data)
};

export interface FileStorageConfig {
  baseDir: string;
  maxFileSize: number; // in bytes
  allowedExtensions: string[];
}

/**
 * Simple file storage service for managing export files
 * TODO: Replace with cloud storage (AWS S3, Google Cloud Storage, etc.) for production
 */
export class FileStorageService {
  private static config: FileStorageConfig = {
    baseDir: path.join(process.cwd(), "storage", "exports"),
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedExtensions: [".pdf", ".csv", ".xlsx", ".json", ".png"],
  };

  /**
   * Initialize storage directory
   */
  static async init(): Promise<void> {
    try {
      await fs.mkdir(this.config.baseDir, { recursive: true });
      logger.info("File storage initialized", "file-storage", {
        baseDir: this.config.baseDir,
      });
    } catch (error) {
      logger.error("Failed to initialize file storage", "file-storage", error);
      throw error;
    }
  }

  /**
   * Store file and return file path
   */
  static async storeFile(
    fileName: string,
    content: Buffer | string,
    userId: string,
  ): Promise<string> {
    try {
      // Create user-specific directory
      const userDir = path.join(this.config.baseDir, userId);
      await fs.mkdir(userDir, { recursive: true });

      // Generate unique filename
      const timestamp = Date.now();
      const ext = path.extname(fileName);
      const baseName = path.basename(fileName, ext);
      const uniqueFileName = `${baseName}_${timestamp}${ext}`;
      const filePath = path.join(userDir, uniqueFileName);

      // Validate file extension
      if (!this.config.allowedExtensions.includes(ext.toLowerCase())) {
        throw new Error(`File extension ${ext} not allowed`);
      }

      // Validate file size
      const fileSize = Buffer.isBuffer(content)
        ? content.length
        : Buffer.byteLength(content);
      if (fileSize > this.config.maxFileSize) {
        throw new Error(
          `File size ${fileSize} exceeds maximum allowed size ${this.config.maxFileSize}`,
        );
      }

      // Write file
      await fs.writeFile(filePath, content);

      logger.info("File stored successfully", "file-storage", {
        fileName: uniqueFileName,
        filePath,
        fileSize,
        userId,
      });

      return filePath;
    } catch (error) {
      logger.error("Failed to store file", "file-storage", error);
      throw error;
    }
  }

  /**
   * Delete file from storage
   */
  static async deleteFile(filePath: string): Promise<boolean> {
    try {
      // Ensure file is within our storage directory for security
      const normalizedPath = path.normalize(filePath);
      const normalizedBaseDir = path.normalize(this.config.baseDir);

      if (!normalizedPath.startsWith(normalizedBaseDir)) {
        logger.error(
          "Attempted to delete file outside storage directory",
          "file-storage",
        );
        return false;
      }

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        logger.warn("File not found for deletion", "file-storage", {
          filePath,
        });
        return false;
      }

      // Delete file
      await fs.unlink(filePath);

      logger.info("File deleted successfully", "file-storage", {
        filePath,
      });

      return true;
    } catch (error) {
      logger.error("Failed to delete file", "file-storage", error);
      return false;
    }
  }

  /**
   * Delete multiple files
   */
  static async deleteFiles(filePaths: string[]): Promise<{
    deleted: string[];
    failed: string[];
  }> {
    const deleted: string[] = [];
    const failed: string[] = [];

    for (const filePath of filePaths) {
      const success = await this.deleteFile(filePath);
      if (success) {
        deleted.push(filePath);
      } else {
        failed.push(filePath);
      }
    }

    logger.info("Bulk file deletion completed", "file-storage", {
      totalRequested: filePaths.length,
      deleted: deleted.length,
      failed: failed.length,
    });

    return { deleted, failed };
  }

  /**
   * Get file info
   */
  static async getFileInfo(filePath: string): Promise<{
    exists: boolean;
    size?: number;
    createdAt?: Date;
    modifiedAt?: Date;
  }> {
    try {
      const stats = await fs.stat(filePath);
      return {
        exists: true,
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
      };
    } catch {
      return { exists: false };
    }
  }

  /**
   * Clean up old files (older than specified days)
   */
  static async cleanupOldFiles(olderThanDays: number = 7): Promise<{
    cleaned: number;
    errors: number;
  }> {
    let cleaned = 0;
    let errors = 0;
    const cutoffDate = new Date(
      Date.now() - olderThanDays * 24 * 60 * 60 * 1000,
    );

    try {
      const cleanupDir = async (dirPath: string): Promise<void> => {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);

          if (entry.isDirectory()) {
            await cleanupDir(fullPath);
          } else if (entry.isFile()) {
            try {
              const stats = await fs.stat(fullPath);
              if (stats.mtime < cutoffDate) {
                await fs.unlink(fullPath);
                cleaned++;
              }
            } catch (error) {
              logger.error("Error cleaning up file", "file-storage", error);
              errors++;
            }
          }
        }
      };

      await cleanupDir(this.config.baseDir);

      logger.info("File cleanup completed", "file-storage", {
        cleaned,
        errors,
        olderThanDays,
        cutoffDate,
      });
    } catch (error) {
      logger.error("Failed to cleanup old files", "file-storage", error);
      errors++;
    }

    return { cleaned, errors };
  }

  /**
   * Get storage statistics
   */
  static async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    userCounts: Record<string, number>;
  }> {
    let totalFiles = 0;
    let totalSize = 0;
    const userCounts: Record<string, number> = {};

    try {
      const calculateStats = async (
        dirPath: string,
        isUserDir = false,
      ): Promise<void> => {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);

          if (entry.isDirectory()) {
            if (isUserDir) {
              userCounts[entry.name] = 0;
            }
            await calculateStats(fullPath, !isUserDir);
          } else if (entry.isFile()) {
            const stats = await fs.stat(fullPath);
            totalFiles++;
            totalSize += stats.size;

            if (isUserDir) {
              const userId = path.basename(path.dirname(fullPath));
              userCounts[userId] = (userCounts[userId] || 0) + 1;
            }
          }
        }
      };

      await calculateStats(this.config.baseDir);
    } catch (error) {
      logger.error("Failed to calculate storage stats", "file-storage", error);
    }

    return {
      totalFiles,
      totalSize,
      userCounts,
    };
  }

  /**
   * Extract file path from download URL
   */
  static async extractFilePathFromUrl(
    downloadUrl: string,
  ): Promise<string | null> {
    try {
      // Assuming download URLs follow pattern: /api/export-jobs/{id}/download
      // and files are stored with job ID as filename
      const url = new URL(downloadUrl, "http://localhost");
      const pathParts = url.pathname.split("/");
      const jobId = pathParts[pathParts.indexOf("export-jobs") + 1];

      if (jobId) {
        // Search for files containing the job ID in their name
        // This is a simplified approach - in a real implementation, you'd maintain a mapping
        return await this.findFileByJobId(jobId);
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Find file by job ID (searches through storage directory)
   */
  private static async findFileByJobId(jobId: string): Promise<string | null> {
    try {
      const searchInDir = async (dirPath: string): Promise<string | null> => {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);

          if (entry.isDirectory()) {
            const found = await searchInDir(fullPath);
            if (found) return found;
          } else if (entry.isFile() && entry.name.includes(jobId)) {
            return fullPath;
          }
        }

        return null;
      };

      return await searchInDir(this.config.baseDir);
    } catch (error) {
      logger.error("Error searching for file by job ID", "file-storage", error);
      return null;
    }
  }

  /**
   * Store export file with job ID reference
   */
  static async storeExportFile(
    jobId: string,
    fileName: string,
    content: Buffer | string,
    userId: string,
  ): Promise<string> {
    try {
      // Create user-specific directory
      const userDir = path.join(this.config.baseDir, userId);
      await fs.mkdir(userDir, { recursive: true });

      // Generate filename with job ID for easy lookup
      const ext = path.extname(fileName);
      const baseName = path.basename(fileName, ext);
      const exportFileName = `export_${jobId}_${baseName}${ext}`;
      const filePath = path.join(userDir, exportFileName);

      // Validate file extension
      if (!this.config.allowedExtensions.includes(ext.toLowerCase())) {
        throw new Error(`File extension ${ext} not allowed`);
      }

      // Validate file size
      const fileSize = Buffer.isBuffer(content)
        ? content.length
        : Buffer.byteLength(content);
      if (fileSize > this.config.maxFileSize) {
        throw new Error(
          `File size ${fileSize} exceeds maximum allowed size ${this.config.maxFileSize}`,
        );
      }

      // Write file
      await fs.writeFile(filePath, content);

      logger.info("Export file stored successfully", "file-storage", {
        jobId,
        fileName: exportFileName,
        filePath,
        fileSize,
        userId,
      });

      return filePath;
    } catch (error) {
      logger.error("Failed to store export file", "file-storage", error);
      throw error;
    }
  }
}

// Initialize storage on module load
FileStorageService.init().catch((error) => {
  console.error("Failed to initialize file storage service:", error);
});
