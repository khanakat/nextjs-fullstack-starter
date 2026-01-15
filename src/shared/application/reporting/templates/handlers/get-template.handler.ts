import { QueryHandler } from '../../../base/query-handler';
import { GetTemplateQuery } from '../queries/get-template.query';
import { IReportTemplateRepository } from '../../../../domain/reporting/repositories/report-template-repository';
import { Result } from '../../../base/result';
import { ReportTemplate } from '../../../../domain/reporting/entities/report-template';

export class GetTemplateHandler extends QueryHandler<GetTemplateQuery, ReportTemplate | null> {
  constructor(private templateRepository: IReportTemplateRepository) {
    super();
  }

  async handle(query: GetTemplateQuery): Promise<Result<ReportTemplate | null>> {
    try {
      const template = await this.templateRepository.findById(query.templateId);

      if (!template) {
        return Result.success<ReportTemplate | null>(null);
      }

      return Result.success<ReportTemplate | null>(template);
    } catch (error) {
      return Result.failure<ReportTemplate | null>(
        error instanceof Error ? error : new Error('Failed to get template')
      );
    }
  }
}
