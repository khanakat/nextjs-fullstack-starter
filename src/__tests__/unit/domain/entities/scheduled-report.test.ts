import { 
  ScheduledReport, 
  ScheduleFrequency, 
  ScheduledReportStatus, 
  DeliveryMethod,
  ScheduleConfig,
  DeliveryConfig 
} from '../../../../shared/domain/reporting/entities/scheduled-report';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { ValidationError } from '../../../../shared/domain/exceptions/validation-error';
import { ScheduledReportCreatedEvent } from '../../../../shared/domain/reporting/events/scheduled-report-created-event';
import { ScheduledReportUpdatedEvent } from '../../../../shared/domain/reporting/events/scheduled-report-updated-event';
import { ScheduledReportExecutedEvent } from '../../../../shared/domain/reporting/events/scheduled-report-executed-event';

describe('ScheduledReport Entity', () => {
  let validScheduleConfig: ScheduleConfig;
  let validDeliveryConfig: DeliveryConfig;
  let validProps: any;

  beforeEach(() => {
    validScheduleConfig = {
      frequency: ScheduleFrequency.DAILY,
      hour: 9,
      minute: 0,
      timezone: 'UTC'
    };

    validDeliveryConfig = {
      method: DeliveryMethod.EMAIL,
      recipients: ['test@example.com'],
      format: 'PDF' as const,
      includeCharts: true
    };

    validProps = {
      name: 'Daily Sales Report',
      description: 'Automated daily sales report',
      reportId: UniqueId.generate(),
      scheduleConfig: validScheduleConfig,
      deliveryConfig: validDeliveryConfig,
      status: ScheduledReportStatus.ACTIVE,
      createdBy: UniqueId.generate(),
      organizationId: UniqueId.generate()
    };
  });

  describe('create', () => {
    it('should create a scheduled report with valid properties', () => {
      const scheduledReport = ScheduledReport.create(validProps);

      expect(scheduledReport.name).toBe(validProps.name);
      expect(scheduledReport.description).toBe(validProps.description);
      expect(scheduledReport.reportId).toBe(validProps.reportId);
      expect(scheduledReport.status).toBe(validProps.status);
      expect(scheduledReport.createdBy).toBe(validProps.createdBy);
      expect(scheduledReport.organizationId).toBe(validProps.organizationId);
      expect(scheduledReport.executionCount).toBe(0);
      expect(scheduledReport.failureCount).toBe(0);
      expect(scheduledReport.createdAt).toBeInstanceOf(Date);
      expect(scheduledReport.updatedAt).toBeInstanceOf(Date);
      expect(scheduledReport.nextExecutionAt).toBeInstanceOf(Date);
    });

    it('should create a scheduled report without organization ID', () => {
      const propsWithoutOrg = { ...validProps };
      delete propsWithoutOrg.organizationId;

      const scheduledReport = ScheduledReport.create(propsWithoutOrg);

      expect(scheduledReport.organizationId).toBeUndefined();
    });

    it('should raise ScheduledReportCreatedEvent on creation', () => {
      const scheduledReport = ScheduledReport.create(validProps);
      const events = scheduledReport.getUncommittedEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ScheduledReportCreatedEvent);
      expect(events[0].name).toBe('ScheduledReportCreatedEvent');
    });

    it('should calculate next execution time correctly for daily frequency', () => {
      const now = new Date('2024-01-15T10:00:00Z');
      jest.spyOn(Date, 'now').mockReturnValue(now.getTime());

      const scheduledReport = ScheduledReport.create(validProps);
      
      // Should be next day at 9:00 AM since current time (10:00) is after schedule time (9:00)
      const expectedNext = new Date('2024-01-16T09:00:00Z');
      expect(scheduledReport.nextExecutionAt).toEqual(expectedNext);

      jest.restoreAllMocks();
    });

    it('should calculate next execution time correctly for weekly frequency', () => {
      const weeklyConfig = {
        ...validScheduleConfig,
        frequency: ScheduleFrequency.WEEKLY,
        dayOfWeek: 1 // Monday
      };
      const propsWithWeekly = { ...validProps, scheduleConfig: weeklyConfig };

      const scheduledReport = ScheduledReport.create(propsWithWeekly);

      expect(scheduledReport.nextExecutionAt).toBeInstanceOf(Date);
    });

    it('should calculate next execution time correctly for monthly frequency', () => {
      const monthlyConfig = {
        ...validScheduleConfig,
        frequency: ScheduleFrequency.MONTHLY,
        dayOfMonth: 15
      };
      const propsWithMonthly = { ...validProps, scheduleConfig: monthlyConfig };

      const scheduledReport = ScheduledReport.create(propsWithMonthly);

      expect(scheduledReport.nextExecutionAt).toBeInstanceOf(Date);
    });
  });

  describe('validation', () => {
    it('should throw ValidationError for empty name', () => {
      const invalidProps = { ...validProps, name: '' };

      expect(() => ScheduledReport.create(invalidProps))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError for name exceeding 255 characters', () => {
      const invalidProps = { ...validProps, name: 'a'.repeat(256) };

      expect(() => ScheduledReport.create(invalidProps))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError for description exceeding 1000 characters', () => {
      const invalidProps = { ...validProps, description: 'a'.repeat(1001) };

      expect(() => ScheduledReport.create(invalidProps))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError for missing report ID', () => {
      const invalidProps = { ...validProps };
      delete invalidProps.reportId;

      expect(() => ScheduledReport.create(invalidProps))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError for missing creator', () => {
      const invalidProps = { ...validProps };
      delete invalidProps.createdBy;

      expect(() => ScheduledReport.create(invalidProps))
        .toThrow(ValidationError);
    });

    describe('schedule config validation', () => {
      it('should throw ValidationError for invalid frequency', () => {
        const invalidConfig = { ...validScheduleConfig, frequency: 'INVALID' as any };
        const invalidProps = { ...validProps, scheduleConfig: invalidConfig };

        expect(() => ScheduledReport.create(invalidProps))
          .toThrow(ValidationError);
      });

      it('should throw ValidationError for invalid hour', () => {
        const invalidConfig = { ...validScheduleConfig, hour: 25 };
        const invalidProps = { ...validProps, scheduleConfig: invalidConfig };

        expect(() => ScheduledReport.create(invalidProps))
          .toThrow(ValidationError);
      });

      it('should throw ValidationError for invalid minute', () => {
        const invalidConfig = { ...validScheduleConfig, minute: 60 };
        const invalidProps = { ...validProps, scheduleConfig: invalidConfig };

        expect(() => ScheduledReport.create(invalidProps))
          .toThrow(ValidationError);
      });

      it('should throw ValidationError for weekly frequency without day of week', () => {
        const invalidConfig = { 
          ...validScheduleConfig, 
          frequency: ScheduleFrequency.WEEKLY 
        };
        const invalidProps = { ...validProps, scheduleConfig: invalidConfig };

        expect(() => ScheduledReport.create(invalidProps))
          .toThrow(ValidationError);
      });

      it('should throw ValidationError for monthly frequency without day of month', () => {
        const invalidConfig = { 
          ...validScheduleConfig, 
          frequency: ScheduleFrequency.MONTHLY 
        };
        const invalidProps = { ...validProps, scheduleConfig: invalidConfig };

        expect(() => ScheduledReport.create(invalidProps))
          .toThrow(ValidationError);
      });

      it('should throw ValidationError for empty timezone', () => {
        const invalidConfig = { ...validScheduleConfig, timezone: '' };
        const invalidProps = { ...validProps, scheduleConfig: invalidConfig };

        expect(() => ScheduledReport.create(invalidProps))
          .toThrow(ValidationError);
      });
    });

    describe('delivery config validation', () => {
      it('should throw ValidationError for invalid delivery method', () => {
        const invalidConfig = { ...validDeliveryConfig, method: 'INVALID' as any };
        const invalidProps = { ...validProps, deliveryConfig: invalidConfig };

        expect(() => ScheduledReport.create(invalidProps))
          .toThrow(ValidationError);
      });

      it('should throw ValidationError for email delivery without recipients', () => {
        const invalidConfig = { 
          ...validDeliveryConfig, 
          method: DeliveryMethod.EMAIL,
          recipients: []
        };
        const invalidProps = { ...validProps, deliveryConfig: invalidConfig };

        expect(() => ScheduledReport.create(invalidProps))
          .toThrow(ValidationError);
      });

      it('should throw ValidationError for invalid email address', () => {
        const invalidConfig = { 
          ...validDeliveryConfig, 
          recipients: ['invalid-email']
        };
        const invalidProps = { ...validProps, deliveryConfig: invalidConfig };

        expect(() => ScheduledReport.create(invalidProps))
          .toThrow(ValidationError);
      });

      it('should throw ValidationError for webhook delivery without URL', () => {
        const invalidConfig = { 
          ...validDeliveryConfig, 
          method: DeliveryMethod.WEBHOOK,
          webhookUrl: undefined
        };
        const invalidProps = { ...validProps, deliveryConfig: invalidConfig };

        expect(() => ScheduledReport.create(invalidProps))
          .toThrow(ValidationError);
      });

      it('should throw ValidationError for invalid webhook URL', () => {
        const invalidConfig = { 
          ...validDeliveryConfig, 
          method: DeliveryMethod.WEBHOOK,
          webhookUrl: 'invalid-url'
        };
        const invalidProps = { ...validProps, deliveryConfig: invalidConfig };

        expect(() => ScheduledReport.create(invalidProps))
          .toThrow(ValidationError);
      });

      it('should throw ValidationError for invalid format', () => {
        const invalidConfig = { ...validDeliveryConfig, format: 'INVALID' as any };
        const invalidProps = { ...validProps, deliveryConfig: invalidConfig };

        expect(() => ScheduledReport.create(invalidProps))
          .toThrow(ValidationError);
      });
    });
  });

  describe('updateName', () => {
    it('should update name successfully', () => {
      const scheduledReport = ScheduledReport.create(validProps);
      const newName = 'Updated Report Name';

      scheduledReport.updateName(newName);

      expect(scheduledReport.name).toBe(newName);
    });

    it('should raise ScheduledReportUpdatedEvent on name update', () => {
      const scheduledReport = ScheduledReport.create(validProps);
      scheduledReport.markEventsAsCommitted();

      scheduledReport.updateName('New Name');
      const events = scheduledReport.getUncommittedEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ScheduledReportUpdatedEvent);
    });

    it('should throw ValidationError for empty name', () => {
      const scheduledReport = ScheduledReport.create(validProps);

      expect(() => scheduledReport.updateName(''))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError for name exceeding 255 characters', () => {
      const scheduledReport = ScheduledReport.create(validProps);

      expect(() => scheduledReport.updateName('a'.repeat(256)))
        .toThrow(ValidationError);
    });
  });

  describe('updateDescription', () => {
    it('should update description successfully', () => {
      const scheduledReport = ScheduledReport.create(validProps);
      const newDescription = 'Updated description';

      scheduledReport.updateDescription(newDescription);

      expect(scheduledReport.description).toBe(newDescription);
    });

    it('should clear description when undefined is passed', () => {
      const scheduledReport = ScheduledReport.create(validProps);

      scheduledReport.updateDescription(undefined);

      expect(scheduledReport.description).toBeUndefined();
    });

    it('should throw ValidationError for description exceeding 1000 characters', () => {
      const scheduledReport = ScheduledReport.create(validProps);

      expect(() => scheduledReport.updateDescription('a'.repeat(1001)))
        .toThrow(ValidationError);
    });
  });

  describe('updateScheduleConfig', () => {
    it('should update schedule config successfully', () => {
      const scheduledReport = ScheduledReport.create(validProps);
      const newConfig: ScheduleConfig = {
        frequency: ScheduleFrequency.WEEKLY,
        dayOfWeek: 1,
        hour: 10,
        minute: 30,
        timezone: 'America/New_York'
      };

      scheduledReport.updateScheduleConfig(newConfig);

      expect(scheduledReport.scheduleConfig).toEqual(newConfig);
    });

    it('should recalculate next execution time when schedule config is updated', () => {
      const scheduledReport = ScheduledReport.create(validProps);
      const originalNextExecution = scheduledReport.nextExecutionAt;
      
      const newConfig: ScheduleConfig = {
        frequency: ScheduleFrequency.WEEKLY,
        dayOfWeek: 1,
        hour: 10,
        minute: 30,
        timezone: 'UTC'
      };

      scheduledReport.updateScheduleConfig(newConfig);

      expect(scheduledReport.nextExecutionAt).not.toEqual(originalNextExecution);
    });
  });

  describe('updateDeliveryConfig', () => {
    it('should update delivery config successfully', () => {
      const scheduledReport = ScheduledReport.create(validProps);
      const newConfig: DeliveryConfig = {
        method: DeliveryMethod.WEBHOOK,
        webhookUrl: 'https://example.com/webhook',
        format: 'CSV',
        includeCharts: false
      };

      scheduledReport.updateDeliveryConfig(newConfig);

      expect(scheduledReport.deliveryConfig).toEqual(newConfig);
    });
  });

  describe('status management', () => {
    it('should activate scheduled report', () => {
      const inactiveProps = { ...validProps, status: ScheduledReportStatus.INACTIVE };
      const scheduledReport = ScheduledReport.create(inactiveProps);

      scheduledReport.activate();

      expect(scheduledReport.status).toBe(ScheduledReportStatus.ACTIVE);
      expect(scheduledReport.isActive()).toBe(true);
    });

    it('should deactivate scheduled report', () => {
      const scheduledReport = ScheduledReport.create(validProps);

      scheduledReport.deactivate();

      expect(scheduledReport.status).toBe(ScheduledReportStatus.INACTIVE);
      expect(scheduledReport.isInactive()).toBe(true);
    });

    it('should pause scheduled report', () => {
      const scheduledReport = ScheduledReport.create(validProps);

      scheduledReport.pause();

      expect(scheduledReport.status).toBe(ScheduledReportStatus.PAUSED);
      expect(scheduledReport.isPaused()).toBe(true);
    });

    it('should resume paused scheduled report', () => {
      const pausedProps = { ...validProps, status: ScheduledReportStatus.PAUSED };
      const scheduledReport = ScheduledReport.create(pausedProps);

      scheduledReport.resume();

      expect(scheduledReport.status).toBe(ScheduledReportStatus.ACTIVE);
      expect(scheduledReport.isActive()).toBe(true);
    });
  });

  describe('execution tracking', () => {
    it('should mark execution as successful', () => {
      const scheduledReport = ScheduledReport.create(validProps);
      const originalCount = scheduledReport.executionCount;

      scheduledReport.markExecuted(true);

      expect(scheduledReport.executionCount).toBe(originalCount + 1);
      expect(scheduledReport.lastExecutedAt).toBeInstanceOf(Date);
    });

    it('should mark execution as failed', () => {
      const scheduledReport = ScheduledReport.create(validProps);
      const originalFailureCount = scheduledReport.failureCount;

      scheduledReport.markExecuted(false);

      expect(scheduledReport.failureCount).toBe(originalFailureCount + 1);
      expect(scheduledReport.lastExecutedAt).toBeInstanceOf(Date);
    });

    it('should raise ScheduledReportExecutedEvent on execution', () => {
      const scheduledReport = ScheduledReport.create(validProps);
      scheduledReport.markEventsAsCommitted();

      scheduledReport.markExecuted(true);
      const events = scheduledReport.getUncommittedEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ScheduledReportExecutedEvent);
    });

    it('should update next execution time after execution', () => {
      const scheduledReport = ScheduledReport.create(validProps);
      const originalNextExecution = scheduledReport.nextExecutionAt;

      scheduledReport.markExecuted(true);

      expect(scheduledReport.nextExecutionAt).not.toEqual(originalNextExecution);
    });
  });

  describe('business logic', () => {
    it('should determine if scheduled report is due', () => {
      const pastDate = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
      const scheduledReport = ScheduledReport.create(validProps);
      
      // Manually set next execution to past date for testing
      (scheduledReport as any).props.nextExecutionAt = pastDate;

      expect(scheduledReport.isDue()).toBe(true);
    });

    it('should determine if scheduled report is not due', () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now
      const scheduledReport = ScheduledReport.create(validProps);
      
      // Manually set next execution to future date for testing
      (scheduledReport as any).props.nextExecutionAt = futureDate;

      expect(scheduledReport.isDue()).toBe(false);
    });

    it('should check if belongs to organization', () => {
      const scheduledReport = ScheduledReport.create(validProps);

      expect(scheduledReport.belongsToOrganization(validProps.organizationId)).toBe(true);
      expect(scheduledReport.belongsToOrganization(UniqueId.generate())).toBe(false);
    });

    it('should check if created by user', () => {
      const scheduledReport = ScheduledReport.create(validProps);

      expect(scheduledReport.isCreatedBy(validProps.createdBy)).toBe(true);
      expect(scheduledReport.isCreatedBy(UniqueId.generate())).toBe(false);
    });

    it('should detect high failure rate', () => {
      const scheduledReport = ScheduledReport.create(validProps);
      
      // Simulate multiple failures
      for (let i = 0; i < 8; i++) {
        scheduledReport.markExecuted(false);
      }
      // Add some successes
      for (let i = 0; i < 2; i++) {
        scheduledReport.markExecuted(true);
      }

      expect(scheduledReport.hasHighFailureRate()).toBe(true);
    });

    it('should calculate success rate correctly', () => {
      const scheduledReport = ScheduledReport.create(validProps);
      
      // 7 successes, 3 failures = 70% success rate
      for (let i = 0; i < 7; i++) {
        scheduledReport.markExecuted(true);
      }
      for (let i = 0; i < 3; i++) {
        scheduledReport.markExecuted(false);
      }

      expect(scheduledReport.getSuccessRate()).toBe(0.7);
    });

    it('should return 100% success rate when no executions', () => {
      const scheduledReport = ScheduledReport.create(validProps);

      expect(scheduledReport.getSuccessRate()).toBe(1.0);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute scheduled report from existing data', () => {
      const id = UniqueId.generate();
      const props = {
        ...validProps,
        createdAt: new Date(),
        updatedAt: new Date(),
        nextExecutionAt: new Date(),
        executionCount: 5,
        failureCount: 1
      };

      const scheduledReport = ScheduledReport.reconstitute(id, props);

      expect(scheduledReport.id).toBe(id);
      expect(scheduledReport.name).toBe(props.name);
      expect(scheduledReport.executionCount).toBe(5);
      expect(scheduledReport.failureCount).toBe(1);
    });
  });
});