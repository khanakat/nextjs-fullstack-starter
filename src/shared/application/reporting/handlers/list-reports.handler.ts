import { QueryHandler } from '../../base/query-handler';
import { ListReportsQuery } from '../queries/list-reports.query';
import { IReportRepository } from '../../../domain/reporting/repositories/report-repository';
import { Report } from '../../../domain/reporting/entities/report';
import { Result } from '../../base/result';

export class ListReportsHandler extends QueryHandler<ListReportsQuery, { reports: Report[]; total: number }> {
  constructor(private reportRepository: IReportRepository) {
    super();
  }

  async handle(query: ListReportsQuery): Promise<Result<{ reports: Report[]; total: number }>> {
    const result = await this.reportRepository.search({
      organizationId: query.organizationId,
      status: query.status as any,
      
    });
    
    return Result.success(result);
  }
}
