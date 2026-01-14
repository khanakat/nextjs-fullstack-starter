import { injectable } from 'inversify';
import { CommandHandler } from '../../base/command-handler';
import { CreateQueueCommand } from '../commands/create-queue-command';
import { JobQueueService } from '../../../domain/background-jobs/services/job-queue-service';
import { JobQueueDto } from '../dtos/job-queue-dto';
import { Result } from '../../base/result';

/**
 * Create Queue Handler
 * Handles creating a new job queue
 */
@injectable()
export class CreateQueueHandler extends CommandHandler<CreateQueueCommand, JobQueueDto> {
  constructor(
    private readonly jobQueueService: JobQueueService
  ) {
    super();
  }

  async handle(command: CreateQueueCommand): Promise<Result<JobQueueDto>> {
    return await this.handleWithValidation(command, async () => {
      const queue = await this.jobQueueService.createQueue(
        command.name,
        command.description,
        command.defaultPriority,
        command.concurrency,
        command.maxRetries,
        command.defaultTimeout,
        command.defaultDelay
      );

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
