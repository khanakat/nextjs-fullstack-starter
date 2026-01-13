import { CreateTemplateHandler } from '../../../../slices/reporting/application/handlers/create-template-handler';
import { CreateTemplateCommand } from '../../../../slices/reporting/application/commands/create-template-command';
import { IReportTemplateRepository } from '../../../../shared/domain/reporting/repositories/report-template-repository';
import { ReportTemplate, TemplateType, TemplateCategory } from '../../../../shared/domain/reporting/entities/report-template';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { ReportTemplateFactory } from '../../../factories/report-template-factory';

describe('CreateTemplateHandler', () => {
  let handler: CreateTemplateHandler;
  let mockTemplateRepository: jest.Mocked<IReportTemplateRepository>;

  const mockUserId = UniqueId.generate().value;
  const mockOrganizationId = UniqueId.generate().value;

  const mockConfig = {
    title: 'Test Report',
    description: 'Test Description',
    filters: [],
    parameters: {},
    layout: {
      type: 'grid',
      components: [
        {
          id: 'comp-1',
          type: 'CHART',
          position: { x: 0, y: 0 },
          size: { width: 6, height: 4 },
          config: { chartType: 'bar' }
        }
      ],
      grid: {
        columns: 12,
        rows: 8,
        gap: 16
      }
    },
    styling: {
      theme: 'light',
      colors: {
        primary: '#007bff',
        secondary: '#6c757d',
        accent: '#28a745',
        background: '#ffffff',
        text: '#212529'
      },
      fonts: {
        family: 'Inter',
        sizes: { small: 12, medium: 14, large: 16 },
        weights: { normal: 400, bold: 600 }
      },
      spacing: {
        unit: 'px',
        scale: [4, 8, 16, 24, 32]
      }
    }
  };

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
    };

    handler = new CreateTemplateHandler(mockTemplateRepository);
  });

  describe('handle', () => {
    it('should successfully create a new template', async () => {
      // Arrange
      const command = new CreateTemplateCommand(
        'Test Template',
        TemplateType.DASHBOARD,
        TemplateCategory.STANDARD,
        mockConfig,
        ['tag1', 'tag2'],
        mockUserId,
        'Test description',
        'https://example.com/preview.jpg',
        mockOrganizationId
      );

      mockTemplateRepository.existsByName.mockResolvedValue(false);
      mockTemplateRepository.save.mockResolvedValue();

      // Act
      const result = await handler.handle(command);

      // Assert
      if (!result.isSuccess) {
        throw new Error(`Test failed with error: ${result.error.message}\nStack: ${result.error.stack}`);
      }
      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeDefined();
      expect(result.value!.name).toBe('Test Template');
      expect(result.value!.type).toBe(TemplateType.DASHBOARD);
      expect(result.value!.category).toBe(TemplateCategory.STANDARD);
      expect(result.value!.isSystem).toBe(false);
      expect(result.value!.isActive).toBe(true);
      expect(result.value!.createdBy).toBe(mockUserId);
      expect(result.value!.organizationId).toBe(mockOrganizationId);
      expect(result.value!.tags).toEqual(['tag1', 'tag2']);
      expect(result.value!.description).toBe('Test description');
      expect(result.value!.previewImageUrl).toBe('https://example.com/preview.jpg');

      expect(mockTemplateRepository.existsByName).toHaveBeenCalledWith(
        'Test Template',
        expect.any(UniqueId)
      );
      expect(mockTemplateRepository.save).toHaveBeenCalledWith(
        expect.any(ReportTemplate)
      );
    });

    it('should create template without organization ID', async () => {
      // Arrange
      const command = new CreateTemplateCommand(
        'Personal Template',
        TemplateType.DASHBOARD,
        TemplateCategory.ENTERPRISE,
        mockConfig,
        ['personal'],
        mockUserId
      );

      mockTemplateRepository.existsByName.mockResolvedValue(false);
      mockTemplateRepository.save.mockResolvedValue();

      // Act
      const result = await handler.handle(command);



      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.organizationId).toBeUndefined();
      expect(mockTemplateRepository.existsByName).toHaveBeenCalledWith(
        'Personal Template',
        undefined
      );
    });

    it('should handle duplicate template name error', async () => {
      // Arrange
      const command = new CreateTemplateCommand(
        'Existing Template',
        TemplateType.DASHBOARD,
        TemplateCategory.STANDARD,
        mockConfig,
        [],
        mockUserId,
        undefined,
        undefined,
        mockOrganizationId
      );

      mockTemplateRepository.existsByName.mockResolvedValue(true);

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toBe('A template with this name already exists');
      expect(mockTemplateRepository.save).not.toHaveBeenCalled();
    });

    it('should handle repository save error', async () => {
      // Arrange
      const command = new CreateTemplateCommand(
        'Test Template',
        TemplateType.DASHBOARD,
        TemplateCategory.STANDARD,
        mockConfig,
        [],
        mockUserId
      );

      mockTemplateRepository.existsByName.mockResolvedValue(false);
      mockTemplateRepository.save.mockRejectedValue(new Error('Database connection failed'));

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toBe('Database connection failed');
    });

    it('should handle repository existsByName error', async () => {
      // Arrange
      const command = new CreateTemplateCommand(
        'Test Template',
        TemplateType.DASHBOARD,
        TemplateCategory.STANDARD,
        mockConfig,
        [],
        mockUserId
      );

      mockTemplateRepository.existsByName.mockRejectedValue(new Error('Database query failed'));

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toBe('Database query failed');
      expect(mockTemplateRepository.save).not.toHaveBeenCalled();
    });

    it('should validate command parameters', async () => {
      // Arrange - Create command with invalid name
      const command = new CreateTemplateCommand(
        '', // Empty name
        TemplateType.DASHBOARD,
        TemplateCategory.STANDARD,
        mockConfig,
        [],
        mockUserId
      );

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toBe('Template name is required');
      expect(mockTemplateRepository.existsByName).not.toHaveBeenCalled();
      expect(mockTemplateRepository.save).not.toHaveBeenCalled();
    });

    it('should validate name length', async () => {
      // Arrange
      const longName = 'a'.repeat(256); // Exceeds 255 character limit
      const command = new CreateTemplateCommand(
        longName,
        TemplateType.DASHBOARD,
        TemplateCategory.STANDARD,
        mockConfig,
        [],
        mockUserId
      );

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toBe('Template name cannot exceed 255 characters');
    });

    it('should validate description length', async () => {
      // Arrange
      const longDescription = 'a'.repeat(1001); // Exceeds 1000 character limit
      const command = new CreateTemplateCommand(
        'Valid Name',
        TemplateType.DASHBOARD,
        TemplateCategory.STANDARD,
        mockConfig,
        [],
        mockUserId,
        longDescription
      );

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toBe('Template description cannot exceed 1000 characters');
    });

    it('should validate tags array', async () => {
      // Arrange
      const tooManyTags = Array(11).fill('tag'); // Exceeds 10 tag limit
      const command = new CreateTemplateCommand(
        'Valid Name',
        TemplateType.DASHBOARD,
        TemplateCategory.STANDARD,
        mockConfig,
        tooManyTags,
        mockUserId
      );

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toBe('Template cannot have more than 10 tags');
    });

    it('should validate individual tag length', async () => {
      // Arrange
      const longTag = 'a'.repeat(51); // Exceeds 50 character limit
      const command = new CreateTemplateCommand(
        'Valid Name',
        TemplateType.DASHBOARD,
        TemplateCategory.STANDARD,
        mockConfig,
        [longTag],
        mockUserId
      );

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toBe('Each tag cannot exceed 50 characters');
    });

    it('should validate empty tags', async () => {
      // Arrange
      const command = new CreateTemplateCommand(
        'Valid Name',
        TemplateType.DASHBOARD,
        TemplateCategory.STANDARD,
        mockConfig,
        ['valid-tag', ''], // Empty tag
        mockUserId
      );

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toBe('All tags must be non-empty strings');
    });

    it('should handle different template types', async () => {
      // Arrange
      const command = new CreateTemplateCommand(
        'Report Template',
        TemplateType.DASHBOARD,
        TemplateCategory.PREMIUM,
        mockConfig,
        [],
        mockUserId
      );

      mockTemplateRepository.existsByName.mockResolvedValue(false);
      mockTemplateRepository.save.mockResolvedValue();

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.type).toBe(TemplateType.DASHBOARD);
      expect(result.value!.category).toBe(TemplateCategory.PREMIUM);
    });

    it('should handle different template categories', async () => {
      // Arrange
      const command = new CreateTemplateCommand(
        'Financial Template',
        TemplateType.DASHBOARD,
        TemplateCategory.ENTERPRISE,
        mockConfig,
        [],
        mockUserId
      );

      mockTemplateRepository.existsByName.mockResolvedValue(false);
      mockTemplateRepository.save.mockResolvedValue();

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.category).toBe(TemplateCategory.ENTERPRISE);
    });

    it('should handle concurrent template creation requests', async () => {
      // Arrange
      const command1 = new CreateTemplateCommand(
        'Template 1',
        TemplateType.DASHBOARD,
        TemplateCategory.STANDARD,
        mockConfig,
        [],
        mockUserId
      );

      const command2 = new CreateTemplateCommand(
        'Template 2',
        TemplateType.DASHBOARD,
        TemplateCategory.ENTERPRISE,
        mockConfig,
        [],
        mockUserId
      );

      mockTemplateRepository.existsByName.mockResolvedValue(false);
      mockTemplateRepository.save.mockResolvedValue();

      // Act
      const [result1, result2] = await Promise.all([
        handler.handle(command1),
        handler.handle(command2)
      ]);

      // Assert
      expect(result1.isSuccess).toBe(true);
      expect(result2.isSuccess).toBe(true);
      expect(result1.value!.name).toBe('Template 1');
      expect(result2.value!.name).toBe('Template 2');
      expect(mockTemplateRepository.save).toHaveBeenCalledTimes(2);
    });

    it('should handle null/undefined inputs gracefully', async () => {
      // Arrange
      const command = new CreateTemplateCommand(
        'Valid Name',
        TemplateType.DASHBOARD,
        TemplateCategory.STANDARD,
        mockConfig,
        [],
        mockUserId,
        undefined, // description
        undefined, // previewImageUrl
        undefined  // organizationId
      );

      mockTemplateRepository.existsByName.mockResolvedValue(false);
      mockTemplateRepository.save.mockResolvedValue();

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.description).toBeUndefined();
      expect(result.value!.previewImageUrl).toBeUndefined();
      expect(result.value!.organizationId).toBeUndefined();
    });

    it('should correctly convert complex configuration to DTO', async () => {
      // Arrange
      const complexConfig = {
        ...mockConfig,
        layout: {
          ...mockConfig.layout,
          components: [
            {
              id: 'chart-1',
              type: 'CHART',
              position: { x: 0, y: 0 },
              size: { width: 8, height: 6 },
              config: { 
                dataSource: 'sales',
                xAxis: 'date',
                yAxis: 'revenue',
                aggregation: 'sum'
              }
            },
            {
              id: 'table-1',
              type: 'TABLE',
              position: { x: 8, y: 0 },
              size: { width: 4, height: 6 },
              config: {
                columns: ['name', 'value', 'change'],
                sortable: true,
                filterable: true
              }
            }
          ]
        }
      };

      const command = new CreateTemplateCommand(
        'Complex Template',
        TemplateType.DASHBOARD,
        TemplateCategory.STANDARD,
        complexConfig,
        ['complex', 'multi-component'],
        mockUserId
      );

      mockTemplateRepository.existsByName.mockResolvedValue(false);
      mockTemplateRepository.save.mockResolvedValue();

      // Act
      const result = await handler.handle(command);

      // Assert
      if (!result.isSuccess) {
        throw new Error(`Test failed with error: ${result.error}`);
      }
      expect(result.isSuccess).toBe(true);
      expect(result.value!.config.layout.components).toHaveLength(2);
      expect(result.value!.config.layout.components[0].type).toBe('CHART');
      expect(result.value!.config.layout.components[1].type).toBe('TABLE');
      expect(result.value!.config.layout.components[0].config.dataSource).toBe('sales');
      expect(result.value!.config.layout.components[1].config.sortable).toBe(true);
    });

    it('should set correct timestamps and metadata', async () => {
      // Arrange
      const beforeCreation = new Date();
      const command = new CreateTemplateCommand(
        'Timestamped Template',
        TemplateType.DASHBOARD,
        TemplateCategory.STANDARD,
        mockConfig,
        [],
        mockUserId,
        undefined,
        undefined,
        mockOrganizationId
      );

      mockTemplateRepository.existsByName.mockResolvedValue(false);
      mockTemplateRepository.save.mockResolvedValue();

      // Act
      const result = await handler.handle(command);
      const afterCreation = new Date();

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.createdAt).toBeInstanceOf(Date);
      expect(result.value!.updatedAt).toBeInstanceOf(Date);
      expect(result.value!.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(result.value!.createdAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
      expect(result.value!.usageCount).toBe(0);
      expect(result.value!.lastUsedAt).toBeUndefined();
    });
  });
});
