import { injectable } from 'inversify';
import { CancelExportJobCommand } from '../commands/cancel-export-job-command';
import { ExportJob } from '../../domain/entities/export-job';
import type { IExportJobRepository } from '../../domain/repositories/export-job-repository';
import { Result } from '../../../../shared/application/base/result';
import { CommandHandler } from '../../../../shared/application/base/command-handler';
import { ValidationError } from '../../../../shared/domain/exceptions/validation-error';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { queueService } from '@/lib/services/queue';

@injectable()
export class CancelExportJobHandler extends CommandHandler<CancelExportJobCommand, ExportJob> {
  constructor(
    private readonly exportJobRepository: IExportJobRepository
  ) {
    super();
  }
  async handle(command: CancelExportJobCommand): Promise<Result<ExportJob>> {
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

    // Check if job can be cancelled
    if (!exportJob.canBeCancelled()) {
      return Result.failure(new Error(`Job cannot be cancelled in current status: ${exportJob.getStatus()}`));
    }

    // Cancel the job in the queue system if it exists
    let queueJobCancelled = false;
    const queueJobId = exportJob.getQueueJobId();
    if (queueJobId) {
      try {
        queueJobCancelled = await queueService.cancelJob(queueJobId);
      } catch (queueError) {
        console.warn('Failed to cancel queue job, proceeding with database update');
      }
    }

    // Update job status to cancelled
    exportJob.cancel();
    await this.exportJobRepository.save(exportJob);

    return Result.success(exportJob);
  }
}
