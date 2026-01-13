import { GetReportsHandler } from '../../../../slices/reporting/application/query-handlers/get-reports-handler';
import { GetReportsQuery, ReportSearchCriteria } from '../../../../slices/reporting/application/queries/get-reports-query';
import { IReportRepository } from '../../../../shared/domain/reporting/repositories/report-repository';
import { Report, ReportStatus } from '../../../../shared/domain/reporting/entities/report';
import { ReportFactory } from '../../../factories/report-factory';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { PaginationDto } from '../../../../shared/application/base/dto';
import { PaginatedResult } from '../../../../shared/application/base/paginated-result';

describe('GetReportsHandler', () => {
  let handler: GetReportsHandler;
  let mockReportRepository: jest.Mocked<IReportRepository>;

  beforeEach(() => {
    mockReportRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByIds: jest.fn(),
      findByCreator: jest.fn(),
      findByOrganization: jest.fn(),
      findByTemplate: jest.fn(),
      findPublicReports: jest.fn(),
      search: jest.fn(),
      findByStatus: jest.fn(),
      findReportsForArchival: jest.fn(),
      count: jest.fn(),
      exists: jest.fn(),
      existsByTitle: jest.fn(),
      delete: jest.fn(),
      permanentlyDelete: jest.fn(),
      getPopularReports: jest.fn(),
      getRecentReports: jest.fn(),
      getReportsByTemplate: jest.fn(),
      bulkUpdate: jest.fn(),
      getReportStatistics: jest.fn(),
      findMany: jest.fn(),
    };

    handler = new GetReportsHandler(mockReportRepository);
  });

  describe('handle', () => {
    it('should return paginated reports with default pagination', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const reports = [
        ReportFactory.create({
          id: UniqueId.generate().value,
          createdBy: userId.value,
          title: 'Report 1',
        }),
        ReportFactory.create({
          id: UniqueId.generate().value,
          createdBy: userId.value,
          title: 'Report 2',
        }),
      ];

      const mockResult = {
        items: reports,
        totalCount: 2,
        page: 1,
        limit: 20,
      };

      mockReportRepository.findMany.mockResolvedValue(mockResult);

      const query = new GetReportsQuery({}, { page: 1, pageSize: 20 }, userId.value);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeInstanceOf(PaginatedResult);
      expect(result.value?.items).toHaveLength(2);
      expect(result.value?.totalCount).toBe(2);
      expect(result.value?.page).toBe(1);
      expect(result.value?.pageSize).toBe(20);
      expect(mockReportRepository.findMany).toHaveBeenCalledWith(
        {},
        {
          page: 1,
          limit: 20,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        }
      );
    });

    it('should filter reports by title', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const criteria: ReportSearchCriteria = { title: 'Sales' };
      const reports = [
        ReportFactory.create({
          id: UniqueId.generate().value,
          createdBy: userId.value,
          title: 'Sales Report Q1',
        }),
      ];

      const mockResult = {
        items: reports,
        totalCount: 1,
        page: 1,
        limit: 20,
      };

      mockReportRepository.findMany.mockResolvedValue(mockResult);

      const query = new GetReportsQuery(criteria, { page: 1, pageSize: 20 }, userId.value);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value?.items).toHaveLength(1);
      expect(mockReportRepository.findMany).toHaveBeenCalledWith(
        { title: { contains: 'Sales', mode: 'insensitive' } },
        expect.any(Object)
      );
    });

    it('should filter reports by status', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const criteria: ReportSearchCriteria = { status: ReportStatus.PUBLISHED };
      const reports = [
        ReportFactory.create({
          id: UniqueId.generate().value,
          createdBy: userId.value,
          title: 'Published Report',
          status: ReportStatus.PUBLISHED,
        }),
      ];

      const mockResult = {
        items: reports,
        totalCount: 1,
        page: 1,
        limit: 20,
      };

      mockReportRepository.findMany.mockResolvedValue(mockResult);

      const query = new GetReportsQuery(criteria, { page: 1, pageSize: 20 }, userId.value);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockReportRepository.findMany).toHaveBeenCalledWith(
        { status: ReportStatus.PUBLISHED },
        expect.any(Object)
      );
    });

    it('should filter reports by date range', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const criteria: ReportSearchCriteria = {
        createdAfter: startDate,
        createdBefore: endDate,
      };

      const mockResult = {
        items: [],
        totalCount: 0,
        page: 1,
        limit: 20,
      };

      mockReportRepository.findMany.mockResolvedValue(mockResult);

      const query = new GetReportsQuery(criteria, { page: 1, pageSize: 20 }, userId.value);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockReportRepository.findMany).toHaveBeenCalledWith(
        {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        expect.any(Object)
      );
    });

    it('should filter reports by tags', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const criteria: ReportSearchCriteria = { tags: ['sales', 'quarterly'] };

      const mockResult = {
        items: [],
        totalCount: 0,
        page: 1,
        limit: 20,
      };

      mockReportRepository.findMany.mockResolvedValue(mockResult);

      const query = new GetReportsQuery(criteria, { page: 1, pageSize: 20 }, userId.value);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockReportRepository.findMany).toHaveBeenCalledWith(
        { tags: { hasSome: ['sales', 'quarterly'] } },
        expect.any(Object)
      );
    });

    it('should handle multiple filter criteria', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const organizationId = UniqueId.generate();
      const criteria: ReportSearchCriteria = {
        title: 'Sales',
        status: ReportStatus.PUBLISHED,
        organizationId: organizationId.value,
        isPublic: true,
      };

      const mockResult = {
        items: [],
        totalCount: 0,
        page: 1,
        limit: 20,
      };

      mockReportRepository.findMany.mockResolvedValue(mockResult);

      const query = new GetReportsQuery(criteria, { page: 1, pageSize: 20 }, userId.value);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockReportRepository.findMany).toHaveBeenCalledWith(
        {
          title: { contains: 'Sales', mode: 'insensitive' },
          status: ReportStatus.PUBLISHED,
          organizationId: organizationId.value,
          isPublic: true,
        },
        expect.any(Object)
      );
    });

    it('should handle custom pagination', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const pagination: PaginationDto = { page: 2, pageSize: 10 };

      const mockResult = {
        items: [],
        totalCount: 25,
        page: 2,
        limit: 10,
      };

      mockReportRepository.findMany.mockResolvedValue(mockResult);

      const query = new GetReportsQuery({}, pagination, userId.value);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value?.page).toBe(2);
      expect(result.value?.pageSize).toBe(10);
      expect(mockReportRepository.findMany).toHaveBeenCalledWith(
        {},
        {
          page: 2,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        }
      );
    });

    it('should handle repository errors', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const query = new GetReportsQuery({}, { page: 1, pageSize: 20 }, userId.value);
      
      const error = new Error('Database connection failed');
      mockReportRepository.findMany.mockRejectedValue(error);

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

      mockReportRepository.findMany.mockResolvedValue(mockResult);

      const query = new GetReportsQuery({}, { page: 1, pageSize: 20 }, userId.value);

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
        new GetReportsQuery({}, invalidPagination, userId.value);
      }).toThrow();
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

      mockReportRepository.findMany.mockResolvedValue(mockResult);

      const query = new GetReportsQuery({}, { page: 1, pageSize: 20 }, userId.value);

      // Act
      const promises = Array(10).fill(null).map(() => handler.handle(query));
      const results = await Promise.all(promises);

      // Assert
      results.forEach(result => {
        expect(result.isSuccess).toBe(true);
      });
      expect(mockReportRepository.findMany).toHaveBeenCalledTimes(10);
    });

    it('should handle null/undefined inputs gracefully', async () => {
      // Act
      const nullResult = await handler.handle(null as any);
      const undefinedResult = await handler.handle(undefined as any);

      // Assert
      expect(nullResult.isSuccess).toBe(false);
      expect(undefinedResult.isSuccess).toBe(false);
    });

    it('should convert reports to DTOs correctly', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const organizationId = UniqueId.generate();
      const templateId = UniqueId.generate();
      
      const report = ReportFactory.create({
        id: UniqueId.generate().value,
        createdBy: userId.value,
        title: 'Test Report',
        status: ReportStatus.PUBLISHED,
        organizationId: organizationId.value,
        templateId: templateId.value,
        isPublic: true,
        description: 'Test Description',
      });

      const mockResult = {
        items: [report],
        totalCount: 1,
        page: 1,
        limit: 20,
      };

      mockReportRepository.findMany.mockResolvedValue(mockResult);

      const query = new GetReportsQuery({}, { page: 1, pageSize: 20 }, userId.value);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(true);
      const dto = result.value?.items[0];
      expect(dto?.id).toBe(report.id.value);
      expect(dto?.title).toBe('Test Report');
      expect(dto?.status).toBe(ReportStatus.PUBLISHED);
      expect(dto?.isPublic).toBe(true);
      expect(dto?.createdBy).toBe(userId.value);
      expect(dto?.organizationId).toBe(organizationId.value);
      expect(dto?.templateId).toBe(templateId.value);
      expect(dto?.description).toBe('Test Description');
    });
  });
});