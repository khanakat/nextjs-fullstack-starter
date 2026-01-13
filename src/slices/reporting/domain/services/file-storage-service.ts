/**
 * Interface for file storage services in the reporting domain
 */
export interface IFileStorageService {
  /**
   * Upload a file to storage
   */
  uploadFile(
    fileName: string,
    fileContent: Buffer | string,
    contentType: string,
    folder?: string
  ): Promise<string>;

  /**
   * Download a file from storage
   */
  downloadFile(fileUrl: string): Promise<Buffer>;

  /**
   * Delete a file from storage
   */
  deleteFile(fileUrl: string): Promise<void>;

  /**
   * Get file information
   */
  getFileInfo(fileUrl: string): Promise<{
    size: number;
    contentType: string;
    lastModified: Date;
    exists: boolean;
  }>;

  /**
   * Generate a signed URL for temporary access
   */
  generateSignedUrl(
    fileUrl: string,
    expirationMinutes?: number
  ): Promise<string>;

  /**
   * List files in a folder
   */
  listFiles(folder?: string, limit?: number): Promise<{
    files: Array<{
      key: string;
      url: string;
      size: number;
      lastModified: Date;
    }>;
    hasMore: boolean;
  }>;

  /**
   * Copy a file to a new location
   */
  copyFile(sourceUrl: string, destinationKey: string): Promise<string>;

  /**
   * Move a file to a new location
   */
  moveFile(sourceUrl: string, destinationKey: string): Promise<string>;

  /**
   * Get storage usage statistics
   */
  getStorageUsage(folder?: string): Promise<{
    totalFiles: number;
    totalSize: number;
    folders: Array<{
      name: string;
      fileCount: number;
      size: number;
    }>;
  }>;

  /**
   * Clean up old files
   */
  cleanupOldFiles(olderThanDays: number, folder?: string): Promise<{
    deletedFiles: number;
    freedSpace: number;
  }>;
}