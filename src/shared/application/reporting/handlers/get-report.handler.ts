import { QueryHandler } from '../../base/query-handler';
import { GetReportQuery } from '../queries/get-report.query';
import { IReportRepository } from '../../../domain/reporting/repositories/report-repository';
import { Report } from '../../../domain/reporting/entities/report';
import { Result } from '../../base/result';

export class GetReportHandler extends QueryHandler<GetReportQuery, Report | null> {
  constructor(private reportRepository: IReportRepository) {
    super();
  }

  async handle(query: GetReportQuery): Promise<Result<Report | null>> {
    const report = await this.reportRepository.findById(query.reportId);
    return Result.success<Report | null>(report);
  }
}
