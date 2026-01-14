import { QueryHandler } from '../../query-handler.base';
import { ListReportsQuery } from '../queries/list-reports.query';
import { IReportRepository } from '../../../domain/reporting/repositories/report-repository';
import { Report } from '../../../domain/reporting/entities/report';
import { Result } from '../../base/result';

export class ListReportsHandler implements QueryHandler<ListReportsQuery, Result<{ reports: Report[]; total: number }>> {
  constructor(private reportRepository: IReportRepository) {}

  async handle(query: ListReportsQuery): Promise<Result<{ reports: Report[]; total: number }>> {
    return this.reportRepository.search({
      userId: query.userId,
      organizationId: query.organizationId,
      status: query.status,
      page: query.page,
      limit: query.limit,
    });
  }
}
