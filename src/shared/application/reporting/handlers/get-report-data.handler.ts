import { QueryHandler } from '../../query-handler.base';
import { GetReportDataQuery } from '../queries/get-report-data.query';
import { IReportRepository } from '../../../domain/reporting/repositories/report-repository';
import { Report } from '../../../domain/reporting/entities/report';
import { Result } from '../../base/result';

export class GetReportDataHandler implements QueryHandler<GetReportDataQuery, Result<any>> {
  constructor(private reportRepository: IReportRepository) {}

  async handle(query: GetReportDataQuery): Promise<Result<any>> {
    const reportResult = await this.reportRepository.findById(query.reportId);

    if (reportResult.isFailure || !reportResult.value) {
      return Result.failure<any>(reportResult.error || 'Report not found');
    }

    const report = reportResult.value;
    const data = {
      reportId: report.id.id,
      data: report.content,
      format: query.format,
      generatedAt: new Date().toISOString(),
    };

    return Result.success<any>(data);
  }
}
