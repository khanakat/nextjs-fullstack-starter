import { injectable } from 'inversify';
import { DeleteExportJobCommand } from '../commands/delete-export-job-command';
import { ExportJob } from '../../domain/entities/export-job';
import type { IExportJobRepository } from '../../domain/repositories/export-job-repository';
import { Result } from '../../../../shared/application/base/result';
import { CommandHandler } from '../../../../shared/application/base/command-handler';
import { ValidationError } from '../../../../shared/domain/exceptions/validation-error';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { FileStorageService } from '@/lib/services/file-storage-service';

@injectable()
export class DeleteExportJobHandler extends CommandHandler<DeleteExportJobCommand, { success: boolean }> {
  constructor(
    private readonly exportJobRepository: IExportJobRepository
  ) {
    super();
  }

  async handle(command: DeleteExportJobCommand): Promise<Result<{ success: boolean }>> {
    // Validate input
    if (!command.props.jobId || command.props.jobId.trim().length === 0) {
      return Result.failure(new ValidationError('jobId', 'Job ID is required'));
    }

    if (!command.props.userId || command.props.userId.trim().length === 0) {
      return Result.failure(new ValidationError('userId', 'User ID is required'));
    }

    // Find the export job
    const exportJob = await this.exportJobRepository.findById(
      UniqueId.create(command.props.jobId)
    );

    if (!exportJob) {
      return Result.failure(new Error('Export job not found'));
    }

    // Check if user owns the job
    if (exportJob.getUserId() !== command.props.userId) {
      return Result.failure(new Error('Access denied'));
    }

    // Check if job can be deleted
    if (!exportJob.canBeDeleted()) {
      return Result.failure(new Error('Cannot delete export job in current status'));
    }

    // Delete file from storage if it exists
    const filePath = exportJob.getFilePath();
    if (filePath) {
      try {
        await FileStorageService.deleteFile(filePath);
      } catch (error) {
        console.warn('Failed to delete file from storage:', error);
      }
    }

    // Delete the export job
    await this.exportJobRepository.delete(exportJob.id);

    return Result.success({ success: true });
  }
}
