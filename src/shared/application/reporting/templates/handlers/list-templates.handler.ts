import { QueryHandler } from '../../../base/query-handler';
import { ListTemplatesQuery } from '../queries/list-templates.query';
import { IReportTemplateRepository } from '../../../../domain/reporting/repositories/report-template-repository';
import { Result } from '../../../base/result';

export class ListTemplatesHandler implements QueryHandler<ListTemplatesQuery, any> {
  constructor(private templateRepository: IReportTemplateRepository) {}

  async handle(query: ListTemplatesQuery): Promise<Result<any>> {
    try {
      const result = await this.templateRepository.search(
        query.criteria,
        query.options
      );

      return Result.success<any>(result);
    } catch (error) {
      return Result.failure<any>(
        error instanceof Error ? error.message : 'Failed to list templates'
      );
    }
  }
}
