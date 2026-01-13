import { CreateReportHandler } from '../../../../slices/reporting/application/handlers/create-report-handler';
import { CreateReportCommand } from '../../../../slices/reporting/application/commands/create-report-command';
import { IReportRepository } from '../../../../shared/domain/reporting/repositories/report-repository';
import { IReportTemplateRepository } from '../../../../shared/domain/reporting/repositories/report-template-repository';
import { Report, ReportStatus } from '../../../../shared/domain/reporting/entities/report';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { ReportConfigDto } from '../../../../slices/reporting/application/dtos/report-dto';
import { ValidationError } from '../../../../shared/domain/base/validation-error';

// Generate valid CUID format IDs for testing
const validUserId = UniqueId.generate().value;
const validTemplateId = UniqueId.generate().value;

// Mock repositories
const mockReportRepository: jest.Mocked<IReportRepository> = {
  save: jest.fn(),
  findById: jest.fn(),
  findByUserId: jest.fn(),
  findByOrganizationId: jest.fn(),
  findPublicReports: jest.fn(),
  delete: jest.fn(),
  exists: jest.fn(),
  existsByTitle: jest.fn(),
  findByStatus: jest.fn(),
  findByTemplate: jest.fn(),
  update: jest.fn(),
};

const mockTemplateRepository: jest.Mocked<IReportTemplateRepository> = {
  save: jest.fn(),
  findById: jest.fn(),
  findByUserId: jest.fn(),
  findByOrganizationId: jest.fn(),
  delete: jest.fn(),
  exists: jest.fn(),
  findByCategory: jest.fn(),
  findPublicTemplates: jest.fn(),
  update: jest.fn(),
};

