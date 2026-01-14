import { injectable } from 'inversify';
import { GetExportJobsQuery } from '../queries/get-export-jobs-query';
import type { IExportJobRepository } from '../../domain/repositories/export-job-repository';
import { Result } from '../../../../shared/application/base/result';
import { QueryHandler } from '../../../../shared/application/base/query-handler';
import { ValidationError } from '../../../../shared/domain/exceptions/validation-error';

export interface ExportJobsListResponse {
  jobs: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@injectable()
export class GetExportJobsHandler extends QueryHandler<GetExportJobsQuery, ExportJobsListResponse> {
  constructor(
    private readonly exportJobRepository: IExportJobRepository
  ) {
    super();
  }

  async handle(query: GetExportJobsQuery): Promise<Result<ExportJobsListResponse>> {
    // Validate input
    if (!query.props.userId || query.props.userId.trim().length === 0) {
      return Result.failure(new ValidationError('userId', 'User ID is required'));
    }

    // Get export jobs
    const result = await this.exportJobRepository.findByUserId(query.props.userId, {
      status: query.props.status,
      format: query.props.format,
      reportId: query.props.reportId,
      page: query.props.page,
      limit: query.props.limit,
      sortBy: query.props.sortBy,
      sortOrder: query.props.sortOrder,
    });

    const totalPages = Math.ceil(result.total / (query.props.limit || 10));

    return Result.success({
      jobs: result.jobs.map(job => job.toPrimitives()),
      total: result.total,
      page: query.props.page || 1,
      limit: query.props.limit || 10,
      totalPages,
    });
  }
}
