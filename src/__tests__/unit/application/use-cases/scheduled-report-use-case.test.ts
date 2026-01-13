import { ScheduledReportUseCase } from '../../../../slices/reporting/application/use-cases/scheduled-report-use-case';
import { CreateScheduledReportHandler } from '../../../../slices/reporting/application/handlers/create-scheduled-report-handler';
import { GetScheduledReportHandler } from '../../../../slices/reporting/application/query-handlers/get-scheduled-report-handler';
import { GetScheduledReportsHandler } from '../../../../slices/reporting/application/query-handlers/get-scheduled-reports-handler';
import { IScheduledReportRepository } from '../../../../shared/domain/reporting/repositories/scheduled-report-repository';
import { IReportRepository } from '../../../../shared/domain/reporting/repositories/report-repository';
import { CreateScheduledReportCommand } from '../../../../slices/reporting/application/commands/create-scheduled-report-command';
import { GetScheduledReportQuery } from '../../../../slices/reporting/application/queries/get-scheduled-report-query';
import { GetScheduledReportsQuery } from '../../../../slices/reporting/application/queries/get-scheduled-reports-query';
import { ScheduledReport, ReportFrequency, ExecutionStatus, ScheduledReportStatus } from '../../../../shared/domain/reporting/entities/scheduled-report';
import { Report } from '../../../../shared/domain/reporting/entities/report';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { Result } from '../../../../shared/application/base/result';
import { PaginatedResult } from '../../../../shared/application/base/paginated-result';
import { ScheduledReportDto } from '../../../../slices/reporting/application/dtos/scheduled-report-dto';
import { ScheduledReportFactory } from '../../../factories/scheduled-report-factory';
import { ReportFactory } from '../../../factories/report-factory';

