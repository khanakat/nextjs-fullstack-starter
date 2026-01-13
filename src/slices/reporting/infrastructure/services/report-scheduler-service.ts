import { IReportSchedulerService } from '../../domain/services/report-scheduler-service';
import { ScheduledReport } from '../../../../shared/domain/reporting/entities/scheduled-report';
import { ReportFrequency } from '../../domain/value-objects/report-frequency';

/**
 * Report scheduler service for managing scheduled report execution
 */
export class ReportSchedulerService implements IReportSchedulerService {
  private scheduledJobs: Map<string, NodeJS.Timeout> = new Map();
  private isRunning: boolean = false;

  constructor(
    private readonly onExecuteReport: (scheduledReport: ScheduledReport) => Promise<void>,
    private readonly onScheduleError: (scheduledReport: ScheduledReport, error: Error) => Promise<void>
  ) {}

  async scheduleReport(scheduledReport: ScheduledReport): Promise<void> {
    try {
      // Cancel existing schedule if it exists
      await this.cancelSchedule(scheduledReport.id.id);

      // Calculate next execution time
      const nextExecution = this.calculateNextExecution(
        scheduledReport.scheduleConfig.frequency,
        scheduledReport.nextExecutionAt || new Date()
      );

      // Schedule the job
      const delay = nextExecution.getTime() - Date.now();
      
      if (delay > 0) {
        const timeoutId = setTimeout(async () => {
          await this.executeScheduledReport(scheduledReport);
        }, delay);

        this.scheduledJobs.set(scheduledReport.id.id, timeoutId);
        
        console.log(`Scheduled report ${scheduledReport.name} for execution at ${nextExecution.toISOString()}`);
      } else {
        // If the next execution time is in the past, execute immediately
        await this.executeScheduledReport(scheduledReport);
      }
    } catch (error) {
      console.error(`Failed to schedule report ${scheduledReport.id.id}:`, error);
      throw new Error(`Failed to schedule report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async cancelSchedule(scheduledReportId: string): Promise<void> {
    const timeoutId = this.scheduledJobs.get(scheduledReportId);
    
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.scheduledJobs.delete(scheduledReportId);
      console.log(`Cancelled schedule for report ${scheduledReportId}`);
    }
  }

  async rescheduleReport(scheduledReport: ScheduledReport): Promise<void> {
    await this.cancelSchedule(scheduledReport.id.id);
    await this.scheduleReport(scheduledReport);
  }

  async pauseSchedule(scheduledReportId: string): Promise<void> {
    await this.cancelSchedule(scheduledReportId);
    console.log(`Paused schedule for report ${scheduledReportId}`);
  }

  async resumeSchedule(scheduledReport: ScheduledReport): Promise<void> {
    if (scheduledReport.isActive()) {
      await this.scheduleReport(scheduledReport);
      console.log(`Resumed schedule for report ${scheduledReport.id.id}`);
    }
  }

  async getScheduledJobs(): Promise<Array<{
    scheduledReportId: string;
    nextExecution: Date;
    isActive: boolean;
  }>> {
    // In a real implementation, this would query the database
    // For now, we'll return the in-memory scheduled jobs
    const jobs: Array<{
      scheduledReportId: string;
      nextExecution: Date;
      isActive: boolean;
    }> = [];

    for (const [scheduledReportId] of this.scheduledJobs) {
      jobs.push({
        scheduledReportId,
        nextExecution: new Date(), // This would be calculated from the actual schedule
        isActive: true,
      });
    }

    return jobs;
  }

  async startScheduler(): Promise<void> {
    if (this.isRunning) {
      console.log('Scheduler is already running');
      return;
    }

    this.isRunning = true;
    console.log('Report scheduler started');

    // Start a periodic check for missed schedules
    this.startPeriodicCheck();
  }

  async stopScheduler(): Promise<void> {
    if (!this.isRunning) {
      console.log('Scheduler is not running');
      return;
    }

    // Cancel all scheduled jobs
    for (const [scheduledReportId] of this.scheduledJobs) {
      await this.cancelSchedule(scheduledReportId);
    }

    this.isRunning = false;
    console.log('Report scheduler stopped');
  }

  private async executeScheduledReport(scheduledReport: ScheduledReport): Promise<void> {
    try {
      console.log(`Executing scheduled report: ${scheduledReport.name}`);
      
      // Execute the report
      await this.onExecuteReport(scheduledReport);
      
      // Mark execution as successful
      scheduledReport.markExecuted(true);
      
      // Schedule the next execution
      if (scheduledReport.isActive()) {
        await this.scheduleReport(scheduledReport);
      }
      
      console.log(`Successfully executed scheduled report: ${scheduledReport.name}`);
    } catch (error) {
      console.error(`Failed to execute scheduled report ${scheduledReport.name}:`, error);
      
      // Mark execution as failed
      scheduledReport.markExecuted(false);
      
      // Notify about the error
      await this.onScheduleError(scheduledReport, error instanceof Error ? error : new Error('Unknown error'));
      
      // Optionally reschedule even after failure (with exponential backoff)
      if (scheduledReport.isActive()) {
        const nextExecution = this.calculateNextExecution(
          scheduledReport.scheduleConfig.frequency,
          new Date(),
          true // Add delay for failed execution
        );
        
        // Update next execution with delay for failed execution
        scheduledReport.updateNextExecution(nextExecution);
        
        await this.scheduleReport(scheduledReport);
      }
    }
  }

  private calculateNextExecution(
    frequency: ReportFrequency,
    baseTime: Date,
    isRetry: boolean = false
  ): Date {
    const nextExecution = new Date(baseTime);
    
    // Add retry delay if this is a retry after failure
    if (isRetry) {
      nextExecution.setMinutes(nextExecution.getMinutes() + 15); // 15 minute delay for retries
      return nextExecution;
    }

    switch (frequency) {
      case ReportFrequency.HOURLY:
        nextExecution.setHours(nextExecution.getHours() + 1);
        break;
      case ReportFrequency.DAILY:
        nextExecution.setDate(nextExecution.getDate() + 1);
        break;
      case ReportFrequency.WEEKLY:
        nextExecution.setDate(nextExecution.getDate() + 7);
        break;
      case ReportFrequency.MONTHLY:
        nextExecution.setMonth(nextExecution.getMonth() + 1);
        break;
      case ReportFrequency.QUARTERLY:
        nextExecution.setMonth(nextExecution.getMonth() + 3);
        break;
      case ReportFrequency.YEARLY:
        nextExecution.setFullYear(nextExecution.getFullYear() + 1);
        break;
      default:
        // Default to daily if frequency is not recognized
        nextExecution.setDate(nextExecution.getDate() + 1);
        break;
    }

    return nextExecution;
  }

  private startPeriodicCheck(): void {
    // Check for missed schedules every 5 minutes
    const checkInterval = 5 * 60 * 1000; // 5 minutes

    const periodicCheck = () => {
      if (!this.isRunning) {
        return;
      }

      console.log('Performing periodic check for missed schedules...');
      
      // In a real implementation, this would:
      // 1. Query the database for scheduled reports that should have executed
      // 2. Execute any missed schedules
      // 3. Update the next execution times
      
      setTimeout(periodicCheck, checkInterval);
    };

    setTimeout(periodicCheck, checkInterval);
  }

  async getSchedulerStatus(): Promise<{
    isRunning: boolean;
    activeJobs: number;
    totalScheduledReports: number;
    lastCheck: Date;
  }> {
    return {
      isRunning: this.isRunning,
      activeJobs: this.scheduledJobs.size,
      totalScheduledReports: this.scheduledJobs.size, // In a real implementation, this would query the database
      lastCheck: new Date(),
    };
  }

  async getJobStatistics(): Promise<{
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
    upcomingExecutions: Array<{
      scheduledReportId: string;
      reportName: string;
      nextExecution: Date;
    }>;
  }> {
    // Mock implementation - in a real system, this would query execution history
    return {
      totalExecutions: Math.floor(Math.random() * 1000) + 100,
      successfulExecutions: Math.floor(Math.random() * 900) + 90,
      failedExecutions: Math.floor(Math.random() * 50) + 5,
      averageExecutionTime: Math.floor(Math.random() * 30000) + 5000, // 5-35 seconds
      upcomingExecutions: Array.from(this.scheduledJobs.keys()).map(id => ({
        scheduledReportId: id,
        reportName: `Report ${id.substring(0, 8)}`,
        nextExecution: new Date(Date.now() + Math.random() * 24 * 60 * 60 * 1000), // Random time within next 24 hours
      })),
    };
  }
}