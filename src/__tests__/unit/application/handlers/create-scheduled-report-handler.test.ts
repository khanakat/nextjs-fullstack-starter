import { CreateScheduledReportHandler } from '../../../../slices/reporting/application/handlers/create-scheduled-report-handler';
import { CreateScheduledReportCommand } from '../../../../slices/reporting/application/commands/create-scheduled-report-command';
import { IScheduledReportRepository } from '../../../../shared/domain/reporting/repositories/scheduled-report-repository';
import { IReportRepository } from '../../../../shared/domain/reporting/repositories/report-repository';
import { ScheduledReport, ScheduleFrequency, DeliveryMethod } from '../../../../shared/domain/reporting/entities/scheduled-report';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { DeliveryConfigDto } from '../../../../slices/reporting/application/dtos/scheduled-report-dto';

describe('CreateScheduledReportHandler', () => {
  let handler: CreateScheduledReportHandler;
  let mockScheduledReportRepository: jest.Mocked<IScheduledReportRepository>;
  let mockReportRepository: jest.Mocked<IReportRepository>;

  const validDeliveryConfig: DeliveryConfigDto = {
    method: DeliveryMethod.EMAIL,
    recipients: ['test@example.com'],
    subject: 'Scheduled Report',
    message: 'Your scheduled report is attached.',
    format: 'PDF',
    includeData: true,
    compression: false,
  };

  beforeEach(() => {
    mockScheduledReportRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByIds: jest.fn(),
      findByName: jest.fn(),
      findByOrganization: jest.fn(),
      findByCreator: jest.fn(),
      findByTemplate: jest.fn(),
      findByReport: jest.fn(),
      findDue: jest.fn(),
      findActive: jest.fn(),
      findByFrequency: jest.fn(),
      search: jest.fn(),
      count: jest.fn(),
      exists: jest.fn(),
      existsByName: jest.fn(),
      delete: jest.fn(),
      bulkUpdate: jest.fn(),
      findMany: jest.fn(),
      findManyWithPagination: jest.fn(),
      findDueForExecution: jest.fn(),
      updateLastExecution: jest.fn(),
      updateNextExecution: jest.fn(),
    };

    mockReportRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByIds: jest.fn(),
      findByTitle: jest.fn(),
      findByCreator: jest.fn(),
      findByOrganization: jest.fn(),
      findByStatus: jest.fn(),
      findByTemplate: jest.fn(),
      findPublic: jest.fn(),
      findPrivate: jest.fn(),
      search: jest.fn(),
      count: jest.fn(),
      exists: jest.fn(),
      existsByTitle: jest.fn(),
      delete: jest.fn(),
      bulkUpdate: jest.fn(),
      findMany: jest.fn(),
      findManyWithPagination: jest.fn(),
      incrementViewCount: jest.fn(),
      getPopularReports: jest.fn(),
      getRecentReports: jest.fn(),
    };

    handler = new CreateScheduledReportHandler(mockScheduledReportRepository, mockReportRepository);
  });

  describe('handle', () => {
    it('should create a scheduled report successfully', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const reportId = UniqueId.generate();
      const organizationId = UniqueId.generate();

      const command = new CreateScheduledReportCommand(
        'Weekly Sales Report',
        reportId.value,
        ScheduleFrequency.WEEKLY,
        'UTC',
        validDeliveryConfig,
        userId.value,
        organizationId.value
      );

      mockReportRepository.exists.mockResolvedValue(true);
      mockScheduledReportRepository.existsByName.mockResolvedValue(false);
      mockScheduledReportRepository.save.mockResolvedValue(undefined);

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value?.name).toBe('Weekly Sales Report');
      expect(result.value?.reportId).toBe(reportId.value);
      expect(result.value?.frequency).toBe(ScheduleFrequency.WEEKLY);
      expect(result.value?.createdBy).toBe(userId.value);
      expect(result.value?.organizationId).toBe(organizationId.value);
      expect(result.value?.isActive).toBe(true);
      expect(result.value?.nextExecutionAt).toBeInstanceOf(Date);

      expect(mockReportRepository.exists).toHaveBeenCalledWith(expect.any(UniqueId));
      expect(mockScheduledReportRepository.existsByName).toHaveBeenCalledWith(
        'Weekly Sales Report',
        expect.any(UniqueId),
        expect.any(UniqueId)
      );
      expect(mockScheduledReportRepository.save).toHaveBeenCalledWith(expect.any(ScheduledReport));
    });

    it('should fail when report does not exist', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const reportId = UniqueId.generate();

      const command = new CreateScheduledReportCommand(
        'Weekly Sales Report',
        reportId.value,
        ScheduleFrequency.WEEKLY,
        'UTC',
        validDeliveryConfig,
        userId.value
      );

      mockReportRepository.exists.mockResolvedValue(false);

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain(`Report with ID ${reportId.value} not found`);
      expect(mockScheduledReportRepository.save).not.toHaveBeenCalled();
    });

    it('should fail when scheduled report name already exists', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const reportId = UniqueId.generate();

      const command = new CreateScheduledReportCommand(
        'Existing Report Name',
        reportId.value,
        ScheduleFrequency.DAILY,
        'UTC',
        validDeliveryConfig,
        userId.value
      );

      mockReportRepository.exists.mockResolvedValue(true);
      mockScheduledReportRepository.existsByName.mockResolvedValue(true);

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain('A scheduled report with this name already exists');
      expect(mockScheduledReportRepository.save).not.toHaveBeenCalled();
    });

    it('should validate command parameters', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const reportId = UniqueId.generate();

      // Act & Assert - Empty name
      expect(() => {
        new CreateScheduledReportCommand(
          '',
          reportId.value,
          ScheduleFrequency.DAILY,
          'UTC',
          validDeliveryConfig,
          userId.value
        );
      }).toThrow('Scheduled report name is required');

      // Act & Assert - Long name
      expect(() => {
        new CreateScheduledReportCommand(
          'A'.repeat(201),
          reportId.value,
          ScheduleFrequency.DAILY,
          'UTC',
          validDeliveryConfig,
          userId.value
        );
      }).toThrow('Scheduled report name cannot exceed 200 characters');

      // Act & Assert - Empty report ID
      expect(() => {
        new CreateScheduledReportCommand(
          'Test Report',
          '',
          ScheduleFrequency.DAILY,
          'UTC',
          validDeliveryConfig,
          userId.value
        );
      }).toThrow('Report ID is required');

      // Act & Assert - Empty timezone
      expect(() => {
        new CreateScheduledReportCommand(
          'Test Report',
          reportId.value,
          ScheduleFrequency.DAILY,
          '',
          validDeliveryConfig,
          userId.value
        );
      }).toThrow('Timezone is required');
    });

    it('should validate delivery configuration', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const reportId = UniqueId.generate();

      // Act & Assert - Missing delivery config
      expect(() => {
        new CreateScheduledReportCommand(
          'Test Report',
          reportId.value,
          ScheduleFrequency.DAILY,
          'UTC',
          null as any,
          userId.value
        );
      }).toThrow('Delivery configuration is required');

      // Act & Assert - Invalid email recipients
      const invalidEmailConfig = {
        ...validDeliveryConfig,
        recipients: ['invalid-email'],
      };

      expect(() => {
        new CreateScheduledReportCommand(
          'Test Report',
          reportId.value,
          ScheduleFrequency.DAILY,
          'UTC',
          invalidEmailConfig,
          userId.value
        );
      }).toThrow('Invalid email address: invalid-email');

      // Act & Assert - Empty recipients
      const emptyRecipientsConfig = {
        ...validDeliveryConfig,
        recipients: [],
      };

      expect(() => {
        new CreateScheduledReportCommand(
          'Test Report',
          reportId.value,
          ScheduleFrequency.DAILY,
          'UTC',
          emptyRecipientsConfig,
          userId.value
        );
      }).toThrow('At least one recipient is required');
    });

    it('should calculate next execution time correctly for different frequencies', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const reportId = UniqueId.generate();

      mockReportRepository.exists.mockResolvedValue(true);
      mockScheduledReportRepository.existsByName.mockResolvedValue(false);
      mockScheduledReportRepository.save.mockResolvedValue(undefined);

      const frequencies = [
        ScheduleFrequency.HOURLY,
        ScheduleFrequency.DAILY,
        ScheduleFrequency.WEEKLY,
        ScheduleFrequency.MONTHLY,
      ];

      for (const frequency of frequencies) {
        const command = new CreateScheduledReportCommand(
          `Test ${frequency} Report`,
          reportId.value,
          frequency,
          'UTC',
          validDeliveryConfig,
          userId.value
        );

        // Act
        const result = await handler.handle(command);

        // Assert
        expect(result.isSuccess).toBe(true);
        expect(result.value?.nextExecutionAt).toBeInstanceOf(Date);
        expect(result.value?.nextExecutionAt.getTime()).toBeGreaterThan(Date.now());
      }
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const reportId = UniqueId.generate();

      const command = new CreateScheduledReportCommand(
        'Test Report',
        reportId.value,
        ScheduleFrequency.DAILY,
        'UTC',
        validDeliveryConfig,
        userId.value
      );

      mockReportRepository.exists.mockResolvedValue(true);
      mockScheduledReportRepository.existsByName.mockResolvedValue(false);
      mockScheduledReportRepository.save.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain('Database error');
    });

    it('should create scheduled report without organization ID', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const reportId = UniqueId.generate();

      const command = new CreateScheduledReportCommand(
        'Personal Report',
        reportId.value,
        ScheduleFrequency.DAILY,
        'UTC',
        validDeliveryConfig,
        userId.value
        // No organization ID
      );

      mockReportRepository.exists.mockResolvedValue(true);
      mockScheduledReportRepository.existsByName.mockResolvedValue(false);
      mockScheduledReportRepository.save.mockResolvedValue(undefined);

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value?.organizationId).toBeUndefined();
      expect(mockScheduledReportRepository.existsByName).toHaveBeenCalledWith(
        'Personal Report',
        expect.any(UniqueId),
        undefined
      );
    });

    it('should handle different delivery methods', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const reportId = UniqueId.generate();

      const smsConfig: DeliveryConfigDto = {
        method: DeliveryMethod.SMS,
        recipients: ['+1234567890'],
        subject: 'Report Ready',
        message: 'Your report is ready',
        format: 'PDF',
        includeData: false,
        compression: true,
      };

      const command = new CreateScheduledReportCommand(
        'SMS Report',
        reportId.value,
        ScheduleFrequency.DAILY,
        'UTC',
        smsConfig,
        userId.value
      );

      mockReportRepository.exists.mockResolvedValue(true);
      mockScheduledReportRepository.existsByName.mockResolvedValue(false);
      mockScheduledReportRepository.save.mockResolvedValue(undefined);

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value?.deliveryConfig.method).toBe(DeliveryMethod.SMS);
      expect(result.value?.deliveryConfig.recipients).toEqual(['+1234567890']);
    });

    it('should handle concurrent requests efficiently', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const reportId = UniqueId.generate();

      mockReportRepository.exists.mockResolvedValue(true);
      mockScheduledReportRepository.existsByName.mockResolvedValue(false);
      mockScheduledReportRepository.save.mockResolvedValue(undefined);

      const commands = Array(5).fill(null).map((_, index) => 
        new CreateScheduledReportCommand(
          `Concurrent Report ${index}`,
          reportId.value,
          ScheduleFrequency.DAILY,
          'UTC',
          validDeliveryConfig,
          userId.value
        )
      );

      // Act
      const promises = commands.map(command => handler.handle(command));
      const results = await Promise.all(promises);

      // Assert
      results.forEach((result, index) => {
        expect(result.isSuccess).toBe(true);
        expect(result.value?.name).toBe(`Concurrent Report ${index}`);
      });
      expect(mockScheduledReportRepository.save).toHaveBeenCalledTimes(5);
    });

    it('should handle null/undefined inputs gracefully', async () => {
      // Act
      const nullResult = await handler.handle(null as any);
      const undefinedResult = await handler.handle(undefined as any);

      // Assert
      expect(nullResult.isSuccess).toBe(false);
      expect(undefinedResult.isSuccess).toBe(false);
    });

    it('should convert delivery config to DTO correctly', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const reportId = UniqueId.generate();

      const complexDeliveryConfig: DeliveryConfigDto = {
        method: DeliveryMethod.EMAIL,
        recipients: ['user1@example.com', 'user2@example.com'],
        subject: 'Monthly Analytics Report',
        message: 'Please find the monthly analytics report attached.',
        format: 'EXCEL',
        includeData: true,
        compression: true,
      };

      const command = new CreateScheduledReportCommand(
        'Complex Report',
        reportId.value,
        ScheduleFrequency.MONTHLY,
        'America/New_York',
        complexDeliveryConfig,
        userId.value
      );

      mockReportRepository.exists.mockResolvedValue(true);
      mockScheduledReportRepository.existsByName.mockResolvedValue(false);
      mockScheduledReportRepository.save.mockResolvedValue(undefined);

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value?.deliveryConfig).toEqual(complexDeliveryConfig);
      expect(result.value?.timezone).toBe('America/New_York');
    });

    it('should initialize execution counters correctly', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const reportId = UniqueId.generate();

      const command = new CreateScheduledReportCommand(
        'New Report',
        reportId.value,
        ScheduleFrequency.DAILY,
        'UTC',
        validDeliveryConfig,
        userId.value
      );

      mockReportRepository.exists.mockResolvedValue(true);
      mockScheduledReportRepository.existsByName.mockResolvedValue(false);
      mockScheduledReportRepository.save.mockResolvedValue(undefined);

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value?.executionCount).toBe(0);
      expect(result.value?.failureCount).toBe(0);
      expect(result.value?.lastExecutionAt).toBeUndefined();
      expect(result.value?.executionHistory).toEqual([]);
    });
  });
});