describe('ScheduledReportUseCase', () => {
  let useCase: ScheduledReportUseCase;
  let mockScheduledReportRepository: jest.Mocked<IScheduledReportRepository>;
  let mockReportRepository: jest.Mocked<IReportRepository>;
  let mockCreateScheduledReportHandler: jest.Mocked<CreateScheduledReportHandler>;
  let mockGetScheduledReportHandler: jest.Mocked<GetScheduledReportHandler>;
  let mockGetScheduledReportsHandler: jest.Mocked<GetScheduledReportsHandler>;

  const mockUserId = UniqueId.generate().value;
  const mockOrganizationId = UniqueId.generate().value;
  const mockScheduledReportId = UniqueId.generate().value;
  const mockReportId = UniqueId.generate().value;
  const otherUserId = UniqueId.generate().value;

  beforeEach(() => {
    mockScheduledReportRepository = {
      findById: jest.fn(),
      findByIds: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      findBySearchCriteria: jest.fn(),
      findByReportId: jest.fn(),
      findByUserId: jest.fn(),
      findByOrganization: jest.fn(),
      findActiveScheduledReports: jest.fn(),
      findDueReports: jest.fn(),
      findByFrequency: jest.fn(),
      getExecutionHistory: jest.fn(),
      getExecutionHistoryTotalCount: jest.fn(),
      getScheduledReportStatistics: jest.fn(),
      getUpcomingExecutions: jest.fn(),
      updateExecutionStats: jest.fn(),
      bulkUpdate: jest.fn(),
      count: jest.fn(),
      exists: jest.fn(),
      existsByName: jest.fn(),
      findHighFailureRateReports: jest.fn(),
      findStaleReports: jest.fn(),
      getDeliveryStatistics: jest.fn(),
      findByRecipientEmail: jest.fn(),
      getFrequencyDistribution: jest.fn(),
      search: jest.fn(),
      getReportsForTimeWindow: jest.fn(),
      permanentlyDelete: jest.fn(),
      delete: jest.fn(),
    } as any;

    mockReportRepository = {
      findById: jest.fn(),
      findByIds: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      findBySearchCriteria: jest.fn(),
      findByUserId: jest.fn(),
      findByOrganization: jest.fn(),
      findByStatus: jest.fn(),
      findByTemplateId: jest.fn(),
      findRecentReports: jest.fn(),
      findPublishedReports: jest.fn(),
      getReportStatistics: jest.fn(),
    };

    mockCreateScheduledReportHandler = {
      handle: jest.fn(),
    } as any;

    mockGetScheduledReportHandler = {
      handle: jest.fn(),
    } as any;

    mockGetScheduledReportsHandler = {
      handle: jest.fn(),
    } as any;

    useCase = new ScheduledReportUseCase(
      mockScheduledReportRepository,
      mockReportRepository,
      mockCreateScheduledReportHandler,
      mockGetScheduledReportHandler,
      mockGetScheduledReportsHandler
    );
  });

  describe('createScheduledReport', () => {
    it('should create scheduled report successfully', async () => {
      // Arrange
      const command = new CreateScheduledReportCommand(
        'Test Scheduled Report',
        mockReportId,
        ReportFrequency.DAILY,
        'UTC',
        {
          method: 'email',
          recipients: ['test@example.com'],
          format: 'pdf',
          includeData: true
        },
        mockUserId,
        mockOrganizationId
      );

      const expectedScheduledReport = ScheduledReportFactory.createDto();
      mockCreateScheduledReportHandler.handle.mockResolvedValue(Result.success(expectedScheduledReport));

      // Act
      const result = await useCase.createScheduledReport(command);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual(expectedScheduledReport);
      expect(mockCreateScheduledReportHandler.handle).toHaveBeenCalledWith(command);
    });

    it('should fail when handler returns error', async () => {
      // Arrange
      const command = new CreateScheduledReportCommand(
        'Test Scheduled Report',
        mockReportId,
        ReportFrequency.DAILY,
        'UTC',
        {
          method: 'email',
          recipients: ['test@example.com'],
          format: 'pdf',
          includeData: true
        },
        mockUserId,
        mockOrganizationId
      );

      mockCreateScheduledReportHandler.handle.mockResolvedValue(Result.failure(new Error('Failed to create scheduled report')));

      // Act
      const result = await useCase.createScheduledReport(command);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Failed to create scheduled report');
    });
  });

  describe('getScheduledReport', () => {
    it('should get scheduled report successfully', async () => {
      // Arrange
      const expectedScheduledReport = ScheduledReportFactory.createDto();
      mockGetScheduledReportHandler.handle.mockResolvedValue(Result.success(expectedScheduledReport));

      // Act
      const result = await useCase.getScheduledReport(mockScheduledReportId);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual(expectedScheduledReport);
      expect(mockGetScheduledReportHandler.handle).toHaveBeenCalledWith(
        expect.objectContaining({ scheduledReportId: mockScheduledReportId })
      );
    });

    it('should return error when scheduled report not found', async () => {
      // Arrange
      mockGetScheduledReportHandler.handle.mockResolvedValue(Result.failure(new Error('Scheduled report not found')));

      // Act
      const result = await useCase.getScheduledReport(mockScheduledReportId);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Scheduled report not found');
    });
  });

  describe('getScheduledReports', () => {
    it('should get scheduled reports with pagination', async () => {
      // Arrange
      const expectedResult = PaginatedResult.create([], 0, 1, 10);
      mockGetScheduledReportsHandler.handle.mockResolvedValue(Result.success(expectedResult));

      // Act
      const result = await useCase.getScheduledReports({}, { page: 1, pageSize: 10 });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual(expectedResult);
    });

    it('should handle repository error', async () => {
      // Arrange
      mockGetScheduledReportsHandler.handle.mockResolvedValue(Result.failure(new Error('Database error')));

      // Act
      const result = await useCase.getScheduledReports({}, { page: 1, pageSize: 10 });

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('executeScheduledReport', () => {
    it('should start execution successfully', async () => {
      // Arrange
      const scheduledReport = ScheduledReportFactory.create({ createdBy: UniqueId.create(mockUserId) });
      const report = ReportFactory.create({ id: scheduledReport.reportId });
      mockScheduledReportRepository.findById.mockResolvedValue(scheduledReport);
      mockReportRepository.findById.mockResolvedValue(report);
      mockScheduledReportRepository.save.mockResolvedValue();

      // Act
      const result = await useCase.executeScheduledReport(scheduledReport.id.value, mockUserId);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.status).toBe(ExecutionStatus.RUNNING);
      expect(mockScheduledReportRepository.save).toHaveBeenCalled();
    });

    it('should fail if user does not have permission', async () => {
      // Arrange
      const scheduledReport = ScheduledReportFactory.create({ createdBy: UniqueId.create(otherUserId) });
      mockScheduledReportRepository.findById.mockResolvedValue(scheduledReport);

      // Act
      const result = await useCase.executeScheduledReport(scheduledReport.id.value, mockUserId);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('You do not have permission to execute this scheduled report');
    });
  });

  describe('pauseScheduledReport', () => {
    it('should pause scheduled report successfully', async () => {
      // Arrange
      const scheduledReport = ScheduledReportFactory.create({ createdBy: UniqueId.create(mockUserId) });
      scheduledReport.pause = jest.fn();
      mockScheduledReportRepository.findById.mockResolvedValue(scheduledReport);
      mockScheduledReportRepository.save.mockResolvedValue();

      // Act
      const result = await useCase.pauseScheduledReport(scheduledReport.id.value, mockUserId);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(scheduledReport.pause).toHaveBeenCalled();
      expect(mockScheduledReportRepository.save).toHaveBeenCalledWith(scheduledReport);
    });
  });

  describe('resumeScheduledReport', () => {
    it('should resume scheduled report successfully', async () => {
      // Arrange
      const scheduledReport = ScheduledReportFactory.create({ status: ScheduledReportStatus.PAUSED, createdBy: UniqueId.create(mockUserId) });
      scheduledReport.resume = jest.fn();
      scheduledReport.updateNextExecution = jest.fn();
      mockScheduledReportRepository.findById.mockResolvedValue(scheduledReport);
      mockScheduledReportRepository.save.mockResolvedValue();

      // Act
      const result = await useCase.resumeScheduledReport(scheduledReport.id.value, mockUserId);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(scheduledReport.resume).toHaveBeenCalled();
      expect(scheduledReport.updateNextExecution).toHaveBeenCalled();
      expect(mockScheduledReportRepository.save).toHaveBeenCalledWith(scheduledReport);
    });
  });

  describe('updateDeliveryConfig', () => {
    it('should update delivery configuration', async () => {
      // Arrange
      const scheduledReport = ScheduledReportFactory.create({ createdBy: UniqueId.create(mockUserId) });
      scheduledReport.updateDeliveryConfig = jest.fn();
      mockScheduledReportRepository.findById.mockResolvedValue(scheduledReport);
      mockScheduledReportRepository.save.mockResolvedValue();

      const newConfig = {
        method: 'email',
        recipients: ['updated@example.com'],
        subject: 'Updated Subject',
        message: 'Updated Message',
        format: 'pdf',
        includeCharts: false,
        compression: 'zip',
      };

      // Act
      const result = await useCase.updateDeliveryConfig(scheduledReport.id.value, newConfig, mockUserId);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(scheduledReport.updateDeliveryConfig).toHaveBeenCalled();
      expect(mockScheduledReportRepository.save).toHaveBeenCalledWith(scheduledReport);
    });
  });

  describe('getScheduledReportsDueForExecution', () => {
    it('should get due scheduled reports successfully', async () => {
      // Arrange
      const dueReports = [
        ScheduledReportFactory.create(),
        ScheduledReportFactory.create()
      ];
      mockScheduledReportRepository.findDueReports.mockResolvedValue(dueReports);

      // Act
      const result = await useCase.getScheduledReportsDueForExecution();

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value).toHaveLength(2);
      expect(mockScheduledReportRepository.findDueReports).toHaveBeenCalledWith(
        expect.any(Date)
      );
    });

    it('should handle no due reports', async () => {
      // Arrange
      mockScheduledReportRepository.findDueReports.mockResolvedValue([]);

      // Act
      const result = await useCase.getScheduledReportsDueForExecution();

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value).toHaveLength(0);
    });

    it('should handle repository error', async () => {
      // Arrange
      mockScheduledReportRepository.findDueReports.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await useCase.getScheduledReportsDueForExecution();

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('recordExecutionCompletion', () => {
    it('should record successful execution completion', async () => {
      // Arrange
      const mockScheduledReport = ScheduledReportFactory.create({
        frequency: ReportFrequency.DAILY,
        timezone: 'UTC'
      } as any);
      const executionId = 'exec-123';
      const duration = 5000;
      const recordCount = 100;
      const fileSize = 2048;

      mockScheduledReport.recordExecutionCompletion = jest.fn();
      mockScheduledReport.updateNextExecution = jest.fn();
      mockScheduledReportRepository.findById.mockResolvedValue(mockScheduledReport);
      mockScheduledReportRepository.save.mockResolvedValue();

      // Act
      const result = await useCase.recordExecutionCompletion(
        mockScheduledReportId,
        executionId,
        ExecutionStatus.COMPLETED,
        duration,
        recordCount,
        fileSize
      );

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockScheduledReport.recordExecutionCompletion).toHaveBeenCalledWith(
        executionId,
        ExecutionStatus.COMPLETED,
        duration,
        recordCount,
        fileSize,
        undefined
      );
      expect(mockScheduledReport.updateNextExecution).toHaveBeenCalled();
      expect(mockScheduledReportRepository.save).toHaveBeenCalledWith(mockScheduledReport);
    });

    it('should record failed execution completion', async () => {
      // Arrange
      const mockScheduledReport = ScheduledReportFactory.create();
      const executionId = 'exec-123';
      const duration = 1000;
      const errorMessage = 'Database connection failed';

      mockScheduledReport.recordExecutionCompletion = jest.fn();
      const nextExecSpy = jest.spyOn(mockScheduledReport, 'updateNextExecution');
      mockScheduledReportRepository.findById.mockResolvedValue(mockScheduledReport);
      mockScheduledReportRepository.save.mockResolvedValue();

      // Act
      const result = await useCase.recordExecutionCompletion(
        mockScheduledReportId,
        executionId,
        ExecutionStatus.FAILED,
        duration,
        undefined,
        undefined,
        errorMessage
      );

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockScheduledReport.recordExecutionCompletion).toHaveBeenCalledWith(
        executionId,
        ExecutionStatus.FAILED,
        duration,
        undefined,
        undefined,
        errorMessage
      );
      // Should not update next execution for failed executions
      expect(nextExecSpy).not.toHaveBeenCalled();
    });

    it('should fail when scheduled report not found', async () => {
      // Arrange
      mockScheduledReportRepository.findById.mockResolvedValue(null);

      // Act
      const result = await useCase.recordExecutionCompletion(
        mockScheduledReportId,
        'exec-123',
        ExecutionStatus.COMPLETED,
        5000
      );

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe(`Scheduled report with ID ${mockScheduledReportId} not found`);
    });
  });

  describe('concurrent operations', () => {
    it('should handle concurrent scheduled report operations', async () => {
      // Arrange
      const mockScheduledReport1 = ScheduledReportFactory.create({ createdBy: UniqueId.create(mockUserId) });
      const mockScheduledReport2 = ScheduledReportFactory.create({ status: ScheduledReportStatus.PAUSED, createdBy: UniqueId.create(mockUserId) });
      
      mockScheduledReport1.pause = jest.fn();
      mockScheduledReport2.resume = jest.fn();
      mockScheduledReport2.updateNextExecution = jest.fn();

      mockScheduledReportRepository.findById
        .mockResolvedValueOnce(mockScheduledReport1)
        .mockResolvedValueOnce(mockScheduledReport2);
      mockScheduledReportRepository.save.mockResolvedValue();

      const scheduledId1 = UniqueId.generate().value;
      const scheduledId2 = UniqueId.generate().value;

      // Act
      const [result1, result2] = await Promise.all([
        useCase.pauseScheduledReport(scheduledId1, mockUserId),
        useCase.resumeScheduledReport(scheduledId2, mockUserId)
      ]);

      // Assert
      expect(result1.isSuccess).toBe(true);
      expect(result2.isSuccess).toBe(true);
      expect(mockScheduledReport1.pause).toHaveBeenCalled();
      expect(mockScheduledReport2.resume).toHaveBeenCalled();
    });
  });
});