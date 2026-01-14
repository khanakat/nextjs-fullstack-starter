import { injectable } from 'inversify';
import { DownloadExportFileQuery } from '../queries/download-export-file-query';
import { ExportJob, ExportJobStatus } from '../../domain/entities/export-job';
import type { IExportJobRepository } from '../../domain/repositories/export-job-repository';
import { Result } from '../../../../shared/application/base/result';
import { QueryHandler } from '../../../../shared/application/base/query-handler';
import { ValidationError } from '../../../../shared/domain/exceptions/validation-error';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { FileStorageService } from '@/lib/services/file-storage-service';
import { promises as fs } from 'fs';

export interface DownloadExportFileResponse {
  filePath: string;
  fileName: string;
  contentType: string;
  fileSize?: number;
}

@injectable()
export class DownloadExportFileHandler extends QueryHandler<DownloadExportFileQuery, DownloadExportFileResponse> {
  constructor(
    private readonly exportJobRepository: IExportJobRepository
  ) {
    super();
  }

  async handle(query: DownloadExportFileQuery): Promise<Result<DownloadExportFileResponse>> {
    // Validate input
    if (!query.props.jobId || query.props.jobId.trim().length === 0) {
      return Result.failure(new ValidationError('jobId', 'Job ID is required'));
    }

    if (!query.props.userId || query.props.userId.trim().length === 0) {
      return Result.failure(new ValidationError('userId', 'User ID is required'));
    }

    // Find the export job
    const exportJob = await this.exportJobRepository.findById(
      UniqueId.create(query.props.jobId)
    );

    if (!exportJob) {
      return Result.failure(new Error('Export job not found'));
    }

    // Check if user owns the job
    if (exportJob.getUserId() !== query.props.userId) {
      return Result.failure(new Error('Access denied'));
    }

    // Check if job is completed and has a file
    if (exportJob.getStatus() !== ExportJobStatus.COMPLETED || !exportJob.getFileUrl()) {
      return Result.failure(new Error('File not available for download'));
    }

    // Check if file has expired (if completedAt is more than 24 hours ago)
    const completedAt = exportJob.getCompletedAt();
    if (completedAt) {
      const expiryTime = 24 * 60 * 60 * 1000; // 24 hours
      if (new Date().getTime() - completedAt.getTime() > expiryTime) {
        return Result.failure(new Error('File has expired'));
      }
    }

    // Get file path
    let filePath = exportJob.getFilePath();

    if (!filePath) {
      return Result.failure(new Error('File path not found'));
    }

    // Check if file exists
    const fileInfo = await FileStorageService.getFileInfo(filePath);
    if (!fileInfo.exists) {
      return Result.failure(new Error('File not found'));
    }

    // Generate appropriate filename and content type
    const contentType = this.getContentType(exportJob.getFormat());
    const fileName = `export_${exportJob.getReportId()}_${this.getFileExtension(exportJob.getFormat())}`;

    return Result.success({
      filePath,
      fileName,
      contentType,
      fileSize: exportJob.getFileSize(),
    });
  }

  private getContentType(format: string): string {
    switch (format) {
      case 'PDF':
        return 'application/pdf';
      case 'EXCEL':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'CSV':
        return 'text/csv';
      case 'PNG':
        return 'image/png';
      case 'JSON':
        return 'application/json';
      case 'HTML':
        return 'text/html';
      default:
        return 'application/octet-stream';
    }
  }

  private getFileExtension(format: string): string {
    switch (format) {
      case 'PDF':
        return 'pdf';
      case 'EXCEL':
        return 'xlsx';
      case 'CSV':
        return 'csv';
      case 'PNG':
        return 'png';
      case 'JSON':
        return 'json';
      case 'HTML':
        return 'html';
      default:
        return 'bin';
    }
  }
}
