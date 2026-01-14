import { QueryHandler } from '../../query-handler.base';
import { GetReportQuery } from '../queries/get-report.query';
import { IReportRepository } from '../../../domain/reporting/repositories/report-repository';
import { Report } from '../../../domain/reporting/entities/report';
import { Result } from '../../base/result';

export class GetReportHandler implements QueryHandler<GetReportQuery, Report | null> {
  constructor(private reportRepository: IReportRepository) {}

  async handle(query: GetReportQuery): Promise<Result<Report | null>> {
    return this.reportRepository.findById(query.reportId);
  }
}
