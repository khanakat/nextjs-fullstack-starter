import { QueryHandler } from '../../../base/query-handler';
import { GetTemplateQuery } from '../queries/get-template.query';
import { IReportTemplateRepository } from '../../../../domain/reporting/repositories/report-template-repository';
import { Result } from '../../../base/result';

export class GetTemplateHandler implements QueryHandler<GetTemplateQuery, any> {
  constructor(private templateRepository: IReportTemplateRepository) {}

  async handle(query: GetTemplateQuery): Promise<Result<any>> {
    try {
      const template = await this.templateRepository.findById(query.templateId);

      if (!template) {
        return Result.success<any>(null);
      }

      return Result.success<any>(template);
    } catch (error) {
      return Result.failure<any>(
        error instanceof Error ? error.message : 'Failed to get template'
      );
    }
  }
}
