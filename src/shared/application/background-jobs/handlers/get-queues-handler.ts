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
    try {
      const queues = query.activeOnly
        ? await this.jobQueueService.getActiveQueues()
        : await this.jobQueueService.getAllQueues();

      return Result.success(queues.map((queue): JobQueueDto => new JobQueueDto(
        queue.id.getValue(),
        queue.name,
        queue.createdAt.toISOString(),
        queue.defaultPriority.getValue(),
        queue.concurrency || 1,
        queue.maxRetries || 3,
        queue.isActive,
        queue.isPaused || false,
        queue.jobCount || 0,
        queue.completedCount || 0,
        queue.failedCount || 0,
        queue.pendingCount || 0,
        queue.successRate || 0,
        queue.description || "",
        queue.defaultTimeout,
        queue.defaultDelay
      )));
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
