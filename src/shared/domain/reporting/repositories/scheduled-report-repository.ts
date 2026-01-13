import { UniqueId } from '../../value-objects/unique-id';
import { ScheduledReport, ScheduleFrequency, ScheduledReportStatus, DeliveryMethod } from '../entities/scheduled-report';

export interface ScheduledReportSearchCriteria {
  name?: string;
  reportId?: UniqueId;
  status?: ScheduledReportStatus;
  frequency?: ScheduleFrequency;
  deliveryMethod?: DeliveryMethod;
  createdBy?: UniqueId;
  organizationId?: UniqueId;
  createdAfter?: Date;
  createdBefore?: Date;
  nextExecutionBefore?: Date;
  nextExecutionAfter?: Date;
  hasHighFailureRate?: boolean;
}

export interface ScheduledReportSearchOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'nextExecutionAt' | 'executionCount';
  sortOrder?: 'asc' | 'desc';
}

export interface ScheduledReportSearchResult {
  scheduledReports: ScheduledReport[];
  total: number;
  hasMore: boolean;
}

/**
 * Repository interface for ScheduledReport aggregate
 * Defines data access operations for scheduled reports
 */
export interface IScheduledReportRepository {
  /**
   * Save a scheduled report (create or update)
   */
  save(scheduledReport: ScheduledReport): Promise<void>;

  /**
   * Find a scheduled report by its unique identifier
   */
  findById(id: UniqueId): Promise<ScheduledReport | null>;

  /**
   * Find scheduled reports by multiple IDs
   */
  findByIds(ids: UniqueId[]): Promise<ScheduledReport[]>;

  /**
   * Find scheduled reports by creator
   */
  findByCreator(createdBy: UniqueId, options?: ScheduledReportSearchOptions): Promise<ScheduledReportSearchResult>;

  /**
   * Find scheduled reports by organization
   */
  findByOrganization(organizationId: UniqueId, options?: ScheduledReportSearchOptions): Promise<ScheduledReportSearchResult>;

  /**
   * Find scheduled reports by report ID
   */
  findByReportId(reportId: UniqueId, options?: ScheduledReportSearchOptions): Promise<ScheduledReportSearchResult>;

  /**
   * Find scheduled reports by status
   */
  findByStatus(status: ScheduledReportStatus, options?: ScheduledReportSearchOptions): Promise<ScheduledReportSearchResult>;

  /**
   * Find active scheduled reports
   */
  findActiveReports(options?: ScheduledReportSearchOptions): Promise<ScheduledReportSearchResult>;

  /**
   * Find scheduled reports that are due for execution
   */
  findDueReports(asOf?: Date): Promise<ScheduledReport[]>;

  /**
   * Find scheduled reports by frequency
   */
  findByFrequency(frequency: ScheduleFrequency, options?: ScheduledReportSearchOptions): Promise<ScheduledReportSearchResult>;

  /**
   * Find scheduled reports by delivery method
   */
  findByDeliveryMethod(method: DeliveryMethod, options?: ScheduledReportSearchOptions): Promise<ScheduledReportSearchResult>;

  /**
   * Search scheduled reports with complex criteria
   */
  search(criteria: ScheduledReportSearchCriteria, options?: ScheduledReportSearchOptions): Promise<ScheduledReportSearchResult>;

  /**
   * Find scheduled reports with high failure rates
   */
  findHighFailureRateReports(threshold?: number): Promise<ScheduledReport[]>;

  /**
   * Find scheduled reports that haven't executed recently
   */
  findStaleReports(staleSince: Date): Promise<ScheduledReport[]>;

  /**
   * Count scheduled reports by criteria
   */
  count(criteria?: ScheduledReportSearchCriteria): Promise<number>;

  /**
   * Check if a scheduled report exists by ID
   */
  exists(id: UniqueId): Promise<boolean>;

  /**
   * Check if a scheduled report with the same name exists for a user/organization
   */
  existsByName(name: string, createdBy: UniqueId, organizationId?: UniqueId): Promise<boolean>;

  /**
   * Delete a scheduled report (soft delete - mark as inactive)
   */
  delete(id: UniqueId): Promise<void>;

  /**
   * Permanently delete a scheduled report (hard delete)
   */
  permanentlyDelete(id: UniqueId): Promise<void>;

  /**
   * Get scheduled reports for a specific time window (for execution planning)
   */
  getReportsForTimeWindow(startTime: Date, endTime: Date): Promise<ScheduledReport[]>;

  /**
   * Get execution history for a scheduled report (paginated slice)
   */
  getExecutionHistory(scheduledReportId: UniqueId, limit?: number, offset?: number): Promise<{
    executedAt: Date;
    success: boolean;
    errorMessage?: string;
    executionDuration?: number;
  }[]>;

  /**
   * Get total execution run count for a scheduled report
   */
  getExecutionHistoryTotalCount(scheduledReportId: UniqueId): Promise<number>;

  /**
   * Update execution statistics after a report run
   */
  updateExecutionStats(
    scheduledReportId: UniqueId, 
    success: boolean, 
    executionTime: Date,
    duration?: number,
    errorMessage?: string
  ): Promise<void>;

  /**
   * Bulk update scheduled reports (for batch operations)
   */
  bulkUpdate(scheduledReports: ScheduledReport[]): Promise<void>;

  /**
   * Get scheduled report statistics for analytics
   */
  getScheduledReportStatistics(organizationId?: UniqueId): Promise<{
    totalScheduledReports: number;
    activeScheduledReports: number;
    pausedScheduledReports: number;
    inactiveScheduledReports: number;
    scheduledReportsThisMonth: number;
    scheduledReportsThisWeek: number;
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
    executionsToday: number;
    executionsThisWeek: number;
    executionsThisMonth: number;
  }>;

  /**
   * Get next execution times for all active scheduled reports
   */
  getUpcomingExecutions(limit?: number, organizationId?: UniqueId): Promise<{
    scheduledReportId: string;
    name: string;
    nextExecutionAt: Date;
    frequency: ScheduleFrequency;
  }[]>;

  /**
   * Find scheduled reports that need maintenance (high failure rate, stale, etc.)
   */
  findReportsNeedingMaintenance(): Promise<{
    highFailureRate: ScheduledReport[];
    staleReports: ScheduledReport[];
    neverExecuted: ScheduledReport[];
  }>;

  /**
   * Get delivery statistics by method
   */
  getDeliveryStatistics(organizationId?: UniqueId): Promise<{
    email: number;
    webhook: number;
    download: number;
  }>;

  /**
   * Find scheduled reports by recipient email (for email delivery method)
   */
  findByRecipientEmail(email: string): Promise<ScheduledReport[]>;

  /**
   * Get frequency distribution of scheduled reports
   */
  getFrequencyDistribution(organizationId?: UniqueId): Promise<{
    daily: number;
    weekly: number;
    monthly: number;
    quarterly: number;
    yearly: number;
  }>;
}