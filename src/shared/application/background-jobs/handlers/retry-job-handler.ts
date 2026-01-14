import { injectable } from 'inversify';
import { CommandHandler } from '../../base/command-handler';
import { RetryJobCommand } from '../commands/retry-job-command';
import { JobQueueService } from '../../../domain/background-jobs/services/job-queue-service';
import { BackgroundJobDto } from '../dtos/background-job-dto';
import { Result } from '../../base/result';

@injectable()
export class RetryJobHandler extends CommandHandler<RetryJobCommand, BackgroundJobDto> {
  constructor(private readonly jobQueueService: JobQueueService) {
    super();
  }

  async handle(command: RetryJobCommand): Promise<Result<BackgroundJobDto>> {
    return await this.handleWithValidation(command, async () => {
      const job = await this.jobQueueService.retryJob(command.jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      return new BackgroundJobDto(
        job.id.getValue(),
        job.name,
        job.queueName,
        job.status.getValue(),
        job.priority.getValue(),
        job.data,
        job.createdAt.toISOString(),
        job.result,
        job.error,
        job.delay,
        job.timeout,
        job.startedAt?.toISOString(),
        job.completedAt?.toISOString(),
        job.failedAt?.toISOString(),
        job.nextRetryAt?.toISOString(),
        job.progress,
        job.attempts,
        job.maxAttempts
      );
    });
  }
}
