import { Query } from '../../../../shared/application/base/query';
import { PaginationDto } from '../../../../shared/application/base/dto';
import { TemplateType, TemplateCategory } from '../../../../shared/domain/reporting/entities/report-template';

/**
 * Search criteria for templates query
 */
export interface TemplateSearchCriteria {
  name?: string;
  type?: TemplateType;
  category?: TemplateCategory;
  createdBy?: string;
  organizationId?: string;
  isSystem?: boolean;
  isActive?: boolean;
  tags?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
}

/**
 * Query to get multiple report templates with filtering and pagination
 */
export class GetTemplatesQuery extends Query {
  public readonly criteria: TemplateSearchCriteria;
  public readonly pagination: PaginationDto;

  constructor(
    criteria: TemplateSearchCriteria = {},
    pagination: PaginationDto = { page: 1, pageSize: 20 },
    userId?: string
  ) {
    super(userId);
    this.criteria = criteria;
    this.pagination = pagination;
    // Validate immediately so tests expecting constructor-time validation pass
    this.validate();
  }

  public validate(): void {
    super.validate();
    
    if (this.pagination.page < 1) {
      throw new Error('Page number must be greater than 0');
    }

    if (this.pagination.pageSize < 1 || this.pagination.pageSize > 100) {
      throw new Error('Page size must be between 1 and 100');
    }

    if (this.criteria.createdAfter && this.criteria.createdBefore) {
      if (this.criteria.createdAfter > this.criteria.createdBefore) {
        throw new Error('Created after date cannot be later than created before date');
      }
    }

    if (this.criteria.name && this.criteria.name.length > 200) {
      throw new Error('Name search term cannot exceed 200 characters');
    }

    if (this.criteria.tags && this.criteria.tags.length > 10) {
      throw new Error('Cannot search for more than 10 tags at once');
    }
  }
}