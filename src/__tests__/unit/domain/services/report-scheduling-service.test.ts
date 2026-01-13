import { ReportSchedulingService, ScheduleReportRequest } from '../../../../shared/domain/reporting/services/report-scheduling-service';
import { ScheduledReport, ScheduleFrequency, ScheduledReportStatus, ScheduleConfig, DeliveryConfig } from '../../../../shared/domain/reporting/entities/scheduled-report';
import { Report } from '../../../../shared/domain/reporting/entities/report';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { ValidationError } from '../../../../shared/domain/exceptions/validation-error';
import { BusinessRuleViolationError } from '../../../../shared/domain/exceptions/business-rule-violation-error';
import { ReportFactory } from '../../../factories/report-factory';
import { ScheduledReportFactory } from '../../../factories/scheduled-report-factory';

describe('ReportSchedulingService', () => {
  const mockUserId = UniqueId.create('user-123');
  const mockOrganizationId = UniqueId.create('org-456');
  const mockReportId = UniqueId.create('report-789');

  let mockReport: Report;
  let mockScheduleConfig: ScheduleConfig;
  let mockDeliveryConfig: DeliveryConfig;

  beforeEach(() => {
    mockReport = ReportFactory.create({
      id: mockReportId,
      isPublished: true,
      isArchived: false,
    });

    mockScheduleConfig = ScheduleConfig.create({
      frequency: ScheduleFrequency.DAILY,
      hour: 9,
      minute: 0,
      timezone: 'UTC',
    });

    mockDeliveryConfig = DeliveryConfig.create({
      method: 'EMAIL',
      recipients: ['test@example.com'],
      format: 'PDF',
      includeData: true,
    });
  });

  describe('scheduleReport', () => {
    it('should create scheduled report successfully', () => {
      // Arrange
      const request: ScheduleReportRequest = {
        name: 'Daily Sales Report',
        description: 'Daily sales summary',
        reportId: mockReportId,
        scheduleConfig: mockScheduleConfig,
        deliveryConfig: mockDeliveryConfig,
        createdBy: mockUserId,
        organizationId: mockOrganizationId,
      };

      // Act
      const result = ReportSchedulingService.scheduleReport(mockReport, request);

      // Assert
      expect(result).toBeInstanceOf(ScheduledReport);
      expect(result.name).toBe('Daily Sales Report');
      expect(result.description).toBe('Daily sales summary');
      expect(result.reportId).toBe(mockReportId);
      expect(result.scheduleConfig).toBe(mockScheduleConfig);
      expect(result.deliveryConfig).toBe(mockDeliveryConfig);
      expect(result.status).toBe(ScheduledReportStatus.ACTIVE);
      expect(result.createdBy).toBe(mockUserId);
      expect(result.organizationId).toBe(mockOrganizationId);
    });

    it('should throw ValidationError when name is empty', () => {
      // Arrange
      const request: ScheduleReportRequest = {
        name: '',
        reportId: mockReportId,
        scheduleConfig: mockScheduleConfig,
        deliveryConfig: mockDeliveryConfig,
        createdBy: mockUserId,
      };

      // Act & Assert
      expect(() => ReportSchedulingService.scheduleReport(mockReport, request))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError when reportId is not provided', () => {
      // Arrange
      const request = {
        name: 'Test Schedule',
        scheduleConfig: mockScheduleConfig,
        deliveryConfig: mockDeliveryConfig,
        createdBy: mockUserId,
      } as ScheduleReportRequest;

      // Act & Assert
      expect(() => ReportSchedulingService.scheduleReport(mockReport, request))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError when createdBy is not provided', () => {
      // Arrange
      const request = {
        name: 'Test Schedule',
        reportId: mockReportId,
        scheduleConfig: mockScheduleConfig,
        deliveryConfig: mockDeliveryConfig,
      } as ScheduleReportRequest;

      // Act & Assert
      expect(() => ReportSchedulingService.scheduleReport(mockReport, request))
        .toThrow(ValidationError);
    });

    it('should throw BusinessRuleViolationError when report is not published', () => {
      // Arrange
      const unpublishedReport = ReportFactory.create({
        isPublished: false,
      });

      const request: ScheduleReportRequest = {
        name: 'Test Schedule',
        reportId: mockReportId,
        scheduleConfig: mockScheduleConfig,
        deliveryConfig: mockDeliveryConfig,
        createdBy: mockUserId,
      };

      // Act & Assert
      expect(() => ReportSchedulingService.scheduleReport(unpublishedReport, request))
        .toThrow(BusinessRuleViolationError);
    });

    it('should throw BusinessRuleViolationError when report is archived', () => {
      // Arrange
      const archivedReport = ReportFactory.create({
        isPublished: true,
        isArchived: true,
      });

      const request: ScheduleReportRequest = {
        name: 'Test Schedule',
        reportId: mockReportId,
        scheduleConfig: mockScheduleConfig,
        deliveryConfig: mockDeliveryConfig,
        createdBy: mockUserId,
      };

      // Act & Assert
      expect(() => ReportSchedulingService.scheduleReport(archivedReport, request))
        .toThrow(BusinessRuleViolationError);
    });

    it('should throw ValidationError for invalid schedule frequency', () => {
      // Arrange
      const invalidScheduleConfig = {
        ...mockScheduleConfig,
        frequency: 'INVALID' as ScheduleFrequency,
      };

      const request: ScheduleReportRequest = {
        name: 'Test Schedule',
        reportId: mockReportId,
        scheduleConfig: invalidScheduleConfig,
        deliveryConfig: mockDeliveryConfig,
        createdBy: mockUserId,
      };

      // Act & Assert
      expect(() => ReportSchedulingService.scheduleReport(mockReport, request))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid hour', () => {
      // Arrange
      const invalidScheduleConfig = {
        ...mockScheduleConfig,
        hour: 25,
      };

      const request: ScheduleReportRequest = {
        name: 'Test Schedule',
        reportId: mockReportId,
        scheduleConfig: invalidScheduleConfig,
        deliveryConfig: mockDeliveryConfig,
        createdBy: mockUserId,
      };

      // Act & Assert
      expect(() => ReportSchedulingService.scheduleReport(mockReport, request))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid minute', () => {
      // Arrange
      const invalidScheduleConfig = {
        ...mockScheduleConfig,
        minute: 60,
      };

      const request: ScheduleReportRequest = {
        name: 'Test Schedule',
        reportId: mockReportId,
        scheduleConfig: invalidScheduleConfig,
        deliveryConfig: mockDeliveryConfig,
        createdBy: mockUserId,
      };

      // Act & Assert
      expect(() => ReportSchedulingService.scheduleReport(mockReport, request))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid timezone', () => {
      // Arrange
      const invalidScheduleConfig = {
        ...mockScheduleConfig,
        timezone: 'Invalid/Timezone',
      };

      const request: ScheduleReportRequest = {
        name: 'Test Schedule',
        reportId: mockReportId,
        scheduleConfig: invalidScheduleConfig,
        deliveryConfig: mockDeliveryConfig,
        createdBy: mockUserId,
      };

      // Act & Assert
      expect(() => ReportSchedulingService.scheduleReport(mockReport, request))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError when email delivery has no recipients', () => {
      // Arrange
      const invalidDeliveryConfig = {
        ...mockDeliveryConfig,
        recipients: [],
      };

      const request: ScheduleReportRequest = {
        name: 'Test Schedule',
        reportId: mockReportId,
        scheduleConfig: mockScheduleConfig,
        deliveryConfig: invalidDeliveryConfig,
        createdBy: mockUserId,
      };

      // Act & Assert
      expect(() => ReportSchedulingService.scheduleReport(mockReport, request))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError when webhook delivery has no URL', () => {
      // Arrange
      const invalidDeliveryConfig = {
        ...mockDeliveryConfig,
        method: 'WEBHOOK',
        webhookUrl: undefined,
      };

      const request: ScheduleReportRequest = {
        name: 'Test Schedule',
        reportId: mockReportId,
        scheduleConfig: mockScheduleConfig,
        deliveryConfig: invalidDeliveryConfig,
        createdBy: mockUserId,
      };

      // Act & Assert
      expect(() => ReportSchedulingService.scheduleReport(mockReport, request))
        .toThrow(ValidationError);
    });
  });

  describe('validateSchedule', () => {
    it('should return valid result for correct schedule configuration', () => {
      // Act
      const result = ReportSchedulingService.validateSchedule(mockScheduleConfig);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.nextExecutions).toHaveLength(5);
      expect(result.nextExecutions[0]).toBeInstanceOf(Date);
    });

    it('should return validation errors for invalid configuration', () => {
      // Arrange
      const invalidConfig = {
        ...mockScheduleConfig,
        hour: 25,
      };

      // Act
      const result = ReportSchedulingService.validateSchedule(invalidConfig);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Hour must be between 0 and 23');
    });

    it('should generate warnings for weekend executions', () => {
      // Arrange
      const weekendConfig = {
        ...mockScheduleConfig,
        frequency: ScheduleFrequency.WEEKLY,
        dayOfWeek: 0, // Sunday
      };

      // Act
      const result = ReportSchedulingService.validateSchedule(weekendConfig);

      // Assert
      expect(result.warnings).toContain('Scheduled for weekend - consider business day execution');
    });

    it('should generate warnings for off-hours execution', () => {
      // Arrange
      const offHoursConfig = {
        ...mockScheduleConfig,
        hour: 2, // 2 AM
      };

      // Act
      const result = ReportSchedulingService.validateSchedule(offHoursConfig);

      // Assert
      expect(result.warnings).toContain('Scheduled for off-hours - consider business hours for better delivery');
    });

    it('should generate warnings for month-end issues', () => {
      // Arrange
      const monthEndConfig = {
        ...mockScheduleConfig,
        frequency: ScheduleFrequency.MONTHLY,
        dayOfMonth: 31,
      };

      // Act
      const result = ReportSchedulingService.validateSchedule(monthEndConfig);

      // Assert
      expect(result.warnings).toContain('Day of month > 28 may cause issues in February');
    });
  });

  describe('createExecutionPlan', () => {
    it('should create execution plan for active scheduled reports', () => {
      // Arrange
      const scheduledReports = [
        ScheduledReportFactory.create({
          isActive: true,
          scheduleConfig: mockScheduleConfig,
          nextExecutionAt: new Date('2024-01-15T09:00:00Z'),
        }),
        ScheduledReportFactory.create({
          isActive: true,
          scheduleConfig: {
            ...mockScheduleConfig,
            hour: 10,
          },
          nextExecutionAt: new Date('2024-01-15T10:00:00Z'),
        }),
      ];

      const timeWindow = {
        start: new Date('2024-01-15T08:00:00Z'),
        end: new Date('2024-01-15T12:00:00Z'),
      };

      // Act
      const result = ReportSchedulingService.createExecutionPlan(scheduledReports, timeWindow);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].nextExecutionAt).toEqual(new Date('2024-01-15T09:00:00Z'));
      expect(result[1].nextExecutionAt).toEqual(new Date('2024-01-15T10:00:00Z'));
      expect(result[0].estimatedDuration).toBeGreaterThan(0);
      expect(result[0].priority).toMatch(/^(HIGH|MEDIUM|LOW)$/);
    });

    it('should exclude inactive scheduled reports', () => {
      // Arrange
      const scheduledReports = [
        ScheduledReportFactory.create({
          isActive: false,
          scheduleConfig: mockScheduleConfig,
          nextExecutionAt: new Date('2024-01-15T09:00:00Z'),
        }),
      ];

      const timeWindow = {
        start: new Date('2024-01-15T08:00:00Z'),
        end: new Date('2024-01-15T12:00:00Z'),
      };

      // Act
      const result = ReportSchedulingService.createExecutionPlan(scheduledReports, timeWindow);

      // Assert
      expect(result).toHaveLength(0);
    });

    it('should sort execution plan by time and priority', () => {
      // Arrange
      const scheduledReports = [
        ScheduledReportFactory.create({
          isActive: true,
          scheduleConfig: mockScheduleConfig,
          nextExecutionAt: new Date('2024-01-15T10:00:00Z'),
          executionCount: 10,
          successRate: 90,
        }),
        ScheduledReportFactory.create({
          isActive: true,
          scheduleConfig: mockScheduleConfig,
          nextExecutionAt: new Date('2024-01-15T09:00:00Z'),
          executionCount: 100,
          successRate: 98,
        }),
      ];

      const timeWindow = {
        start: new Date('2024-01-15T08:00:00Z'),
        end: new Date('2024-01-15T12:00:00Z'),
      };

      // Act
      const result = ReportSchedulingService.createExecutionPlan(scheduledReports, timeWindow);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].nextExecutionAt.getTime()).toBeLessThan(result[1].nextExecutionAt.getTime());
    });
  });

  describe('optimizeSchedule', () => {
    it('should identify conflicts when too many reports scheduled at same time', () => {
      // Arrange
      const sameTime = new Date('2024-01-15T09:00:00Z');
      const scheduledReports = Array(7).fill(0).map(() =>
        ScheduledReportFactory.create({
          isActive: true,
          nextExecutionAt: sameTime,
        })
      );

      // Act
      const result = ReportSchedulingService.optimizeSchedule(scheduledReports, 5);

      // Assert
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].reports).toHaveLength(7);
      expect(result.suggestions).toHaveLength(2); // 7 - 5 = 2 excess reports
    });

    it('should provide suggestions for resolving conflicts', () => {
      // Arrange
      const sameTime = new Date('2024-01-15T09:00:00Z');
      const scheduledReports = Array(6).fill(0).map(() =>
        ScheduledReportFactory.create({
          isActive: true,
          nextExecutionAt: sameTime,
        })
      );

      // Act
      const result = ReportSchedulingService.optimizeSchedule(scheduledReports, 5);

      // Assert
      expect(result.suggestions).toHaveLength(1);
      expect(result.suggestions[0].currentTime).toEqual(sameTime);
      expect(result.suggestions[0].suggestedTime.getTime()).toBeGreaterThan(sameTime.getTime());
      expect(result.suggestions[0].reason).toContain('concurrent execution conflict');
    });

    it('should return no conflicts when reports are well distributed', () => {
      // Arrange
      const scheduledReports = [
        ScheduledReportFactory.create({
          isActive: true,
          nextExecutionAt: new Date('2024-01-15T09:00:00Z'),
        }),
        ScheduledReportFactory.create({
          isActive: true,
          nextExecutionAt: new Date('2024-01-15T10:00:00Z'),
        }),
      ];

      // Act
      const result = ReportSchedulingService.optimizeSchedule(scheduledReports, 5);

      // Assert
      expect(result.conflicts).toHaveLength(0);
      expect(result.suggestions).toHaveLength(0);
    });
  });

  describe('suggestOptimalFrequency', () => {
    it('should suggest daily frequency for high access reports', () => {
      // Arrange
      const executionHistory = Array(10).fill(0).map(() => ({
        executedAt: new Date(),
        success: true,
        accessCount: 15,
        avgAccessDelay: 2 * 60 * 60 * 1000, // 2 hours
      }));

      // Act
      const result = ReportSchedulingService.suggestOptimalFrequency(executionHistory);

      // Assert
      expect(result.suggestedFrequency).toBe(ScheduleFrequency.DAILY);
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.reasoning).toContain('High access count suggests daily frequency');
    });

    it('should suggest weekly frequency for low access reports', () => {
      // Arrange
      const executionHistory = Array(10).fill(0).map(() => ({
        executedAt: new Date(),
        success: true,
        accessCount: 0.5,
        avgAccessDelay: 12 * 60 * 60 * 1000, // 12 hours
      }));

      // Act
      const result = ReportSchedulingService.suggestOptimalFrequency(executionHistory);

      // Assert
      expect(result.suggestedFrequency).toBe(ScheduleFrequency.WEEKLY);
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.reasoning).toContain('Low access count suggests weekly frequency is sufficient');
    });

    it('should suggest weekly frequency for reports with long access delays', () => {
      // Arrange
      const executionHistory = Array(10).fill(0).map(() => ({
        executedAt: new Date(),
        success: true,
        accessCount: 5,
        avgAccessDelay: 48 * 60 * 60 * 1000, // 48 hours
      }));

      // Act
      const result = ReportSchedulingService.suggestOptimalFrequency(executionHistory);

      // Assert
      expect(result.suggestedFrequency).toBe(ScheduleFrequency.WEEKLY);
      expect(result.reasoning).toContain('Long delay between execution and access suggests lower frequency');
    });

    it('should return low confidence for insufficient history', () => {
      // Arrange
      const executionHistory = Array(3).fill(0).map(() => ({
        executedAt: new Date(),
        success: true,
        accessCount: 5,
        avgAccessDelay: 2 * 60 * 60 * 1000,
      }));

      // Act
      const result = ReportSchedulingService.suggestOptimalFrequency(executionHistory);

      // Assert
      expect(result.confidence).toBe(0.3);
      expect(result.reasoning).toContain('Insufficient execution history for accurate recommendation');
    });

    it('should reduce confidence for low success rates', () => {
      // Arrange
      const executionHistory = Array(10).fill(0).map((_, i) => ({
        executedAt: new Date(),
        success: i < 6, // 60% success rate
        accessCount: 5,
        avgAccessDelay: 2 * 60 * 60 * 1000,
      }));

      // Act
      const result = ReportSchedulingService.suggestOptimalFrequency(executionHistory);

      // Assert
      expect(result.confidence).toBeLessThan(0.8);
      expect(result.reasoning).toContain('Low success rate reduces confidence in recommendation');
    });
  });

  describe('shouldPauseForFailures', () => {
    it('should suggest pausing for high failure rate', () => {
      // Arrange
      const scheduledReport = ScheduledReportFactory.create({
        executionCount: 20,
        failureCount: 15,
      });

      // Mock the hasHighFailureRate method
      jest.spyOn(scheduledReport, 'hasHighFailureRate').mockReturnValue(true);
      jest.spyOn(scheduledReport, 'getSuccessRate').mockReturnValue(25);

      // Act
      const result = ReportSchedulingService.shouldPauseForFailures(scheduledReport);

      // Assert
      expect(result.shouldPause).toBe(true);
      expect(result.reason).toContain('High failure rate: 75% of executions failed');
      expect(result.suggestedAction).toContain('Review report configuration and data sources');
    });

    it('should suggest pausing for multiple recent failures', () => {
      // Arrange
      const scheduledReport = ScheduledReportFactory.create({
        executionCount: 8,
        failureCount: 6,
      });

      // Mock the hasHighFailureRate method
      jest.spyOn(scheduledReport, 'hasHighFailureRate').mockReturnValue(false);

      // Act
      const result = ReportSchedulingService.shouldPauseForFailures(scheduledReport);

      // Assert
      expect(result.shouldPause).toBe(true);
      expect(result.reason).toBe('Multiple recent failures detected');
      expect(result.suggestedAction).toContain('Check report dependencies and data availability');
    });

    it('should not suggest pausing for healthy reports', () => {
      // Arrange
      const scheduledReport = ScheduledReportFactory.create({
        executionCount: 20,
        failureCount: 1,
      });

      // Mock the hasHighFailureRate method
      jest.spyOn(scheduledReport, 'hasHighFailureRate').mockReturnValue(false);

      // Act
      const result = ReportSchedulingService.shouldPauseForFailures(scheduledReport);

      // Assert
      expect(result.shouldPause).toBe(false);
      expect(result.reason).toBeUndefined();
      expect(result.suggestedAction).toBeUndefined();
    });
  });
});