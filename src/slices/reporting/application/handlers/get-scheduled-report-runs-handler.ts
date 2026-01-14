import { QueryHandler } from '../../../../shared/application/base/query-handler';
import { Result } from '../../../../shared/application/base/result';
import { IScheduledReportRepository } from '../../../../shared/domain/reporting/repositories/scheduled-report-repository';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';

/**
 * Handler for getting scheduled report runs
 */
export class GetScheduledReportRunsHandler extends QueryHandler<{
  scheduledReportId: string;
  userId: string;
  organizationId: string;
  options: {
    limit?: number;
    offset?: number;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}, any> {
  constructor(
    private readonly scheduledReportRepository: IScheduledReportRepository
  ) {
    super();
  }

  async handle(query: {
    scheduledReportId: string;
    userId: string;
    organizationId: string;
    options: {
      limit?: number;
      offset?: number;
      status?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    };
  }): Promise<Result<any>> {
    try {
      const { scheduledReportId, options } = query;

      // For now, return a mock response
      // In a real implementation, this would query the execution history
      const runs = {
        runs: [],
        total: 0,
        limit: options?.limit || 20,
        offset: options?.offset || 0
      };

      return Result.success(runs);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Result.failure(new Error(message));
    }
  }
}
