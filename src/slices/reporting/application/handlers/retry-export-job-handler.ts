import { injectable } from 'inversify';
import { RetryExportJobCommand } from '../commands/retry-export-job-command';
import { ExportJob } from '../../domain/entities/export-job';
import type { IExportJobRepository } from '../../domain/repositories/export-job-repository';
import { Result } from '../../../../shared/application/base/result';
import { CommandHandler } from '../../../../shared/application/base/command-handler';
import { ValidationError } from '../../../../shared/domain/exceptions/validation-error';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { queueService } from '@/lib/services/queue';

@injectable()
export class RetryExportJobHandler extends CommandHandler<RetryExportJobCommand, ExportJob> {
  constructor(
    private readonly exportJobRepository: IExportJobRepository
  ) {
    super();
  }

  async handle(command: RetryExportJobCommand): Promise<Result<ExportJob>> {
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

    // Check if job can be retried
    if (!exportJob.canBeRetried()) {
      return Result.failure(new Error(`Only failed jobs can be retried. Current status: ${exportJob.getStatus()}`));
    }

    // Reset job status
    exportJob.retry();
    await this.exportJobRepository.save(exportJob);

    // Queue the job for processing
    try {
      const queueJobId = await queueService.addJob('export-job', {
        jobId: exportJob.id.toString(),
        userId: command.props.userId,
        type: exportJob.getFormat().toLowerCase(),
        reportId: exportJob.getReportId(),
        options: exportJob.getOptions(),
      });

      exportJob.setQueueJobId(queueJobId);
      await this.exportJobRepository.save(exportJob);
    } catch (queueError) {
      return Result.failure(new Error('Failed to queue export job for retry'));
    }

    return Result.success(exportJob);
  }
}
