import { injectable } from 'inversify';
import { QueryHandler } from '../../base/query-handler';
import { GetQueueQuery } from '../queries/get-queue-query';
import { JobQueueService } from '../../../domain/background-jobs/services/job-queue-service';
import { JobQueueDto } from '../dtos/job-queue-dto';
import { Result } from '../../base/result';

@injectable()
export class GetQueueHandler extends QueryHandler<GetQueueQuery, JobQueueDto> {
  constructor(private readonly jobQueueService: JobQueueService) {
    super();
  }

  async handle(query: GetQueueQuery): Promise<Result<JobQueueDto>> {
    return await this.handleWithValidation(query, async () => {
      const queue = await this.jobQueueService.getQueue(query.queueName);
      if (!queue) {
        throw new Error('Queue not found');
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
