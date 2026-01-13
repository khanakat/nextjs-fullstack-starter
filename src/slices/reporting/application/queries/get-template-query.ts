import { Query } from '../../../../shared/application/base/query';

/**
 * Query to get a single report template by ID
 */
export class GetTemplateQuery extends Query {
  public readonly templateId: string;

  constructor(templateId: string, userId?: string) {
    super(userId);
    this.templateId = templateId;
  }

  public validate(): void {
    super.validate();
    
    if (!this.templateId || this.templateId.trim().length === 0) {
      throw new Error('Template ID is required');
    }
  }
}