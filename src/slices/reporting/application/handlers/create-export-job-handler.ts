import { injectable } from 'inversify';
import { CreateExportJobCommand } from '../commands/create-export-job-command';
import { ExportJob, ExportJobStatus } from '../../domain/entities/export-job';
import type { IExportJobRepository } from '../../domain/repositories/export-job-repository';
import { Result } from '../../../../shared/application/base/result';
import { CommandHandler } from '../../../../shared/application/base/command-handler';
import { ValidationError } from '../../../../shared/domain/exceptions/validation-error';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { queueService } from '@/lib/services/queue';

@injectable()
export class CreateExportJobHandler extends CommandHandler<CreateExportJobCommand, ExportJob> {
  constructor(
    private readonly exportJobRepository: IExportJobRepository
  ) {
    super();
  }

  async handle(command: CreateExportJobCommand): Promise<Result<ExportJob>> {
    // Validate input
    if (!command.props.reportId || command.props.reportId.trim().length === 0) {
      return Result.failure(new ValidationError('reportId', 'Report ID is required'));
    }

    if (!command.props.format) {
      return Result.failure(new ValidationError('format', 'Export format is required'));
    }

    if (!command.props.userId || command.props.userId.trim().length === 0) {
      return Result.failure(new ValidationError('userId', 'User ID is required'));
    }

    // Create export job
    const exportJob = ExportJob.create({
      reportId: command.props.reportId,
      format: command.props.format,
      status: ExportJobStatus.PENDING,
      userId: command.props.userId,
      organizationId: command.props.organizationId,
      options: command.props.options ? JSON.stringify(command.props.options) : undefined,
    });

    // Save export job
    await this.exportJobRepository.save(exportJob);

    // Queue the export job for processing
    try {
      const queueJobId = await queueService.addJob('export-job', {
        jobId: exportJob.id.toString(),
        userId: command.props.userId,
        type: command.props.format.toLowerCase(),
        reportId: command.props.reportId,
        options: command.props.options,
      });

      exportJob.setQueueJobId(queueJobId);
      await this.exportJobRepository.save(exportJob);
    } catch (queueError) {
      // Mark job as failed if queueing fails
      exportJob.markAsFailed('Failed to queue job for processing');
      await this.exportJobRepository.save(exportJob);

      return Result.failure(new Error('Failed to queue export job for processing'));
    }

    return Result.success(exportJob);
  }
}
