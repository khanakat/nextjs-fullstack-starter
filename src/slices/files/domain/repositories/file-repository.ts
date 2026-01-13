import { File } from '../entities/file';
import { FileId } from '../value-objects/file-id';

/**
 * File Repository Interface
 * Defines contract for file data access
 */
export interface IFileRepository {
  /**
   * Save a new file
   */
  create(file: File): Promise<File>;

  /**
   * Find file by ID
   */
  findById(id: FileId): Promise<File | null>;

  /**
   * Find multiple files by IDs
   */
  findByIds(ids: FileId[]): Promise<File[]>;

  /**
   * Find files by user ID
   */
  findByUserId(userId: string): Promise<File[]>;

  /**
   * Find files by user ID with pagination
   */
  findByUserIdPaginated(
    userId: string,
    limit: number,
    offset: number
  ): Promise<{ files: File[]; total: number }>;

  /**
   * Find files by MIME type
   */
  findByMimeType(mimeType: string): Promise<File[]>;

  /**
   * Find files by user ID and MIME type
   */
  findByUserIdAndMimeType(userId: string, mimeType: string): Promise<File[]>;

  /**
   * Find files by user ID and size range
   */
  findByUserIdAndSizeRange(
    userId: string,
    minSize?: number,
    maxSize?: number
  ): Promise<File[]>;

  /**
   * Find files by user ID and date range
   */
  findByUserIdAndDateRange(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<File[]>;

  /**
   * Search files by filename
   */
  searchByFilename(userId: string, searchTerm: string): Promise<File[]>;

  /**
   * Update file URL
   */
  updateUrl(id: FileId, url: string): Promise<File>;

  /**
   * Delete file by ID
   */
  delete(id: FileId): Promise<void>;

  /**
   * Delete multiple files by IDs
   */
  deleteMany(ids: FileId[]): Promise<void>;

  /**
   * Delete files by user ID
   */
  deleteByUserId(userId: string): Promise<void>;

  /**
   * Get total file count for a user
   */
  countByUserId(userId: string): Promise<number>;

  /**
   * Get total file size for a user
   */
  getTotalSizeByUserId(userId: string): Promise<number>;

  /**
   * Get file statistics
   */
  getStatistics(userId: string): Promise<{
    totalFiles: number;
    totalSize: number;
    byType: Record<string, number>;
  }>;
}
