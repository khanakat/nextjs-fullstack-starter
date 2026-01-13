import { UniqueId } from '../../value-objects/unique-id';
import { Report, ReportStatus } from '../entities/report';

export interface ReportSearchCriteria {
  title?: string;
  status?: ReportStatus;
  createdBy?: UniqueId;
  organizationId?: UniqueId;
  templateId?: UniqueId;
  isPublic?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  publishedAfter?: Date;
  publishedBefore?: Date;
  tags?: string[];
}

export interface ReportSearchOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'publishedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ReportSearchResult {
  reports: Report[];
  total: number;
  hasMore: boolean;
}

/**
 * Repository interface for Report aggregate
 * Defines data access operations for reports
 */
export interface IReportRepository {
  /**
   * Save a report (create or update)
   */
  save(report: Report): Promise<void>;

  /**
   * Find a report by its unique identifier
   */
  findById(id: UniqueId): Promise<Report | null>;

  /**
   * Find reports by multiple IDs
   */
  findByIds(ids: UniqueId[]): Promise<Report[]>;

  /**
   * Find reports by creator
   */
  findByCreator(createdBy: UniqueId, options?: ReportSearchOptions): Promise<ReportSearchResult>;

  /**
   * Find reports by organization
   */
  findByOrganization(organizationId: UniqueId, options?: ReportSearchOptions): Promise<ReportSearchResult>;

  /**
   * Find reports by template
   */
  findByTemplate(templateId: UniqueId, options?: ReportSearchOptions): Promise<ReportSearchResult>;

  /**
   * Find public reports
   */
  findPublicReports(options?: ReportSearchOptions): Promise<ReportSearchResult>;

  /**
   * Search reports with complex criteria
   */
  search(criteria: ReportSearchCriteria, options?: ReportSearchOptions): Promise<ReportSearchResult>;

  /**
   * Find reports by status
   */
  findByStatus(status: ReportStatus, options?: ReportSearchOptions): Promise<ReportSearchResult>;

  /**
   * Find reports that need to be archived (old unpublished drafts)
   */
  findReportsForArchival(olderThan: Date): Promise<Report[]>;

  /**
   * Count reports by criteria
   */
  count(criteria?: ReportSearchCriteria): Promise<number>;

  /**
   * Check if a report exists by ID
   */
  exists(id: UniqueId): Promise<boolean>;

  /**
   * Check if a report with the same title exists for a user/organization
   */
  existsByTitle(title: string, createdBy: UniqueId, organizationId?: UniqueId): Promise<boolean>;

  /**
   * Delete a report (soft delete - mark as archived)
   */
  delete(id: UniqueId): Promise<void>;

  /**
   * Permanently delete a report (hard delete)
   */
  permanentlyDelete(id: UniqueId): Promise<void>;

  /**
   * Get reports that are frequently accessed (for caching optimization)
   */
  getPopularReports(limit?: number): Promise<Report[]>;

  /**
   * Get recently created reports
   */
  getRecentReports(limit?: number, organizationId?: UniqueId): Promise<Report[]>;

  /**
   * Get reports created from a specific template
   */
  getReportsByTemplate(templateId: UniqueId, limit?: number): Promise<Report[]>;

  /**
   * Bulk update reports (for batch operations)
   */
  bulkUpdate(reports: Report[]): Promise<void>;

  /**
   * Get report statistics for analytics
   */
  getReportStatistics(organizationId?: UniqueId): Promise<{
    totalReports: number;
    publishedReports: number;
    draftReports: number;
    archivedReports: number;
    reportsThisMonth: number;
    reportsThisWeek: number;
  }>;
}