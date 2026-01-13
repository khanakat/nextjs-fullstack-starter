import { GetTemplateHandler } from '../../../../slices/reporting/application/query-handlers/get-template-handler';
import { GetTemplateQuery } from '../../../../slices/reporting/application/queries/get-template-query';
import { IReportTemplateRepository } from '../../../../shared/domain/reporting/repositories/report-template-repository';
import { ReportTemplate, TemplateType, TemplateCategory } from '../../../../shared/domain/reporting/entities/report-template';
import { ReportTemplateFactory } from '../../../factories/report-template-factory';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';

describe('GetTemplateHandler', () => {
  let handler: GetTemplateHandler;
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
    };

    handler = new GetTemplateHandler(mockTemplateRepository);
  });

  describe('handle', () => {
    it('should return template when found', async () => {
      // Arrange
      const templateId = UniqueId.generate();
      const userId = UniqueId.generate();
      
      const template = ReportTemplateFactory.create({
        id: templateId.value,
        createdBy: userId.value,
        name: 'Sales Dashboard Template',
        type: TemplateType.DASHBOARD,
        category: TemplateCategory.STANDARD,
        description: 'A comprehensive sales dashboard template',
      });

      const query = new GetTemplateQuery(templateId.value, userId.value);
      mockTemplateRepository.findById.mockResolvedValue(template);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value?.id).toBe(templateId.value);
      expect(result.value?.name).toBe('Sales Dashboard Template');
      expect(result.value?.type).toBe(TemplateType.DASHBOARD);
      expect(result.value?.category).toBe(TemplateCategory.STANDARD);
      expect(result.value?.description).toBe('A comprehensive sales dashboard template');
      expect(mockTemplateRepository.findById).toHaveBeenCalledWith(expect.objectContaining({
        value: templateId.value
      }));
    });

    it('should return error when template not found', async () => {
      // Arrange
      const templateId = UniqueId.generate();
      const userId = UniqueId.generate();
      const query = new GetTemplateQuery(templateId.value, userId.value);
      
      mockTemplateRepository.findById.mockResolvedValue(null);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error?.message).toContain('not found');
      expect(mockTemplateRepository.findById).toHaveBeenCalledWith(expect.objectContaining({
        value: templateId.value
      }));
    });

    it('should validate query parameters', async () => {
      // Arrange
      const query = new GetTemplateQuery('', '');

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(false);
    });

    it('should handle repository errors', async () => {
      // Arrange
      const templateId = UniqueId.generate();
      const userId = UniqueId.generate();
      const query = new GetTemplateQuery(templateId.value, userId.value);
      
      const error = new Error('Database connection failed');
      mockTemplateRepository.findById.mockRejectedValue(error);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error?.message).toBe('Database connection failed');
    });

    it('should handle invalid UUID format', async () => {
      // Arrange
      const query = new GetTemplateQuery('invalid-uuid', 'another-invalid-uuid');

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(false);
    });

    it('should return system templates', async () => {
      // Arrange
      const templateId = UniqueId.generate();
      const userId = UniqueId.generate();
      
      const systemTemplate = ReportTemplateFactory.create({
        id: templateId.value,
        createdBy: userId.value,
        name: 'System Analytics Template',
        type: TemplateType.DASHBOARD,
        category: TemplateCategory.PREMIUM,
        isSystem: true,
        isActive: true,
      });

      const query = new GetTemplateQuery(templateId.value, userId.value);
      mockTemplateRepository.findById.mockResolvedValue(systemTemplate);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value?.isSystem).toBe(true);
      expect(result.value?.isActive).toBe(true);
    });

    it('should return inactive templates', async () => {
      // Arrange
      const templateId = UniqueId.generate();
      const userId = UniqueId.generate();
      
      const inactiveTemplate = ReportTemplateFactory.create({
        id: templateId.value,
        createdBy: userId.value,
        name: 'Inactive Template',
        type: TemplateType.CUSTOM,
        category: TemplateCategory.ENTERPRISE,
        isSystem: false,
        isActive: false,
      });

      const query = new GetTemplateQuery(templateId.value, userId.value);
      mockTemplateRepository.findById.mockResolvedValue(inactiveTemplate);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value?.isActive).toBe(false);
    });

    it('should handle concurrent requests', async () => {
      // Arrange
      const templateId = UniqueId.generate();
      const userId = UniqueId.generate();
      const template = ReportTemplateFactory.create({
        id: templateId.value,
        createdBy: userId.value,
        name: 'Concurrent Test Template',
      });

      const query = new GetTemplateQuery(templateId.value, userId.value);
      mockTemplateRepository.findById.mockResolvedValue(template);

      // Act
      const promises = Array(5).fill(null).map(() => handler.handle(query));
      const results = await Promise.all(promises);

      // Assert
      results.forEach(result => {
        expect(result.isSuccess).toBe(true);
        expect(result.value?.id).toBe(templateId.value);
        expect(result.value?.name).toBe('Concurrent Test Template');
      });
      expect(mockTemplateRepository.findById).toHaveBeenCalledTimes(5);
    });

    it('should handle null/undefined inputs gracefully', async () => {
      // Act
      const nullResult = await handler.handle(null as any);
      const undefinedResult = await handler.handle(undefined as any);

      // Assert
      expect(nullResult.isSuccess).toBe(false);
      expect(undefinedResult.isSuccess).toBe(false);
    });

    it('should convert template to DTO correctly', async () => {
      // Arrange
      const templateId = UniqueId.generate();
      const userId = UniqueId.generate();
      const organizationId = UniqueId.generate();
      
      const template = ReportTemplateFactory.create({
        id: templateId.value,
        createdBy: userId.value,
        organizationId: organizationId.value,
        name: 'Complete Template',
        type: TemplateType.DASHBOARD,
        category: TemplateCategory.PREMIUM,
        description: 'A complete template with all fields',
        tags: ['sales', 'dashboard', 'analytics'],
        previewImageUrl: 'https://example.com/preview.jpg',
        isSystem: false,
        isActive: true,
        usageCount: 42,
        lastUsedAt: new Date('2024-01-15'),
      });

      const query = new GetTemplateQuery(templateId.value, userId.value);
      mockTemplateRepository.findById.mockResolvedValue(template);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(true);
      const dto = result.value;
      expect(dto?.id).toBe(templateId.value);
      expect(dto?.name).toBe('Complete Template');
      expect(dto?.type).toBe(TemplateType.DASHBOARD);
      expect(dto?.category).toBe(TemplateCategory.PREMIUM);
      expect(dto?.description).toBe('A complete template with all fields');
      expect(dto?.tags).toEqual(['sales', 'dashboard', 'analytics']);
      expect(dto?.previewImageUrl).toBe('https://example.com/preview.jpg');
      expect(dto?.isSystem).toBe(false);
      expect(dto?.isActive).toBe(true);
      expect(dto?.createdBy).toBe(userId.value);
      expect(dto?.organizationId).toBe(organizationId.value);
      expect(dto?.usageCount).toBe(42);
      expect(dto?.lastUsedAt).toEqual(new Date('2024-01-15'));
    });

    it('should handle templates with complex configurations', async () => {
      // Arrange
      const templateId = UniqueId.generate();
      const userId = UniqueId.generate();
      
      const template = ReportTemplateFactory.create({
        id: templateId.value,
        createdBy: userId.value,
        name: 'Complex Config Template',
        type: TemplateType.DASHBOARD,
        category: TemplateCategory.ENTERPRISE,
      });

      const query = new GetTemplateQuery(templateId.value, userId.value);
      mockTemplateRepository.findById.mockResolvedValue(template);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value?.config).toBeDefined();
      expect(result.value?.config.layout).toBeDefined();
      expect(result.value?.config.styling).toBeDefined();
    });

    it('should handle performance for frequently accessed templates', async () => {
      // Arrange
      const templateId = UniqueId.generate();
      const userId = UniqueId.generate();
      const template = ReportTemplateFactory.create({
        id: templateId.value,
        createdBy: userId.value,
        name: 'Popular Template',
        usageCount: 1000,
      });

      const query = new GetTemplateQuery(templateId.value, userId.value);
      mockTemplateRepository.findById.mockResolvedValue(template);

      const startTime = Date.now();

      // Act
      const result = await handler.handle(query);
      const endTime = Date.now();

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value?.usageCount).toBe(1000);
      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });
  });
});