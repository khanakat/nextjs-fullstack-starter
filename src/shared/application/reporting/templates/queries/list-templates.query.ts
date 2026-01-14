import { Query } from '../../../base/query';
import { TemplateSearchCriteria, TemplateSearchOptions } from '../../../../domain/reporting/repositories/report-template-repository';

/**
 * List Report Templates Query
 * Query to fetch templates with filtering and pagination
 */
export class ListTemplatesQuery extends Query {
  readonly criteria: TemplateSearchCriteria;
  readonly options: TemplateSearchOptions;

  constructor(criteria: TemplateSearchCriteria = {}, options: TemplateSearchOptions = {}) {
    super();
    this.criteria = criteria;
    this.options = options;
  }
}
