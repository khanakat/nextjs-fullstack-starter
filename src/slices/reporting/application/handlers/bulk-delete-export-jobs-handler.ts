import { injectable } from 'inversify';
import { BulkDeleteExportJobsCommand } from '../../commands/bulk-delete-export-jobs-command';
import { ExportJob, ExportJobStatus } from '../../domain/entities/export-job';
import type { IExportJobRepository } from '../../domain/repositories/export-job-repository';
import { Result } from '@/shared/application/base';
import { CommandHandler } from '@/shared/application/base';
import { ValidationError } from '@/shared/domain/exceptions/validation-error';
import { UniqueId } from '@/shared/domain/value-objects/unique-id';
import { queueService } from '@/lib/services/queue';
import { FileStorageService } from '@/lib/services/file-storage-service';

@injectable()
export class BulkDeleteExportJobsHandler extends CommandHandler<BulkDeleteExportJobsCommand, { deletedCount: number; requestedCount: number }> {
  constructor(
    private readonly exportJobRepository: IExportJobRepository
  ) {
    super();
  }

  async handle(command: BulkDeleteExportJobsCommand): Promise<Result<{ deletedCount: number; requestedCount: number }>> {
    // Validate input
    if (!command.props.jobIds || command.props.jobIds.length === 0) {
      return Result.failure(new ValidationError('jobIds', 'At least one job ID is required'));
    }

    if (!command.props.userId || command.props.userId.trim().length === 0) {
      return Result.failure(new ValidationError('userId', 'User ID is required'));
    }

    // Find all jobs that belong to the user
    const jobIds = command.props.jobIds.map(id => UniqueId.create(id));
    const jobsToDelete: ExportJob[] = [];

    for (const jobId of jobIds) {
      const job = await this.exportJobRepository.findById(jobId);
      if (job && job.getUserId() === command.props.userId) {
        jobsToDelete.push(job);
      }
    }

    if (jobsToDelete.length === 0) {
      return Result.failure(new Error('No jobs found or access denied'));
    }

    // Cancel any running/pending jobs before deletion
    const jobsToCancel = jobsToDelete.filter(job =>
      [ExportJobStatus.PENDING, ExportJobStatus.PROCESSING].includes(job.getStatus())
    );

    for (const job of jobsToCancel) {
      try {
        if (job.canBeCancelled()) {
          job.cancel();
        }
        const queueJobId = job.getQueueJobId();
        if (queueJobId) {
          await queueService.cancelJob(queueJobId);
        }
        await this.exportJobRepository.save(job);
      } catch (error) {
        console.warn('Failed to cancel job during bulk delete:', error);
      }
    }

    // Delete files from storage
    const filePaths: string[] = [];
    for (const job of jobsToDelete) {
      const filePath = job.getFilePath();
      if (filePath) {
        filePaths.push(filePath);
      }
    }

    if (filePaths.length > 0) {
      try {
        await FileStorageService.deleteFiles(filePaths);
      } catch (error) {
        console.warn('Failed to delete some files from storage:', error);
      }
    }

    // Delete the jobs
    const deletedCount = await this.exportJobRepository.deleteMany(jobIds);

    return Result.success({
      deletedCount,
      requestedCount: command.props.jobIds.length,
    });
  }
}
