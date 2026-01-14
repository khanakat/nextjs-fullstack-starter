import { injectable } from 'inversify';
import { QueryHandler } from '../../base/query-handler';
import { GetJobsByQueueQuery } from '../queries/get-jobs-by-queue-query';
import { JobQueueService } from '../../../domain/background-jobs/services/job-queue-service';
import { BackgroundJobDto } from '../dtos/background-job-dto';
import { Result } from '../../base/result';

@injectable()
export class GetJobsByQueueHandler extends QueryHandler<GetJobsByQueueQuery, BackgroundJobDto[]> {
  constructor(private readonly jobQueueService: JobQueueService) {
    super();
  }

  async handle(query: GetJobsByQueueQuery): Promise<Result<BackgroundJobDto[]>> {
    return await this.handleWithValidation(query, async () => {
      const jobs = await this.jobQueueService.getJobsByQueue(query.queueName);
      return jobs.map(job => new BackgroundJobDto(
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
      ));
    });
  }
}
