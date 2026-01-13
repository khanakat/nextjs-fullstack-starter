import { GetTemplatesHandler } from '../../../../slices/reporting/application/query-handlers/get-templates-handler';
import { GetTemplatesQuery, TemplateSearchCriteria } from '../../../../slices/reporting/application/queries/get-templates-query';
import { IReportTemplateRepository } from '../../../../shared/domain/reporting/repositories/report-template-repository';
import { ReportTemplate, TemplateType, TemplateCategory } from '../../../../shared/domain/reporting/entities/report-template';
import { ReportTemplateFactory } from '../../../factories/report-template-factory';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { PaginationDto } from '../../../../shared/application/base/dto';
import { PaginatedResult } from '../../../../shared/application/base/paginated-result';

describe('GetTemplatesHandler', () => {
  let handler: GetTemplatesHandler;
  let mockTemplateRepository: jest.Mocked<IReportTemplateRepository>;

  beforeEach(() => {
    mockTemplateRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByIds: jest.fn(),
      findByName: jest.fn(),
      findByCategory: jest.fn(),
      findByType: jest.fn(),
      findByCreator: jest.fn(),
      findByOrganization: jest.fn(),
      findSystemTemplates: jest.fn(),
      findActiveTemplates: jest.fn(),
      search: jest.fn(),
      count: jest.fn(),
      exists: jest.fn(),
      existsByName: jest.fn(),
      delete: jest.fn(),
      getPopularTemplates: jest.fn(),
      getRecentTemplates: jest.fn(),
      incrementUsageCount: jest.fn(),
      bulkUpdate: jest.fn(),
      findMany: jest.fn(),
      findManyWithPagination: jest.fn(),
    };

    handler = new GetTemplatesHandler(mockTemplateRepository);
  });

  describe('handle', () => {
    it('should return paginated templates with default pagination', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const templates = [
        ReportTemplateFactory.create({
          id: UniqueId.generate().value,
          createdBy: userId.value,
          name: 'Template 1',
          type: TemplateType.DASHBOARD,
          category: TemplateCategory.STANDARD,
        }),
        ReportTemplateFactory.create({
          id: UniqueId.generate().value,
          createdBy: userId.value,
          name: 'Template 2',
          type: TemplateType.REPORT,
          category: TemplateCategory.STANDARD,
        }),
      ];

      const mockResult = {
        items: templates,
        totalCount: 2,
        page: 1,
        limit: 20,
      };

      mockTemplateRepository.findManyWithPagination.mockResolvedValue(mockResult);

      const query = new GetTemplatesQuery({}, { page: 1, pageSize: 20 }, userId.value);

      // Act
      const result = await handler.handle(query);

      // Assert
      if (!result.isSuccess) {
        console.log('Error:', result.error);
        console.log('Error message:', result.error?.message);
        console.log('Error stack:', result.error?.stack);
      }
      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeInstanceOf(PaginatedResult);
      expect(result.value?.items).toHaveLength(2);
      expect(result.value?.totalCount).toBe(2);
      expect(result.value?.page).toBe(1);
      expect(result.value?.pageSize).toBe(20);
      expect(mockTemplateRepository.findManyWithPagination).toHaveBeenCalledWith(
        {},
        1,
        20,
        undefined,
        undefined
      );
    });

    it('should filter templates by name', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const criteria: TemplateSearchCriteria = { name: 'Sales' };
      const templates = [
        ReportTemplateFactory.create({
          id: UniqueId.generate().value,
          createdBy: userId.value,
          name: 'Sales Dashboard Template',
          type: TemplateType.DASHBOARD,
          category: TemplateCategory.PREMIUM,
        }),
      ];

      const mockResult = {
        items: templates,
        totalCount: 1,
        page: 1,
        limit: 20,
      };

      mockTemplateRepository.findManyWithPagination.mockResolvedValue(mockResult);

      const query = new GetTemplatesQuery(criteria, { page: 1, pageSize: 20 }, userId.value);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value?.items).toHaveLength(1);
      expect(mockTemplateRepository.findManyWithPagination).toHaveBeenCalledWith(
        { name: 'Sales' },
        1,
        20,
        undefined,
        undefined
      );
    });

    it('should filter templates by category', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const criteria: TemplateSearchCriteria = { category: TemplateCategory.STANDARD };
      const templates = [
        ReportTemplateFactory.create({
          id: UniqueId.generate().value,
          createdBy: userId.value,
          name: 'Analytics Template',
          type: TemplateType.REPORT,
          category: TemplateCategory.STANDARD,
        }),
      ];

      const mockResult = {
        items: templates,
        totalCount: 1,
        page: 1,
        limit: 20,
      };

      mockTemplateRepository.findManyWithPagination.mockResolvedValue(mockResult);

      const query = new GetTemplatesQuery(criteria, { page: 1, pageSize: 20 }, userId.value);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockTemplateRepository.findManyWithPagination).toHaveBeenCalledWith(
        { category: TemplateCategory.STANDARD },
        1,
        20,
        undefined,
        undefined
      );
    });

    it('should filter templates by active status', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const criteria: TemplateSearchCriteria = { isActive: true };

      const mockResult = {
        items: [],
        totalCount: 0,
        page: 1,
        limit: 20,
      };

      mockTemplateRepository.findManyWithPagination.mockResolvedValue(mockResult);

      const query = new GetTemplatesQuery(criteria, { page: 1, pageSize: 20 }, userId.value);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockTemplateRepository.findManyWithPagination).toHaveBeenCalledWith(
        { isActive: true },
        1,
        20,
        undefined,
        undefined
      );
    });

    it('should filter templates by creator', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const creatorId = UniqueId.generate();
      const criteria: TemplateSearchCriteria = { createdBy: creatorId.value };

      const mockResult = {
        items: [],
        totalCount: 0,
        page: 1,
        limit: 20,
      };

      mockTemplateRepository.findManyWithPagination.mockResolvedValue(mockResult);

      const query = new GetTemplatesQuery(criteria, { page: 1, pageSize: 20 }, userId.value);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockTemplateRepository.findManyWithPagination).toHaveBeenCalledWith(
        { createdBy: creatorId.value },
        1,
        20,
        undefined,
        undefined
      );
    });

    it('should filter templates by organization', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const organizationId = UniqueId.generate();
      const criteria: TemplateSearchCriteria = { organizationId: organizationId.value };

      const mockResult = {
        items: [],
        totalCount: 0,
        page: 1,
        limit: 20,
      };

      mockTemplateRepository.findManyWithPagination.mockResolvedValue(mockResult);

      const query = new GetTemplatesQuery(criteria, { page: 1, pageSize: 20 }, userId.value);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockTemplateRepository.findManyWithPagination).toHaveBeenCalledWith(
        { organizationId: organizationId.value },
        1,
        20,
        undefined,
        undefined
      );
    });

    it('should filter templates by date range', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const criteria: TemplateSearchCriteria = {
        createdAfter: startDate,
        createdBefore: endDate,
      };

      const mockResult = {
        items: [],
        totalCount: 0,
        page: 1,
        limit: 20,
      };

      mockTemplateRepository.findManyWithPagination.mockResolvedValue(mockResult);

      const query = new GetTemplatesQuery(criteria, { page: 1, pageSize: 20 }, userId.value);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockTemplateRepository.findManyWithPagination).toHaveBeenCalledWith(
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
      const criteria: TemplateSearchCriteria = {
        name: 'Sales',
        category: TemplateCategory.ENTERPRISE,
        organizationId: organizationId.value,
        isActive: true,
      };

      const mockResult = {
        items: [],
        totalCount: 0,
        page: 1,
        limit: 20,
      };

      mockTemplateRepository.findManyWithPagination.mockResolvedValue(mockResult);

      const query = new GetTemplatesQuery(criteria, { page: 1, pageSize: 20 }, userId.value);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockTemplateRepository.findManyWithPagination).toHaveBeenCalledWith(
        {
          name: 'Sales',
          category: TemplateCategory.SALES,
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
      const pagination: PaginationDto = { page: 2, pageSize: 10 };

      const mockResult = {
        items: [],
        totalCount: 25,
        page: 2,
        limit: 10,
      };

      mockTemplateRepository.findManyWithPagination.mockResolvedValue(mockResult);

      const query = new GetTemplatesQuery({}, pagination, userId.value);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value?.page).toBe(2);
      expect(result.value?.pageSize).toBe(10);
      expect(mockTemplateRepository.findManyWithPagination).toHaveBeenCalledWith(
        {},
        2,
        10,
        undefined,
        undefined
      );
    });

    it('should handle repository errors', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const query = new GetTemplatesQuery({}, { page: 1, pageSize: 20 }, userId.value);
      
      const error = new Error('Database connection failed');
      mockTemplateRepository.findManyWithPagination.mockRejectedValue(error);

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

      mockTemplateRepository.findManyWithPagination.mockResolvedValue(mockResult);

      const query = new GetTemplatesQuery({}, { page: 1, pageSize: 20 }, userId.value);

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
        new GetTemplatesQuery({}, invalidPagination, userId.value);
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

      mockTemplateRepository.findManyWithPagination.mockResolvedValue(mockResult);

      const query = new GetTemplatesQuery({}, { page: 1, pageSize: 20 }, userId.value);

      // Act
      const promises = Array(10).fill(null).map(() => handler.handle(query));
      const results = await Promise.all(promises);

      // Assert
      results.forEach(result => {
        expect(result.isSuccess).toBe(true);
      });
      expect(mockTemplateRepository.findManyWithPagination).toHaveBeenCalledTimes(10);
    });

    it('should handle null/undefined inputs gracefully', async () => {
      // Act
      const nullResult = await handler.handle(null as any);
      const undefinedResult = await handler.handle(undefined as any);

      // Assert
      expect(nullResult.isSuccess).toBe(false);
      expect(undefinedResult.isSuccess).toBe(false);
    });

    it('should convert templates to DTOs correctly', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const organizationId = UniqueId.generate();
      
      const template = ReportTemplateFactory.create({
        id: UniqueId.generate().value,
        createdBy: userId.value,
        organizationId: organizationId.value,
        name: 'Test Template',
        type: TemplateType.DASHBOARD,
        category: TemplateCategory.SALES,
        description: 'Test Description',
        isSystem: false,
        isActive: true,
        tags: ['test', 'template'],
        usageCount: 5,
      });

      const mockResult = {
        items: [template],
        totalCount: 1,
        page: 1,
        limit: 20,
      };

      mockTemplateRepository.findManyWithPagination.mockResolvedValue(mockResult);

      const query = new GetTemplatesQuery({}, { page: 1, pageSize: 20 }, userId.value);

      // Act
      const result = await handler.handle(query);

      // Assert
      if (!result.isSuccess) {
        console.log('Error:', result.error);
      }
      expect(result.isSuccess).toBe(true);
      const dto = result.value?.items[0];
      expect(dto?.id).toBe(template.id.value);
      expect(dto?.name).toBe('Test Template');
      expect(dto?.type).toBe(TemplateType.DASHBOARD);
      expect(dto?.category).toBe(TemplateCategory.STANDARD);
      expect(dto?.description).toBe('Test Description');
      expect(dto?.isSystem).toBe(false);
      expect(dto?.isActive).toBe(true);
      expect(dto?.createdBy).toBe(userId.value);
      expect(dto?.organizationId).toBe(organizationId.value);
    });

    it('should handle system templates filtering', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const criteria: TemplateSearchCriteria = { isSystem: true };

      const systemTemplate = ReportTemplateFactory.create({
        id: UniqueId.generate().value,
        createdBy: userId.value,
        name: 'System Template',
        isSystem: true,
        isActive: true,
      });

      const mockResult = {
        items: [systemTemplate],
        totalCount: 1,
        page: 1,
        limit: 20,
      };

      mockTemplateRepository.findManyWithPagination.mockResolvedValue(mockResult);

      const query = new GetTemplatesQuery(criteria, { page: 1, pageSize: 20 }, userId.value);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value?.items).toHaveLength(1);
      expect(result.value?.items[0]?.isSystem).toBe(true);
    });
  });
});