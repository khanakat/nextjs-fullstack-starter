import { Query } from '../../../../shared/application/base/query';
import { PaginationDto } from '../../../../shared/application/base/dto';
import { ReportStatus } from '../../../../shared/domain/reporting/entities/report';

/**
 * Search criteria for reports query
 */
export interface ReportSearchCriteria {
  title?: string;
  status?: ReportStatus;
  createdBy?: string;
  organizationId?: string;
  templateId?: string;
  isPublic?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  publishedAfter?: Date;
  publishedBefore?: Date;
  tags?: string[];
}

/**
 * Query to get multiple reports with filtering and pagination
 */
export class GetReportsQuery extends Query {
  public readonly criteria: ReportSearchCriteria;
  public readonly pagination: PaginationDto;

  constructor(
    criteria: ReportSearchCriteria = {},
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

    if (this.criteria.publishedAfter && this.criteria.publishedBefore) {
      if (this.criteria.publishedAfter > this.criteria.publishedBefore) {
        throw new Error('Published after date cannot be later than published before date');
      }
    }

    if (this.criteria.title && this.criteria.title.length > 200) {
      throw new Error('Title search term cannot exceed 200 characters');
    }

    if (this.criteria.tags && this.criteria.tags.length > 10) {
      throw new Error('Cannot search for more than 10 tags at once');
    }
  }
}