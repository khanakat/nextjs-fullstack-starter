import { Query } from '../../../../shared/application/base/query';
import { PaginationDto } from '../../../../shared/application/base/dto';
import { ReportFrequency } from '../../../../shared/domain/reporting/entities/scheduled-report';

/**
 * Search criteria for scheduled reports query
 */
export interface ScheduledReportSearchCriteria {
  name?: string;
  reportId?: string;
  frequency?: ReportFrequency;
  isActive?: boolean;
  createdBy?: string;
  organizationId?: string;
  nextExecutionAfter?: Date;
  nextExecutionBefore?: Date;
  lastExecutionAfter?: Date;
  lastExecutionBefore?: Date;
  createdAfter?: Date;
  createdBefore?: Date;
}

/**
 * Query to get multiple scheduled reports with filtering and pagination
 */
export class GetScheduledReportsQuery extends Query {
  public readonly criteria: ScheduledReportSearchCriteria;
  public readonly pagination: PaginationDto;

  constructor(
    criteria: ScheduledReportSearchCriteria = {},
    pagination: PaginationDto = { page: 1, pageSize: 20 },
    userId?: string
  ) {
    super(userId);
    this.criteria = criteria;
    this.pagination = pagination;
    // Run validation on construction to satisfy tests expecting constructor throws
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

    if (this.criteria.nextExecutionAfter && this.criteria.nextExecutionBefore) {
      if (this.criteria.nextExecutionAfter > this.criteria.nextExecutionBefore) {
        throw new Error('Next execution after date cannot be later than next execution before date');
      }
    }

    if (this.criteria.lastExecutionAfter && this.criteria.lastExecutionBefore) {
      if (this.criteria.lastExecutionAfter > this.criteria.lastExecutionBefore) {
        throw new Error('Last execution after date cannot be later than last execution before date');
      }
    }

    if (this.criteria.createdAfter && this.criteria.createdBefore) {
      if (this.criteria.createdAfter > this.criteria.createdBefore) {
        throw new Error('Created after date cannot be later than created before date');
      }
    }

    if (this.criteria.name && this.criteria.name.length > 200) {
      throw new Error('Name search term cannot exceed 200 characters');
    }
  }
}