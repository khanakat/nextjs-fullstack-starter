import { QueryHandler } from '../../base';
import { GetReportDataQuery } from '../queries/get-report-data.query';
import { IReportRepository } from '../../../domain/reporting/repositories/report-repository';
import { Report } from '../../../domain/reporting/entities/report';
import { Result } from '../../base/result';

export class GetReportDataHandler extends QueryHandler<GetReportDataQuery, any> {
  constructor(private reportRepository: IReportRepository) {
    super();
  }

  async handle(query: GetReportDataQuery): Promise<Result<any>> {
    const report = await this.reportRepository.findById(query.reportId);

    if (!report) {
      return Result.failure<any>(new Error('Report not found'));
    }

    const data = {
      // @ts-ignore - id property exists on Report
      reportId: report.id.id,
      data: report.content,
      format: query.format,
      generatedAt: new Date().toISOString(),
    };

    return Result.success<any>(data);
  }
}
