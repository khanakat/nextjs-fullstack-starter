import { injectable } from 'inversify';
import { CommandHandler } from '../../base/command-handler';
import { CreateJobCommand } from '../commands/create-job-command';
import { JobQueueService } from '../../../domain/background-jobs/services/job-queue-service';
import { BackgroundJobDto } from '../dtos/background-job-dto';
import { Result } from '../../base/result';

@injectable()
export class CreateJobHandler extends CommandHandler<CreateJobCommand, BackgroundJobDto> {
  constructor(private readonly jobQueueService: JobQueueService) {
    super();
  }

  async handle(command: CreateJobCommand): Promise<Result<BackgroundJobDto>> {
    return await this.handleWithValidation(command, async () => {
      const job = await this.jobQueueService.addJob(
        command.queueName,
        command.jobName,
        command.data,
        command.priority,
        command.delay,
        command.timeout
      );

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
