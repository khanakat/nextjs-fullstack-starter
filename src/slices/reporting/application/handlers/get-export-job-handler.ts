import { injectable } from 'inversify';
import { GetExportJobQuery } from '../queries/get-export-job-query';
import { ExportJob } from '../../domain/entities/export-job';
import type { IExportJobRepository } from '../../domain/repositories/export-job-repository';
import { Result } from '../../../../shared/application/base/result';
import { QueryHandler } from '../../../../shared/application/base/query-handler';
import { ValidationError } from '../../../../shared/domain/exceptions/validation-error';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';

@injectable()
export class GetExportJobHandler extends QueryHandler<GetExportJobQuery, ExportJob> {
  constructor(
    private readonly exportJobRepository: IExportJobRepository
  ) {
    super();
  }

  async handle(query: GetExportJobQuery): Promise<Result<ExportJob>> {
    // Validate input
    if (!query.props.jobId || query.props.jobId.trim().length === 0) {
      return Result.failure(new ValidationError('jobId', 'Job ID is required'));
    }

    if (!query.props.userId || query.props.userId.trim().length === 0) {
      return Result.failure(new ValidationError('userId', 'User ID is required'));
    }

    // Find the export job
    const exportJob = await this.exportJobRepository.findById(
      UniqueId.create(query.props.jobId)
    );

    if (!exportJob) {
      return Result.failure(new Error('Export job not found'));
    }

    // Check if user owns the job
    if (exportJob.getUserId() !== query.props.userId) {
      return Result.failure(new Error('Access denied'));
    }

    return Result.success(exportJob);
  }
}