describe('CreateReportHandler', () => {
  let handler: CreateReportHandler;
  let validConfig: ReportConfigDto;

  beforeEach(() => {
    handler = new CreateReportHandler(mockReportRepository, mockTemplateRepository);
    
    // Reset all mocks
    jest.clearAllMocks();

    // Setup valid config
    validConfig = {
      title: 'Test Config',
      description: 'Test Description',
      filters: {},
      parameters: {},
      layout: {
        type: 'grid',
        components: [
          {
            id: 'comp1',
            type: 'chart',
            position: { x: 0, y: 0 },
            size: { width: 2, height: 2 },
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
          weights: { normal: 400, bold: 700 }
        },
        spacing: {
          unit: 'px',
          scale: [4, 8, 16, 24, 32]
        }
      }
    };
  });

  describe('handle', () => {
    it('should create a report successfully with valid data', async () => {
      // Arrange
      const command = new CreateReportCommand(
        'Test Report',
        validConfig,
        false,
        validUserId,
        'Test Description'
      );

      mockTemplateRepository.exists.mockResolvedValue(true);
      mockReportRepository.existsByTitle.mockResolvedValue(false);
      mockReportRepository.save.mockResolvedValue();

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeDefined();
      expect(result.value!.title).toBe('Test Report');
      expect(result.value!.status).toBe(ReportStatus.DRAFT);
      expect(result.value!.isPublic).toBe(false);
      expect(result.value!.createdBy).toBe(validUserId);
      expect(mockReportRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should create a report with template ID when template exists', async () => {
      // Arrange
      const command = new CreateReportCommand(
        'Test Report',
        validConfig,
        false,
        validUserId,
        'Test Description',
        validTemplateId
      );

      mockTemplateRepository.exists.mockResolvedValue(true);
      mockReportRepository.existsByTitle.mockResolvedValue(false);
      mockReportRepository.save.mockResolvedValue();

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.templateId).toBe(validTemplateId);
      expect(mockTemplateRepository.exists).toHaveBeenCalledWith(
        expect.objectContaining({ value: validTemplateId })
      );
    });

    it('should fail when template does not exist', async () => {
      // Arrange
      const nonexistentTemplateId = UniqueId.generate().value;
      const command = new CreateReportCommand(
        'Test Report',
        validConfig,
        false,
        validUserId,
        'Test Description',
        nonexistentTemplateId
      );

      mockTemplateRepository.exists.mockResolvedValue(false);

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toContain(`Template with ID ${nonexistentTemplateId} not found`);
      expect(mockReportRepository.save).not.toHaveBeenCalled();
    });

    it('should fail when report title already exists for user', async () => {
      // Arrange
      const command = new CreateReportCommand(
        'Existing Report',
        validConfig,
        false,
        validUserId
      );

      mockReportRepository.existsByTitle.mockResolvedValue(true);

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toContain('A report with this title already exists');
      expect(mockReportRepository.save).not.toHaveBeenCalled();
    });

    it('should create public report successfully', async () => {
      // Arrange
      const command = new CreateReportCommand(
        'Public Report',
        validConfig,
        true,
        validUserId
      );

      mockReportRepository.existsByTitle.mockResolvedValue(false);
      mockReportRepository.save.mockResolvedValue();

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.isPublic).toBe(true);
    });

    it('should create report with organization ID', async () => {
      // Arrange
      const validOrgId = UniqueId.generate().value;
      const command = new CreateReportCommand(
        'Org Report',
        validConfig,
        false,
        validUserId,
        'Description',
        undefined,
        validOrgId
      );

      mockReportRepository.existsByTitle.mockResolvedValue(false);
      mockReportRepository.save.mockResolvedValue();

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.organizationId).toBe(validOrgId);
      expect(mockReportRepository.existsByTitle).toHaveBeenCalledWith(
        'Org Report',
        expect.objectContaining({ value: validUserId }),
        expect.objectContaining({ value: validOrgId })
      );
    });

    it('should handle repository save errors', async () => {
      // Arrange
      const command = new CreateReportCommand(
        'Test Report',
        validConfig,
        false,
        validUserId
      );

      mockReportRepository.existsByTitle.mockResolvedValue(false);
      mockReportRepository.save.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toContain('Database error');
    });

    it('should validate command before processing', async () => {
      // Arrange
      const invalidCommand = new CreateReportCommand(
        '', // Empty title
        validConfig,
        false,
        validUserId
      );

      // Act
      const result = await handler.handle(invalidCommand);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toContain('Report title is required');
      expect(mockReportRepository.save).not.toHaveBeenCalled();
    });

    it('should convert domain objects to DTOs correctly', async () => {
      // Arrange
      const command = new CreateReportCommand(
        'Test Report',
        validConfig,
        false,
        validUserId,
        'Test Description'
      );

      mockReportRepository.existsByTitle.mockResolvedValue(false);
      mockReportRepository.save.mockResolvedValue();

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.config).toBeDefined();
      expect(result.value!.config.title).toBe('Test Config');
      expect(result.value!.config.layout.components).toHaveLength(1);
      expect(result.value!.config.styling.theme).toBe('light');
    });

    it('should set correct timestamps', async () => {
      // Arrange
      const command = new CreateReportCommand(
        'Test Report',
        validConfig,
        false,
        validUserId
      );

      mockReportRepository.existsByTitle.mockResolvedValue(false);
      mockReportRepository.save.mockResolvedValue();

      const beforeTime = new Date();

      // Act
      const result = await handler.handle(command);

      // Assert
      const afterTime = new Date();
      expect(result.isSuccess).toBe(true);
      expect(result.value!.createdAt).toBeInstanceOf(Date);
      expect(result.value!.updatedAt).toBeInstanceOf(Date);
      expect(result.value!.createdAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(result.value!.createdAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe('error handling', () => {
    it('should handle template repository errors', async () => {
      // Arrange
      const command = new CreateReportCommand(
        'Test Report',
        validConfig,
        false,
        validUserId,
        'Description',
        validTemplateId
      );

      mockTemplateRepository.exists.mockRejectedValue(new Error('Template service unavailable'));

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toContain('Template service unavailable');
    });

    it('should handle title existence check errors', async () => {
      // Arrange
      const command = new CreateReportCommand(
        'Test Report',
        validConfig,
        false,
        validUserId
      );

      mockReportRepository.existsByTitle.mockRejectedValue(
        new Error('Database connection failed')
      );

      const result = await handler.handle(command);

      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('Database connection failed');
    });
  });
});