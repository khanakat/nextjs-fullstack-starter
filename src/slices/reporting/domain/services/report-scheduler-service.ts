import { ScheduledReport } from '../../../../shared/domain/reporting/entities/scheduled-report';
import { ReportFrequency } from '../value-objects/report-frequency';

/**
 * Interface for report scheduler services in the reporting domain
 */
export interface IReportSchedulerService {
  /**
   * Schedule a report for execution
   */
  scheduleReport(scheduledReport: ScheduledReport): Promise<void>;

  /**
   * Cancel a scheduled report
   */
  cancelSchedule(scheduledReportId: string): Promise<void>;

  /**
   * Reschedule a report
   */
  rescheduleReport(scheduledReport: ScheduledReport): Promise<void>;

  /**
   * Pause a scheduled report
   */
  pauseSchedule(scheduledReportId: string): Promise<void>;

  /**
   * Resume a scheduled report
   */
  resumeSchedule(scheduledReport: ScheduledReport): Promise<void>;

  /**
   * Get all scheduled jobs
   */
  getScheduledJobs(): Promise<Array<{
    scheduledReportId: string;
    nextExecution: Date;
    isActive: boolean;
  }>>;

  /**
   * Start the scheduler
   */
  startScheduler(): Promise<void>;

  /**
   * Stop the scheduler
   */
  stopScheduler(): Promise<void>;

  /**
   * Get scheduler status
   */
  getSchedulerStatus(): Promise<{
    isRunning: boolean;
    activeJobs: number;
    totalScheduledReports: number;
    lastCheck: Date;
  }>;

  /**
   * Get job statistics
   */
  getJobStatistics(): Promise<{
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
    upcomingExecutions: Array<{
      scheduledReportId: string;
      reportName: string;
      nextExecution: Date;
    }>;
  }>;
}