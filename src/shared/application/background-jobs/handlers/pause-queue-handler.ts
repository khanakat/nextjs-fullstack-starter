import { injectable } from 'inversify';
import { CommandHandler } from '../../base/command-handler';
import { PauseQueueCommand } from '../commands/pause-queue-command';
import { JobQueueService } from '../../../domain/background-jobs/services/job-queue-service';
import { JobQueueDto } from '../dtos/job-queue-dto';
import { Result } from '../../base/result';

@injectable()
export class PauseQueueHandler extends CommandHandler<PauseQueueCommand, JobQueueDto> {
  constructor(private readonly jobQueueService: JobQueueService) {
    super();
  }

  async handle(command: PauseQueueCommand): Promise<Result<JobQueueDto>> {
    return await this.handleWithValidation(command, async () => {
      await this.jobQueueService.pauseQueue(command.queueName);
      const queue = await this.jobQueueService.getQueue(command.queueName);
      if (!queue) {
        throw new Error('Queue not found after pausing');
      }

      return new JobQueueDto(
        queue.id.getValue(),
        queue.name,
        queue.createdAt.toISOString(),
        queue.defaultPriority.getValue(),
        queue.concurrency,
        queue.maxRetries,
        queue.isActive,
        queue.isPaused,
        queue.jobCount,
        queue.completedCount,
        queue.failedCount,
        queue.pendingCount,
        queue.successRate,
        queue.description,
        queue.defaultTimeout,
        queue.defaultDelay
      );
    });
  }
}
