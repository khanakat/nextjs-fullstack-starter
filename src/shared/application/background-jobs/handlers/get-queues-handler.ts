import { injectable } from 'inversify';
import { QueryHandler } from '../../base/query-handler';
import { GetQueuesQuery } from '../queries/get-queues-query';
import { JobQueueService } from '../../../domain/background-jobs/services/job-queue-service';
import { JobQueueDto } from '../dtos/job-queue-dto';
import { Result } from '../../base/result';

@injectable()
export class GetQueuesHandler extends QueryHandler<GetQueuesQuery, JobQueueDto[]> {
  constructor(private readonly jobQueueService: JobQueueService) {
    super();
  }

  async handle(query: GetQueuesQuery): Promise<Result<JobQueueDto[]>> {
    return await this.handleWithValidation(query, async () => {
      const queues = query.activeOnly
        ? await this.jobQueueService.getActiveQueues()
        : await this.jobQueueService.getAllQueues();

      return queues.map(queue => new JobQueueDto(
        queue.id.getValue(),
        queue.name,
        queue.description,
        queue.defaultPriority.getValue(),
        queue.concurrency,
        queue.maxRetries,
        queue.defaultTimeout,
        queue.defaultDelay,
        queue.isActive,
        queue.isPaused,
        queue.jobCount,
        queue.completedCount,
        queue.failedCount,
        queue.pendingCount,
        queue.successRate,
        queue.createdAt.toISOString()
      ));
    });
  }
}
