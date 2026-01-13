import { TemplateManagementUseCase } from '../../../../slices/reporting/application/use-cases/template-management-use-case';
import { CreateTemplateHandler } from '../../../../slices/reporting/application/handlers/create-template-handler';
import { GetTemplateHandler } from '../../../../slices/reporting/application/query-handlers/get-template-handler';
import { GetTemplatesHandler } from '../../../../slices/reporting/application/query-handlers/get-templates-handler';
import { IReportTemplateRepository } from '../../../../shared/domain/reporting/repositories/report-template-repository';
import { CreateTemplateCommand } from '../../../../slices/reporting/application/commands/create-template-command';
import { GetTemplateQuery } from '../../../../slices/reporting/application/queries/get-template-query';
import { GetTemplatesQuery } from '../../../../slices/reporting/application/queries/get-templates-query';
import { ReportTemplate, TemplateType, TemplateCategory } from '../../../../shared/domain/reporting/entities/report-template';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { Result } from '../../../../shared/application/base/result';
import { PaginatedResult } from '../../../../shared/application/base/paginated-result';
import { ReportTemplateDto } from '../../../../slices/reporting/application/dtos/report-template-dto';
import { ReportTemplateFactory } from '../../../factories/report-template-factory';

describe('TemplateManagementUseCase', () => {
  let useCase: TemplateManagementUseCase;
  let mockTemplateRepository: jest.Mocked<IReportTemplateRepository>;
  let mockCreateTemplateHandler: jest.Mocked<CreateTemplateHandler>;
  let mockGetTemplateHandler: jest.Mocked<GetTemplateHandler>;
  let mockGetTemplatesHandler: jest.Mocked<GetTemplatesHandler>;

  const mockUserId = 'user-123';
  const mockOrganizationId = 'org-456';
  const mockTemplateId = 'template-789';

  beforeEach(() => {
    mockTemplateRepository = {
      findById: jest.fn(),
      findByIds: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      findBySearchCriteria: jest.fn(),
      existsByName: jest.fn(),
      findByOrganization: jest.fn(),
      findSystemTemplates: jest.fn(),
      findByCategory: jest.fn(),
      findByType: jest.fn(),
      findActiveTemplates: jest.fn(),
      findRecentlyUsed: jest.fn(),
      incrementUsageCount: jest.fn(),
      updateLastUsedAt: jest.fn(),
      getTemplateStatistics: jest.fn(),
    };

    mockCreateTemplateHandler = {
      handle: jest.fn(),
    } as any;

    mockGetTemplateHandler = {
      handle: jest.fn(),
    } as any;

    mockGetTemplatesHandler = {
      handle: jest.fn(),
    } as any;

    useCase = new TemplateManagementUseCase(
      mockTemplateRepository,
      mockCreateTemplateHandler,
      mockGetTemplateHandler,
      mockGetTemplatesHandler
    );
  });

  describe('createTemplate', () => {
    it('should create template successfully', async () => {
      // Arrange
      const mockConfig = {
        title: 'Test Report',
        description: 'Test Description',
        filters: [],
        parameters: {},
        layout: {
          type: 'grid',
          components: [],
          grid: { columns: 12, rows: 8, gap: 16 }
        },
        styling: {
          theme: 'light',
          colors: { primary: '#007bff', secondary: '#6c757d', accent: '#28a745', background: '#ffffff', text: '#212529' },
          fonts: { family: 'Inter', sizes: { small: 12, medium: 14, large: 16 }, weights: { normal: 400, bold: 600 } },
          spacing: { unit: 'px', scale: [4, 8, 16, 24, 32] }
        }
      };

      const command = new CreateTemplateCommand(
        'Test Template',
        TemplateType.DASHBOARD,
        TemplateCategory.STANDARD,
        mockConfig,
        ['tag1'],
        mockUserId
      );

      const expectedTemplate = ReportTemplateFactory.createDto();
      mockCreateTemplateHandler.handle.mockResolvedValue(Result.success(expectedTemplate));

      // Act
      const result = await useCase.createTemplate(command);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual(expectedTemplate);
      expect(mockCreateTemplateHandler.handle).toHaveBeenCalledWith(command);
    });

    it('should fail when handler returns error', async () => {
      // Arrange
      const mockConfig = {
        title: 'Test Report',
        description: 'Test Description',
        filters: [],
        parameters: {},
        layout: { type: 'grid', components: [], grid: { columns: 12, rows: 8, gap: 16 } },
        styling: {
          theme: 'light',
          colors: { primary: '#007bff', secondary: '#6c757d', accent: '#28a745', background: '#ffffff', text: '#212529' },
          fonts: { family: 'Inter', sizes: { small: 12, medium: 14, large: 16 }, weights: { normal: 400, bold: 600 } },
          spacing: { unit: 'px', scale: [4, 8, 16, 24, 32] }
        }
      };

      const command = new CreateTemplateCommand(
        'Test Template',
        TemplateType.DASHBOARD,
        TemplateCategory.STANDARD,
        mockConfig,
        ['tag1'],
        mockUserId
      );

      mockCreateTemplateHandler.handle.mockResolvedValue(Result.failure('Template name already exists'));

      // Act
      const result = await useCase.createTemplate(command);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Template name already exists');
    });
  });

  describe('getTemplate', () => {
    it('should get template successfully', async () => {
      // Arrange
      const expectedTemplate = ReportTemplateFactory.createDto();
      mockGetTemplateHandler.handle.mockResolvedValue(Result.success(expectedTemplate));

      // Act
      const result = await useCase.getTemplate(mockTemplateId);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual(expectedTemplate);
      expect(mockGetTemplateHandler.handle).toHaveBeenCalledWith(
        expect.any(GetTemplateQuery)
      );
    });

    it('should fail when template not found', async () => {
      // Arrange
      mockGetTemplateHandler.handle.mockResolvedValue(Result.failure('Template not found'));

      // Act
      const result = await useCase.getTemplate(mockTemplateId);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Template not found');
    });
  });

  describe('getTemplates', () => {
    it('should get templates with pagination successfully', async () => {
      // Arrange
      const criteria = {
        name: 'Test',
        type: TemplateType.DASHBOARD,
        category: TemplateCategory.PREMIUM,
        isActive: true
      };
      const pagination = { page: 1, limit: 10, sortBy: 'name', sortOrder: 'asc' as const };

      const expectedResult = new PaginatedResult(
        [ReportTemplateFactory.createDto()],
        1,
        1,
        10,
        1
      );
      mockGetTemplatesHandler.handle.mockResolvedValue(Result.success(expectedResult));

      // Act
      const result = await useCase.getTemplates(criteria, pagination);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual(expectedResult);
      expect(mockGetTemplatesHandler.handle).toHaveBeenCalledWith(
        expect.any(GetTemplatesQuery)
      );
    });

    it('should handle empty results', async () => {
      // Arrange
      const criteria = { name: 'NonExistent' };
      const pagination = { page: 1, limit: 10 };

      const expectedResult = new PaginatedResult([], 0, 1, 10, 0);
      mockGetTemplatesHandler.handle.mockResolvedValue(Result.success(expectedResult));

      // Act
      const result = await useCase.getTemplates(criteria, pagination);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.items).toHaveLength(0);
      expect(result.value!.totalCount).toBe(0);
    });
  });

  describe('recordTemplateUsage', () => {
    it('should record template usage successfully', async () => {
      // Arrange
      const mockTemplate = ReportTemplateFactory.create();
      mockTemplate.recordUsage = jest.fn();
      mockTemplateRepository.findById.mockResolvedValue(mockTemplate);
      mockTemplateRepository.save.mockResolvedValue();

      // Act
      const result = await useCase.recordTemplateUsage(mockTemplateId);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockTemplateRepository.findById).toHaveBeenCalledWith(
        expect.any(UniqueId)
      );
      expect(mockTemplate.recordUsage).toHaveBeenCalled();
      expect(mockTemplateRepository.save).toHaveBeenCalledWith(mockTemplate);
    });

    it('should fail when template not found', async () => {
      // Arrange
      mockTemplateRepository.findById.mockResolvedValue(null);

      // Act
      const result = await useCase.recordTemplateUsage(mockTemplateId);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe(`Template with ID ${mockTemplateId} not found`);
      expect(mockTemplateRepository.save).not.toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
      // Arrange
      mockTemplateRepository.findById.mockRejectedValue(new Error('Database connection failed'));

      // Act
      const result = await useCase.recordTemplateUsage(mockTemplateId);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Database connection failed');
    });
  });

  describe('toggleTemplateStatus', () => {
    it('should activate template successfully', async () => {
      // Arrange
      const mockTemplate = ReportTemplateFactory.create({
        createdBy: UniqueId.create(mockUserId),
        isSystem: false
      });
      mockTemplate.activate = jest.fn();
      mockTemplateRepository.findById.mockResolvedValue(mockTemplate);
      mockTemplateRepository.save.mockResolvedValue();

      // Act
      const result = await useCase.toggleTemplateStatus(mockTemplateId, true, mockUserId);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockTemplate.activate).toHaveBeenCalled();
      expect(mockTemplateRepository.save).toHaveBeenCalledWith(mockTemplate);
    });

    it('should deactivate template successfully', async () => {
      // Arrange
      const mockTemplate = ReportTemplateFactory.create({
        createdBy: UniqueId.create(mockUserId),
        isSystem: false
      });
      mockTemplate.deactivate = jest.fn();
      mockTemplateRepository.findById.mockResolvedValue(mockTemplate);
      mockTemplateRepository.save.mockResolvedValue();

      // Act
      const result = await useCase.toggleTemplateStatus(mockTemplateId, false, mockUserId);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockTemplate.deactivate).toHaveBeenCalled();
      expect(mockTemplateRepository.save).toHaveBeenCalledWith(mockTemplate);
    });

    it('should fail when user lacks permission', async () => {
      // Arrange
      const mockTemplate = ReportTemplateFactory.create({
        createdBy: UniqueId.create('other-user'),
        isSystem: false
      });
      mockTemplateRepository.findById.mockResolvedValue(mockTemplate);

      // Act
      const result = await useCase.toggleTemplateStatus(mockTemplateId, true, mockUserId);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('You do not have permission to modify this template');
      expect(mockTemplateRepository.save).not.toHaveBeenCalled();
    });

    it('should allow system template modification', async () => {
      // Arrange
      const mockTemplate = ReportTemplateFactory.create({
        createdBy: UniqueId.create('other-user'),
        isSystem: true
      });
      mockTemplate.activate = jest.fn();
      mockTemplateRepository.findById.mockResolvedValue(mockTemplate);
      mockTemplateRepository.save.mockResolvedValue();

      // Act
      const result = await useCase.toggleTemplateStatus(mockTemplateId, true, mockUserId);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockTemplate.activate).toHaveBeenCalled();
    });

    it('should fail when template not found', async () => {
      // Arrange
      mockTemplateRepository.findById.mockResolvedValue(null);

      // Act
      const result = await useCase.toggleTemplateStatus(mockTemplateId, true, mockUserId);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe(`Template with ID ${mockTemplateId} not found`);
    });
  });

  describe('deleteTemplate', () => {
    it('should delete template successfully', async () => {
      // Arrange
      const mockTemplate = ReportTemplateFactory.create({
        createdBy: UniqueId.create(mockUserId),
        isSystem: false
      });
      mockTemplate.deactivate = jest.fn();
      mockTemplateRepository.findById.mockResolvedValue(mockTemplate);
      mockTemplateRepository.save.mockResolvedValue();

      // Act
      const result = await useCase.deleteTemplate(mockTemplateId, mockUserId);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockTemplate.deactivate).toHaveBeenCalled();
      expect(mockTemplateRepository.save).toHaveBeenCalledWith(mockTemplate);
    });

    it('should fail when user lacks permission', async () => {
      // Arrange
      const mockTemplate = ReportTemplateFactory.create({
        createdBy: UniqueId.create('other-user'),
        isSystem: false
      });
      mockTemplateRepository.findById.mockResolvedValue(mockTemplate);

      // Act
      const result = await useCase.deleteTemplate(mockTemplateId, mockUserId);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('You do not have permission to delete this template');
      expect(mockTemplateRepository.save).not.toHaveBeenCalled();
    });

    it('should fail when trying to delete system template', async () => {
      // Arrange
      const mockTemplate = ReportTemplateFactory.create({
        createdBy: UniqueId.create(mockUserId),
        isSystem: true
      });
      mockTemplateRepository.findById.mockResolvedValue(mockTemplate);

      // Act
      const result = await useCase.deleteTemplate(mockTemplateId, mockUserId);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('System templates cannot be deleted');
      expect(mockTemplateRepository.save).not.toHaveBeenCalled();
    });

    it('should fail when template not found', async () => {
      // Arrange
      mockTemplateRepository.findById.mockResolvedValue(null);

      // Act
      const result = await useCase.deleteTemplate(mockTemplateId, mockUserId);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe(`Template with ID ${mockTemplateId} not found`);
    });
  });

  describe('getTemplateStatistics', () => {
    it('should get template statistics successfully', async () => {
      // Arrange
      const mockTemplate = ReportTemplateFactory.create({
        usageCount: 15,
        lastUsedAt: new Date('2024-01-15')
      });
      const mockStats = {
        reportsCreated: 25,
        activeReports: 10
      };

      mockTemplateRepository.findById.mockResolvedValue(mockTemplate);
      mockTemplateRepository.getTemplateStatistics.mockResolvedValue(mockStats);

      // Act
      const result = await useCase.getTemplateStatistics(mockTemplateId);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual({
        usageCount: 15,
        lastUsedAt: new Date('2024-01-15'),
        reportsCreated: 25,
        activeReports: 10
      });
      expect(mockTemplateRepository.getTemplateStatistics).toHaveBeenCalledWith(
        expect.any(UniqueId)
      );
    });

    it('should handle template with no usage', async () => {
      // Arrange
      const mockTemplate = ReportTemplateFactory.create({
        usageCount: 0,
        lastUsedAt: undefined
      });
      const mockStats = {
        reportsCreated: 0,
        activeReports: 0
      };

      mockTemplateRepository.findById.mockResolvedValue(mockTemplate);
      mockTemplateRepository.getTemplateStatistics.mockResolvedValue(mockStats);

      // Act
      const result = await useCase.getTemplateStatistics(mockTemplateId);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.usageCount).toBe(0);
      expect(result.value!.lastUsedAt).toBeUndefined();
      expect(result.value!.reportsCreated).toBe(0);
      expect(result.value!.activeReports).toBe(0);
    });

    it('should fail when template not found', async () => {
      // Arrange
      mockTemplateRepository.findById.mockResolvedValue(null);

      // Act
      const result = await useCase.getTemplateStatistics(mockTemplateId);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe(`Template with ID ${mockTemplateId} not found`);
      expect(mockTemplateRepository.getTemplateStatistics).not.toHaveBeenCalled();
    });

    it('should handle repository statistics error', async () => {
      // Arrange
      const mockTemplate = ReportTemplateFactory.create();
      mockTemplateRepository.findById.mockResolvedValue(mockTemplate);
      mockTemplateRepository.getTemplateStatistics.mockRejectedValue(new Error('Statistics query failed'));

      // Act
      const result = await useCase.getTemplateStatistics(mockTemplateId);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Statistics query failed');
    });
  });

  describe('concurrent operations', () => {
    it('should handle concurrent template operations', async () => {
      // Arrange
      const mockTemplate1 = ReportTemplateFactory.create({ createdBy: UniqueId.create(mockUserId) });
      const mockTemplate2 = ReportTemplateFactory.create({ createdBy: UniqueId.create(mockUserId) });
      
      mockTemplate1.recordUsage = jest.fn();
      mockTemplate2.activate = jest.fn();

      mockTemplateRepository.findById
        .mockResolvedValueOnce(mockTemplate1)
        .mockResolvedValueOnce(mockTemplate2);
      mockTemplateRepository.save.mockResolvedValue();

      // Act
      const [result1, result2] = await Promise.all([
        useCase.recordTemplateUsage('template-1'),
        useCase.toggleTemplateStatus('template-2', true, mockUserId)
      ]);

      // Assert
      expect(result1.isSuccess).toBe(true);
      expect(result2.isSuccess).toBe(true);
      expect(mockTemplate1.recordUsage).toHaveBeenCalled();
      expect(mockTemplate2.activate).toHaveBeenCalled();
      expect(mockTemplateRepository.save).toHaveBeenCalledTimes(2);
    });
  });
});