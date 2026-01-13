import { ReportSchedulerService } from '../../../../../slices/reporting/infrastructure/services/report-scheduler-service';
import { ScheduledReport } from '../../../../../shared/domain/reporting/entities/scheduled-report';
import { ReportFrequency } from '../../../../../shared/domain/reporting/entities/scheduled-report';
import { ReportId } from '../../../../../shared/domain/reporting/value-objects/report-id';
import { UserId } from '../../../../../shared/domain/users/value-objects/user-id';
import { OrganizationId } from '../../../../../shared/domain/organizations/value-objects/organization-id';

// Mock timers
jest.useFakeTimers();

describe('ReportSchedulerService', () => {
  let service: ReportSchedulerService;
  let mockOnExecuteReport: jest.Mock;
  let mockOnScheduleError: jest.Mock;
  let mockScheduledReport: ScheduledReport;

  beforeEach(() => {
    mockOnExecuteReport = jest.fn().mockResolvedValue(undefined);
    mockOnScheduleError = jest.fn().mockResolvedValue(undefined);
    
    service = new ReportSchedulerService(mockOnExecuteReport, mockOnScheduleError);

    // Create mock scheduled report
    mockScheduledReport = ScheduledReport.create(
      ReportId.create('report-123'),
      'Test Scheduled Report',
      'A test scheduled report',
      ReportFrequency.DAILY,
      new Date(Date.now() + 60000), // 1 minute from now
      true,
      UserId.create('user-123'),
      OrganizationId.create('org-123'),
      {
        format: 'PDF',
        includeCharts: true,
        includeData: true,
      }
    );

    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('scheduleReport', () => {
    it('should schedule a report for future execution', async () => {
      const futureDate = new Date(Date.now() + 60000); // 1 minute from now
      const scheduledReport = ScheduledReport.create(
        ReportId.create('report-future'),
        'Future Report',
        'A future report',
        ReportFrequency.DAILY,
        futureDate,
        true,
        UserId.create('user-123'),
        OrganizationId.create('org-123')
      );

      await service.scheduleReport(scheduledReport);

      // Verify that a timeout was set
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 60000);
      expect(mockOnExecuteReport).not.toHaveBeenCalled();
    });

    it('should execute report immediately if next execution is in the past', async () => {
      const pastDate = new Date(Date.now() - 60000); // 1 minute ago
      const scheduledReport = ScheduledReport.create(
        ReportId.create('report-past'),
        'Past Report',
        'A past report',
        ReportFrequency.DAILY,
        pastDate,
        true,
        UserId.create('user-123'),
        OrganizationId.create('org-123')
      );

      await service.scheduleReport(scheduledReport);

      expect(mockOnExecuteReport).toHaveBeenCalledWith(scheduledReport);
    });

    it('should cancel existing schedule before creating new one', async () => {
      // Schedule first report
      await service.scheduleReport(mockScheduledReport);
      const firstTimeoutCall = (setTimeout as jest.Mock).mock.calls.length;

      // Schedule same report again
      await service.scheduleReport(mockScheduledReport);
      const secondTimeoutCall = (setTimeout as jest.Mock).mock.calls.length;

      // Should have called clearTimeout and setTimeout again
      expect(clearTimeout).toHaveBeenCalled();
      expect(secondTimeoutCall).toBeGreaterThan(firstTimeoutCall);
    });

    it('should handle scheduling errors', async () => {
      const invalidReport = {
        ...mockScheduledReport,
        id: null, // Invalid ID to cause error
      } as any;

      await expect(service.scheduleReport(invalidReport)).rejects.toThrow('Failed to schedule report');
    });

    it('should schedule weekly reports correctly', async () => {
      const weeklyReport = ScheduledReport.create(
        ReportId.create('report-weekly'),
        'Weekly Report',
        'A weekly report',
        ReportFrequency.WEEKLY,
        new Date(Date.now() + 604800000), // 1 week from now
        true,
        UserId.create('user-123'),
        OrganizationId.create('org-123')
      );

      await service.scheduleReport(weeklyReport);

      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 604800000);
    });

    it('should schedule monthly reports correctly', async () => {
      const monthlyReport = ScheduledReport.create(
        ReportId.create('report-monthly'),
        'Monthly Report',
        'A monthly report',
        ReportFrequency.MONTHLY,
        new Date(Date.now() + 2592000000), // 30 days from now
        true,
        UserId.create('user-123'),
        OrganizationId.create('org-123')
      );

      await service.scheduleReport(monthlyReport);

      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 2592000000);
    });
  });

  describe('cancelSchedule', () => {
    it('should cancel an existing schedule', async () => {
      await service.scheduleReport(mockScheduledReport);
      
      await service.cancelSchedule(mockScheduledReport.id.value);

      expect(clearTimeout).toHaveBeenCalled();
    });

    it('should handle canceling non-existent schedule', async () => {
      await expect(service.cancelSchedule('non-existent-id')).resolves.not.toThrow();
    });

    it('should remove job from scheduled jobs map', async () => {
      await service.scheduleReport(mockScheduledReport);
      
      const jobsBefore = await service.getScheduledJobs();
      expect(jobsBefore).toHaveLength(1);

      await service.cancelSchedule(mockScheduledReport.id.value);
      
      const jobsAfter = await service.getScheduledJobs();
      expect(jobsAfter).toHaveLength(0);
    });
  });

  describe('rescheduleReport', () => {
    it('should reschedule an existing report', async () => {
      await service.scheduleReport(mockScheduledReport);
      const initialTimeoutCalls = (setTimeout as jest.Mock).mock.calls.length;

      await service.rescheduleReport(mockScheduledReport);

      expect(clearTimeout).toHaveBeenCalled();
      expect((setTimeout as jest.Mock).mock.calls.length).toBeGreaterThan(initialTimeoutCalls);
    });

    it('should handle rescheduling non-existent report', async () => {
      await expect(service.rescheduleReport(mockScheduledReport)).resolves.not.toThrow();
    });
  });

  describe('pauseSchedule', () => {
    it('should pause an active schedule', async () => {
      await service.scheduleReport(mockScheduledReport);
      
      await service.pauseSchedule(mockScheduledReport.id.value);

      expect(clearTimeout).toHaveBeenCalled();
    });

    it('should handle pausing non-existent schedule', async () => {
      await expect(service.pauseSchedule('non-existent-id')).resolves.not.toThrow();
    });
  });

  describe('resumeSchedule', () => {
    it('should resume a paused schedule', async () => {
      await service.scheduleReport(mockScheduledReport);
      await service.pauseSchedule(mockScheduledReport.id.value);
      
      const initialTimeoutCalls = (setTimeout as jest.Mock).mock.calls.length;
      await service.resumeSchedule(mockScheduledReport);

      expect((setTimeout as jest.Mock).mock.calls.length).toBeGreaterThan(initialTimeoutCalls);
    });

    it('should handle resuming non-paused schedule', async () => {
      await expect(service.resumeSchedule(mockScheduledReport)).resolves.not.toThrow();
    });
  });

  describe('getScheduledJobs', () => {
    it('should return empty array when no jobs are scheduled', async () => {
      const jobs = await service.getScheduledJobs();
      expect(jobs).toEqual([]);
    });

    it('should return scheduled jobs information', async () => {
      await service.scheduleReport(mockScheduledReport);
      
      const jobs = await service.getScheduledJobs();
      
      expect(jobs).toHaveLength(1);
      expect(jobs[0]).toEqual({
        scheduledReportId: mockScheduledReport.id.value,
        nextExecution: expect.any(Date),
        isActive: true,
      });
    });

    it('should return multiple scheduled jobs', async () => {
      const secondReport = ScheduledReport.create(
        ReportId.create('report-456'),
        'Second Report',
        'Another report',
        ReportFrequency.WEEKLY,
        new Date(Date.now() + 120000), // 2 minutes from now
        true,
        UserId.create('user-456'),
        OrganizationId.create('org-456')
      );

      await service.scheduleReport(mockScheduledReport);
      await service.scheduleReport(secondReport);
      
      const jobs = await service.getScheduledJobs();
      
      expect(jobs).toHaveLength(2);
      expect(jobs.map(job => job.scheduledReportId)).toContain(mockScheduledReport.id.value);
      expect(jobs.map(job => job.scheduledReportId)).toContain(secondReport.id.value);
    });
  });

  describe('startScheduler', () => {
    it('should start the scheduler', async () => {
      await service.startScheduler();
      
      const status = await service.getSchedulerStatus();
      expect(status.isRunning).toBe(true);
    });

    it('should handle starting already running scheduler', async () => {
      await service.startScheduler();
      await expect(service.startScheduler()).resolves.not.toThrow();
    });

    it('should start periodic check when scheduler starts', async () => {
      await service.startScheduler();
      
      // Verify that setInterval was called for periodic checks
      expect(setInterval).toHaveBeenCalled();
    });
  });

  describe('stopScheduler', () => {
    it('should stop the scheduler', async () => {
      await service.startScheduler();
      await service.stopScheduler();
      
      const status = await service.getSchedulerStatus();
      expect(status.isRunning).toBe(false);
    });

    it('should cancel all scheduled jobs when stopping', async () => {
      await service.scheduleReport(mockScheduledReport);
      await service.startScheduler();
      
      await service.stopScheduler();
      
      const jobs = await service.getScheduledJobs();
      expect(jobs).toHaveLength(0);
    });

    it('should handle stopping already stopped scheduler', async () => {
      await expect(service.stopScheduler()).resolves.not.toThrow();
    });
  });

  describe('executeScheduledReport', () => {
    it('should execute report and call onExecuteReport callback', async () => {
      // Trigger execution by advancing timers
      await service.scheduleReport(mockScheduledReport);
      
      // Fast-forward time to trigger execution
      jest.advanceTimersByTime(60000);
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(mockOnExecuteReport).toHaveBeenCalledWith(mockScheduledReport);
    });

    it('should handle execution errors and call onScheduleError callback', async () => {
      mockOnExecuteReport.mockRejectedValueOnce(new Error('Execution failed'));
      
      await service.scheduleReport(mockScheduledReport);
      
      // Fast-forward time to trigger execution
      jest.advanceTimersByTime(60000);
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(mockOnScheduleError).toHaveBeenCalledWith(
        mockScheduledReport,
        expect.any(Error)
      );
    });

    it('should reschedule report after successful execution', async () => {
      await service.scheduleReport(mockScheduledReport);
      
      // Fast-forward time to trigger execution
      jest.advanceTimersByTime(60000);
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Should schedule next execution
      expect(setTimeout).toHaveBeenCalledTimes(2); // Initial + reschedule
    });
  });

  describe('getSchedulerStatus', () => {
    it('should return correct scheduler status when stopped', async () => {
      const status = await service.getSchedulerStatus();
      
      expect(status).toEqual({
        isRunning: false,
        activeJobs: 0,
        totalScheduledReports: 0,
        lastCheck: expect.any(Date),
      });
    });

    it('should return correct scheduler status when running with jobs', async () => {
      await service.startScheduler();
      await service.scheduleReport(mockScheduledReport);
      
      const status = await service.getSchedulerStatus();
      
      expect(status).toEqual({
        isRunning: true,
        activeJobs: 1,
        totalScheduledReports: 1,
        lastCheck: expect.any(Date),
      });
    });
  });

  describe('getJobStatistics', () => {
    it('should return job statistics', async () => {
      const stats = await service.getJobStatistics();
      
      expect(stats).toEqual({
        totalExecutions: expect.any(Number),
        successfulExecutions: expect.any(Number),
        failedExecutions: expect.any(Number),
        averageExecutionTime: expect.any(Number),
        upcomingExecutions: expect.any(Array),
      });
    });

    it('should include upcoming executions in statistics', async () => {
      await service.scheduleReport(mockScheduledReport);
      
      const stats = await service.getJobStatistics();
      
      expect(stats.upcomingExecutions).toHaveLength(1);
      expect(stats.upcomingExecutions[0]).toEqual({
        scheduledReportId: mockScheduledReport.id.value,
        reportName: mockScheduledReport.name,
        nextExecution: expect.any(Date),
      });
    });
  });

  describe('frequency calculations', () => {
    it('should calculate next daily execution correctly', async () => {
      const dailyReport = ScheduledReport.create(
        ReportId.create('daily-report'),
        'Daily Report',
        'A daily report',
        ReportFrequency.DAILY,
        new Date(Date.now() + 86400000), // 1 day from now
        true,
        UserId.create('user-123'),
        OrganizationId.create('org-123')
      );

      await service.scheduleReport(dailyReport);

      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 86400000);
    });

    it('should handle hourly frequency', async () => {
      const hourlyReport = ScheduledReport.create(
        ReportId.create('hourly-report'),
        'Hourly Report',
        'An hourly report',
        ReportFrequency.HOURLY,
        new Date(Date.now() + 3600000), // 1 hour from now
        true,
        UserId.create('user-123'),
        OrganizationId.create('org-123')
      );

      await service.scheduleReport(hourlyReport);

      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 3600000);
    });
  });

  describe('error handling', () => {
    it('should handle callback errors gracefully', async () => {
      mockOnExecuteReport.mockRejectedValueOnce(new Error('Callback error'));
      
      await service.scheduleReport(mockScheduledReport);
      
      // Fast-forward time to trigger execution
      jest.advanceTimersByTime(60000);
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(mockOnScheduleError).toHaveBeenCalledWith(
        mockScheduledReport,
        expect.objectContaining({ message: 'Callback error' })
      );
    });

    it('should handle invalid report data', async () => {
      const invalidReport = {
        id: { value: 'invalid-id' },
        name: null,
        frequency: 'INVALID_FREQUENCY',
        nextExecution: 'not-a-date',
      } as any;

      await expect(service.scheduleReport(invalidReport)).rejects.toThrow();
    });

    it('should handle system timer errors', async () => {
      // Mock setTimeout to throw an error
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn().mockImplementation(() => {
        throw new Error('Timer error');
      });

      await expect(service.scheduleReport(mockScheduledReport)).rejects.toThrow('Failed to schedule report');

      // Restore original setTimeout
      global.setTimeout = originalSetTimeout;
    });
  });

  describe('memory management', () => {
    it('should clean up completed jobs', async () => {
      await service.scheduleReport(mockScheduledReport);
      
      // Fast-forward time to trigger execution
      jest.advanceTimersByTime(60000);
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // The job should be rescheduled, not removed
      const jobs = await service.getScheduledJobs();
      expect(jobs).toHaveLength(1);
    });

    it('should handle large number of scheduled reports', async () => {
      const reports = Array.from({ length: 100 }, (_, i) =>
        ScheduledReport.create(
          ReportId.create(`report-${i}`),
          `Report ${i}`,
          `Description ${i}`,
          ReportFrequency.DAILY,
          new Date(Date.now() + (i + 1) * 60000),
          true,
          UserId.create('user-123'),
          OrganizationId.create('org-123')
        )
      );

      for (const report of reports) {
        await service.scheduleReport(report);
      }

      const jobs = await service.getScheduledJobs();
      expect(jobs).toHaveLength(100);
    });
  });
});