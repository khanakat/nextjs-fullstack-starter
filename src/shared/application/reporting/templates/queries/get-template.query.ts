import { Query } from '../../../base/query';
import { UniqueId } from '../../../../domain/value-objects/unique-id';

/**
 * Get Report Template Query
 * Query to fetch a single template by ID
 */
export class GetTemplateQuery extends Query {
  readonly templateId: UniqueId;

  constructor(templateId: string) {
    super();
    this.templateId = UniqueId.create(templateId);
  }
}
