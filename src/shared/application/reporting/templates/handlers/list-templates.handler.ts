import { QueryHandler } from '../../../base/query-handler';
import { ListTemplatesQuery } from '../queries/list-templates.query';
import { IReportTemplateRepository, TemplateSearchResult } from '../../../../domain/reporting/repositories/report-template-repository';
import { Result } from '../../../base/result';

export class ListTemplatesHandler extends QueryHandler<ListTemplatesQuery, TemplateSearchResult> {
  constructor(private templateRepository: IReportTemplateRepository) {
    super();
  }

  async handle(query: ListTemplatesQuery): Promise<Result<TemplateSearchResult>> {
    try {
      const result = await this.templateRepository.search(
        query.criteria,
        query.options
      );

      return Result.success(result);
    } catch (error) {
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to list templates')
      );
    }
  }
}
