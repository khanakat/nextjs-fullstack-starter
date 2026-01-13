import { GetScheduledReportsHandler } from '../../../../slices/reporting/application/query-handlers/get-scheduled-reports-handler';
import { GetScheduledReportsQuery, ScheduledReportSearchCriteria } from '../../../../slices/reporting/application/queries/get-scheduled-reports-query';
import { IScheduledReportRepository } from '../../../../shared/domain/reporting/repositories/scheduled-report-repository';
import { ScheduledReport, ScheduleFrequency, ScheduledReportStatus } from '../../../../shared/domain/reporting/entities/scheduled-report';
import { ScheduledReportFactory } from '../../../factories/scheduled-report-factory';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { PaginationDto } from '../../../../shared/application/base/dto';
import { PaginatedResult } from '../../../../shared/application/base/paginated-result';

describe('GetScheduledReportsHandler', () => {
  let handler: GetScheduledReportsHandler;
  let mockScheduledReportRepository: jest.Mocked<IScheduledReportRepository>;

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
      delete: jest.fn(),
      bulkUpdate: jest.fn(),
      findMany: jest.fn(),
      findManyWithPagination: jest.fn(),
      findDueForExecution: jest.fn(),
      updateLastExecution: jest.fn(),
      updateNextExecution: jest.fn(),
    };

    handler = new GetScheduledReportsHandler(mockScheduledReportRepository);
  });

  describe('handle', () => {
    it('should return paginated scheduled reports with default pagination', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const scheduledReports = [
        ScheduledReportFactory.create({
          id: UniqueId.generate(),
          name: 'Daily Sales Report',
          frequency: ScheduleFrequency.DAILY,
          createdBy: userId,
        }),
        ScheduledReportFactory.create({
          id: UniqueId.generate(),
          name: 'Weekly Analytics Report',
          frequency: ScheduleFrequency.WEEKLY,
          createdBy: userId,
        }),
      ];

      const mockResult = {
        items: scheduledReports,
        totalCount: 2,
        page: 1,
        limit: 20,
      };

      mockScheduledReportRepository.findManyWithPagination.mockResolvedValue(mockResult);

      const query = new GetScheduledReportsQuery({}, { page: 1, pageSize: 20 }, userId.value);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeInstanceOf(PaginatedResult);
      expect(result.value?.items).toHaveLength(2);
      expect(result.value?.totalCount).toBe(2);
      expect(result.value?.page).toBe(1);
      expect(result.value?.pageSize).toBe(20);
      expect(mockScheduledReportRepository.findManyWithPagination).toHaveBeenCalledWith(
        {},
        1,
        20,
        undefined,
        undefined
      );
    });

    it('should filter scheduled reports by name', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const criteria: ScheduledReportSearchCriteria = { name: 'Sales' };
      const scheduledReports = [
        ScheduledReportFactory.create({
          id: UniqueId.generate(),
          name: 'Daily Sales Report',
          createdBy: userId,
        }),
      ];

      const mockResult = {
        items: scheduledReports,
        totalCount: 1,
        page: 1,
        limit: 20,
      };

      mockScheduledReportRepository.findManyWithPagination.mockResolvedValue(mockResult);

      const query = new GetScheduledReportsQuery(criteria, { page: 1, pageSize: 20 }, userId.value);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value?.items).toHaveLength(1);
      expect(mockScheduledReportRepository.findManyWithPagination).toHaveBeenCalledWith(
        { name: 'Sales' },
        1,
        20,
        undefined,
        undefined
      );
    });

    it('should filter scheduled reports by report ID', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const reportId = UniqueId.generate();
      const criteria: ScheduledReportSearchCriteria = { reportId: reportId.value };

      const mockResult = {
        items: [],
        totalCount: 0,
        page: 1,
        limit: 20,
      };

      mockScheduledReportRepository.findManyWithPagination.mockResolvedValue(mockResult);

      const query = new GetScheduledReportsQuery(criteria, { page: 1, pageSize: 20 }, userId.value);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockScheduledReportRepository.findManyWithPagination).toHaveBeenCalledWith(
        { reportId: reportId.value },
        1,
        20,
        undefined,
        undefined
      );
    });

    it('should filter scheduled reports by frequency', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const criteria: ScheduledReportSearchCriteria = { frequency: ScheduleFrequency.WEEKLY };

      const mockResult = {
        items: [],
        totalCount: 0,
        page: 1,
        limit: 20,
      };

      mockScheduledReportRepository.findManyWithPagination.mockResolvedValue(mockResult);

      const query = new GetScheduledReportsQuery(criteria, { page: 1, pageSize: 20 }, userId.value);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockScheduledReportRepository.findManyWithPagination).toHaveBeenCalledWith(
        { frequency: ScheduleFrequency.WEEKLY },
        1,
        20,
        undefined,
        undefined
      );
    });

    it('should filter scheduled reports by active status', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const criteria: ScheduledReportSearchCriteria = { isActive: true };

      const mockResult = {
        items: [],
        totalCount: 0,
        page: 1,
        limit: 20,
      };

      mockScheduledReportRepository.findManyWithPagination.mockResolvedValue(mockResult);

      const query = new GetScheduledReportsQuery(criteria, { page: 1, pageSize: 20 }, userId.value);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockScheduledReportRepository.findManyWithPagination).toHaveBeenCalledWith(
        { isActive: true },
        1,
        20,
        undefined,
        undefined
      );
    });

    it('should filter scheduled reports by creator', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const creatorId = UniqueId.generate();
      const criteria: ScheduledReportSearchCriteria = { createdBy: creatorId.value };

      const mockResult = {
        items: [],
        totalCount: 0,
        page: 1,
        limit: 20,
      };

      mockScheduledReportRepository.findManyWithPagination.mockResolvedValue(mockResult);

      const query = new GetScheduledReportsQuery(criteria, { page: 1, pageSize: 20 }, userId.value);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockScheduledReportRepository.findManyWithPagination).toHaveBeenCalledWith(
        { createdBy: creatorId.value },
        1,
        20,
        undefined,
        undefined
      );
    });

    it('should filter scheduled reports by organization', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const organizationId = UniqueId.generate();
      const criteria: ScheduledReportSearchCriteria = { organizationId: organizationId.value };

      const mockResult = {
        items: [],
        totalCount: 0,
        page: 1,
        limit: 20,
      };

      mockScheduledReportRepository.findManyWithPagination.mockResolvedValue(mockResult);

      const query = new GetScheduledReportsQuery(criteria, { page: 1, pageSize: 20 }, userId.value);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockScheduledReportRepository.findManyWithPagination).toHaveBeenCalledWith(
        { organizationId: organizationId.value },
        1,
        20,
        undefined,
        undefined
      );
    });

    it('should filter scheduled reports by next execution date range', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const criteria: ScheduledReportSearchCriteria = {
        nextExecutionAfter: startDate,
        nextExecutionBefore: endDate,
      };

      const mockResult = {
        items: [],
        totalCount: 0,
        page: 1,
        limit: 20,
      };

      mockScheduledReportRepository.findManyWithPagination.mockResolvedValue(mockResult);

      const query = new GetScheduledReportsQuery(criteria, { page: 1, pageSize: 20 }, userId.value);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockScheduledReportRepository.findManyWithPagination).toHaveBeenCalledWith(
        {
          nextExecution: {
            gte: startDate,
            lte: endDate,
          },
        },
        1,
        20,
        undefined,
        undefined
      );
    });

    it('should filter scheduled reports by last execution date range', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const criteria: ScheduledReportSearchCriteria = {
        lastExecutionAfter: startDate,
        lastExecutionBefore: endDate,
      };

      const mockResult = {
        items: [],
        totalCount: 0,
        page: 1,
        limit: 20,
      };

      mockScheduledReportRepository.findManyWithPagination.mockResolvedValue(mockResult);

      const query = new GetScheduledReportsQuery(criteria, { page: 1, pageSize: 20 }, userId.value);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockScheduledReportRepository.findManyWithPagination).toHaveBeenCalledWith(
        {
          lastExecution: {
            gte: startDate,
            lte: endDate,
          },
        },
        1,
        20,
        undefined,
        undefined
      );
    });

    it('should filter scheduled reports by creation date range', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const criteria: ScheduledReportSearchCriteria = {
        createdAfter: startDate,
        createdBefore: endDate,
      };

      const mockResult = {
        items: [],
        totalCount: 0,
        page: 1,
        limit: 20,
      };

      mockScheduledReportRepository.findManyWithPagination.mockResolvedValue(mockResult);

      const query = new GetScheduledReportsQuery(criteria, { page: 1, pageSize: 20 }, userId.value);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockScheduledReportRepository.findManyWithPagination).toHaveBeenCalledWith(
        {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        1,
        20,
        undefined,
        undefined
      );
    });

    it('should handle multiple filter criteria', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const organizationId = UniqueId.generate();
      const reportId = UniqueId.generate();
      const criteria: ScheduledReportSearchCriteria = {
        name: 'Sales',
        reportId: reportId.value,
        frequency: ScheduleFrequency.DAILY,
        organizationId: organizationId.value,
        isActive: true,
      };

      const mockResult = {
        items: [],
        totalCount: 0,
        page: 1,
        limit: 20,
      };

      mockScheduledReportRepository.findManyWithPagination.mockResolvedValue(mockResult);

      const query = new GetScheduledReportsQuery(criteria, { page: 1, pageSize: 20 }, userId.value);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockScheduledReportRepository.findManyWithPagination).toHaveBeenCalledWith(
        {
          name: 'Sales',
          reportId: reportId.value,
          frequency: ScheduleFrequency.DAILY,
          organizationId: organizationId.value,
          isActive: true,
        },
        1,
        20,
        undefined,
        undefined
      );
    });

    it('should handle custom pagination', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const pagination: PaginationDto = { page: 3, pageSize: 5 };

      const mockResult = {
        items: [],
        totalCount: 50,
        page: 3,
        limit: 5,
      };

      mockScheduledReportRepository.findManyWithPagination.mockResolvedValue(mockResult);

      const query = new GetScheduledReportsQuery({}, pagination, userId.value);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value?.page).toBe(3);
      expect(result.value?.pageSize).toBe(5);
      expect(mockScheduledReportRepository.findManyWithPagination).toHaveBeenCalledWith(
        {},
        3,
        5,
        undefined,
        undefined
      );
    });

    it('should handle repository errors', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const query = new GetScheduledReportsQuery({}, { page: 1, pageSize: 20 }, userId.value);
      
      const error = new Error('Database connection failed');
      mockScheduledReportRepository.findManyWithPagination.mockRejectedValue(error);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error?.message).toBe('Database connection failed');
    });

    it('should handle empty results', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const mockResult = {
        items: [],
        totalCount: 0,
        page: 1,
        limit: 20,
      };

      mockScheduledReportRepository.findManyWithPagination.mockResolvedValue(mockResult);

      const query = new GetScheduledReportsQuery({}, { page: 1, pageSize: 20 }, userId.value);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value?.items).toHaveLength(0);
      expect(result.value?.totalCount).toBe(0);
    });

    it('should validate query parameters', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const invalidPagination: PaginationDto = { page: 0, pageSize: 200 };

      // Act & Assert
      expect(() => {
        new GetScheduledReportsQuery({}, invalidPagination, userId.value);
      }).toThrow();
    });

    it('should validate date range parameters', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const invalidCriteria: ScheduledReportSearchCriteria = {
        nextExecutionAfter: new Date('2024-12-31'),
        nextExecutionBefore: new Date('2024-01-01'),
      };

      // Act & Assert
      expect(() => {
        new GetScheduledReportsQuery(invalidCriteria, { page: 1, pageSize: 20 }, userId.value);
      }).toThrow('Next execution after date cannot be later than next execution before date');
    });

    it('should handle concurrent requests efficiently', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const mockResult = {
        items: [],
        totalCount: 0,
        page: 1,
        limit: 20,
      };

      mockScheduledReportRepository.findManyWithPagination.mockResolvedValue(mockResult);

      const query = new GetScheduledReportsQuery({}, { page: 1, pageSize: 20 }, userId.value);

      // Act
      const promises = Array(10).fill(null).map(() => handler.handle(query));
      const results = await Promise.all(promises);

      // Assert
      results.forEach(result => {
        expect(result.isSuccess).toBe(true);
      });
      expect(mockScheduledReportRepository.findManyWithPagination).toHaveBeenCalledTimes(10);
    });

    it('should handle null/undefined inputs gracefully', async () => {
      // Act
      const nullResult = await handler.handle(null as any);
      const undefinedResult = await handler.handle(undefined as any);

      // Assert
      expect(nullResult.isSuccess).toBe(false);
      expect(undefinedResult.isSuccess).toBe(false);
    });

    it('should convert scheduled reports to DTOs correctly', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const organizationId = UniqueId.generate();
      const reportId = UniqueId.generate();
      
      const scheduledReport = ScheduledReportFactory.create({
        id: UniqueId.generate(),
        name: 'Test Scheduled Report',
        description: 'Test Description',
        reportId: reportId,
        frequency: ScheduleFrequency.WEEKLY,
        createdBy: userId,
        organizationId: organizationId,
        isActive: true,
      });

      const mockResult = {
        items: [scheduledReport],
        totalCount: 1,
        page: 1,
        limit: 20,
      };

      mockScheduledReportRepository.findManyWithPagination.mockResolvedValue(mockResult);

      const query = new GetScheduledReportsQuery({}, { page: 1, pageSize: 20 }, userId.value);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(true);
      const dto = result.value?.items[0];
      expect(dto?.id).toBe(scheduledReport.id.value);
      expect(dto?.name).toBe('Test Scheduled Report');
      expect(dto?.description).toBe('Test Description');
      expect(dto?.reportId).toBe(reportId.value);
      expect(dto?.frequency).toBe(ScheduleFrequency.WEEKLY);
      expect(dto?.createdBy).toBe(userId.value);
      expect(dto?.organizationId).toBe(organizationId.value);
      expect(dto?.isActive).toBe(true);
    });

    it('should handle scheduled reports with different frequencies', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const scheduledReports = [
        ScheduledReportFactory.create({
          id: UniqueId.generate(),
          name: 'Hourly Report',
          frequency: ScheduleFrequency.HOURLY,
          createdBy: userId,
        }),
        ScheduledReportFactory.create({
          id: UniqueId.generate(),
          name: 'Monthly Report',
          frequency: ScheduleFrequency.MONTHLY,
          createdBy: userId,
        }),
      ];

      const mockResult = {
        items: scheduledReports,
        totalCount: 2,
        page: 1,
        limit: 20,
      };

      mockScheduledReportRepository.findManyWithPagination.mockResolvedValue(mockResult);

      const query = new GetScheduledReportsQuery({}, { page: 1, pageSize: 20 }, userId.value);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value?.items).toHaveLength(2);
      expect(result.value?.items[0]?.frequency).toBe(ScheduleFrequency.HOURLY);
      expect(result.value?.items[1]?.frequency).toBe(ScheduleFrequency.MONTHLY);
    });
  });
});