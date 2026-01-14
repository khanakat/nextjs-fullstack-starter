import { injectable } from 'inversify';
import { QueryHandler } from '../../base/query-handler';
import { GetQueueStatisticsQuery } from '../queries/get-queue-statistics-query';
import { JobQueueService } from '../../../domain/background-jobs/services/job-queue-service';
import { Result } from '../../base/result';

@injectable()
export class GetQueueStatisticsHandler extends QueryHandler<GetQueueStatisticsQuery, any> {
  constructor(private readonly jobQueueService: JobQueueService) {
    super();
  }

  async handle(query: GetQueueStatisticsQuery): Promise<Result<any>> {
    return await this.handleWithValidation(query, async () => {
      const stats = await this.jobQueueService.getQueueStatistics(query.queueName);
      return stats;
    });
  }
}
