import { UpdateReportHandler } from '../../../../slices/reporting/application/handlers/update-report-handler';
import { UpdateReportCommand } from '../../../../slices/reporting/application/commands/update-report-command';
import { IReportRepository } from '../../../../shared/domain/reporting/repositories/report-repository';
import { Report, ReportStatus } from '../../../../shared/domain/reporting/entities/report';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { ReportConfig } from '../../../../shared/domain/reporting/value-objects/report-config';
import { ReportLayout } from '../../../../shared/domain/reporting/value-objects/report-layout';
import { ReportStyling } from '../../../../shared/domain/reporting/value-objects/report-styling';
import { ReportConfigDto } from '../../../../slices/reporting/application/dtos/report-dto';

// Mock repository
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

describe('UpdateReportHandler', () => {
  let handler: UpdateReportHandler;
  let existingReport: Report;
  let validConfig: ReportConfigDto;
  
  // Generate valid CUID format IDs for testing
  const validUserId = UniqueId.generate().value;
  const validReportId = UniqueId.generate().value;

  beforeEach(() => {
    handler = new UpdateReportHandler(mockReportRepository);
    
    // Reset all mocks
    jest.clearAllMocks();

    // Setup valid config
    validConfig = {
      title: 'Updated Config',
      description: 'Updated Description',
      filters: { category: 'sales' },
      parameters: { period: '2024' },
      layout: {
        type: 'grid',
        components: [
          {
            id: 'comp1',
            type: 'chart',
            position: { x: 0, y: 0 },
            size: { width: 2, height: 2 },
            config: { chartType: 'line' }
          }
        ],
        grid: {
          columns: 12,
          rows: 8,
          gap: 16
        }
      },
      styling: {
        theme: 'dark',
        colors: {
          primary: '#007bff',
          secondary: '#6c757d',
          accent: '#28a745',
          background: '#212529',
          text: '#ffffff'
        },
        fonts: {
          family: 'Roboto',
          sizes: { small: 12, medium: 14, large: 16 },
          weights: { normal: 400, bold: 700 }
        },
        spacing: {
          unit: 'px',
          scale: [4, 8, 16, 24, 32]
        }
      }
    };

    // Create existing report
    const reportConfig = ReportConfig.create({
      title: 'Original Config',
      description: 'Original Description',
      filters: {},
      parameters: {},
      layout: ReportLayout.create({
        type: 'grid',
        components: [],
        grid: { columns: 12, rows: 8, gap: 16 }
      }),
      styling: ReportStyling.create({
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
      })
    });

    existingReport = Report.create({
      title: 'Original Report',
      description: 'Original Description',
      config: reportConfig,
      status: ReportStatus.DRAFT,
      isPublic: false,
      createdBy: UniqueId.create(validUserId),
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    });
  });

  describe('handle', () => {
    it('should update report title successfully', async () => {
      // Arrange
      const command = new UpdateReportCommand(
        validReportId,
        validUserId,
        'Updated Report Title'
      );

      mockReportRepository.findById.mockResolvedValue(existingReport);
      mockReportRepository.existsByTitle.mockResolvedValue(false);
      mockReportRepository.save.mockResolvedValue();

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.title).toBe('Updated Report Title');
      expect(mockReportRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should update report description successfully', async () => {
      // Arrange
      const command = new UpdateReportCommand(
        validReportId,
        validUserId,
        undefined,
        'Updated Description'
      );

      mockReportRepository.findById.mockResolvedValue(existingReport);
      mockReportRepository.save.mockResolvedValue();

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.description).toBe('Updated Description');
    });

    it('should update report configuration successfully', async () => {
      // Arrange
      const command = new UpdateReportCommand(
        validReportId,
        validUserId,
        undefined,
        undefined,
        validConfig
      );

      mockReportRepository.findById.mockResolvedValue(existingReport);
      mockReportRepository.save.mockResolvedValue();

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.config.title).toBe('Updated Config');
      expect(result.value!.config.styling.theme).toBe('dark');
    });

    it('should update multiple properties at once', async () => {
      // Arrange
      const command = new UpdateReportCommand(
        validReportId,
        validUserId,
        'New Title',
        'New Description',
        validConfig
      );

      mockReportRepository.findById.mockResolvedValue(existingReport);
      mockReportRepository.existsByTitle.mockResolvedValue(false);
      mockReportRepository.save.mockResolvedValue();

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.title).toBe('New Title');
      expect(result.value!.description).toBe('New Description');
      expect(result.value!.config.title).toBe('Updated Config');
    });

    it('should fail when report not found', async () => {
      // Arrange
      const command = new UpdateReportCommand(
        validReportId,
        validUserId,
        'Updated Title'
      );

      mockReportRepository.findById.mockResolvedValue(null);

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toContain('Report not found');
    });

    it('should fail when user is not authorized', async () => {
      // Arrange
      const command = new UpdateReportCommand(
        validReportId,
        'different-user-id',
        'Updated Title'
      );

      mockReportRepository.findById.mockResolvedValue(existingReport);

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toContain('Not authorized');
    });

    it('should fail when title already exists', async () => {
      // Arrange
      const command = new UpdateReportCommand(
        validReportId,
        validUserId,
        'Existing Title'
      );

      mockReportRepository.findById.mockResolvedValue(existingReport);
      mockReportRepository.existsByTitle.mockResolvedValue(true);

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toContain('already exists');
    });

    it('should fail when repository save fails', async () => {
      // Arrange
      const command = new UpdateReportCommand(
        validReportId,
        validUserId,
        'Updated Title'
      );

      mockReportRepository.findById.mockResolvedValue(existingReport);
      mockReportRepository.existsByTitle.mockResolvedValue(false);
      mockReportRepository.save.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toContain('Database error');
    });

    it('should update report status successfully', async () => {
      // Arrange
      const command = new UpdateReportCommand(
        validReportId,
        validUserId,
        undefined,
        undefined,
        undefined,
        ReportStatus.PUBLISHED
      );

      mockReportRepository.findById.mockResolvedValue(existingReport);
      mockReportRepository.save.mockResolvedValue();

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.status).toBe(ReportStatus.PUBLISHED);
    });

    it('should update report visibility successfully', async () => {
      // Arrange
      const command = new UpdateReportCommand(
        validReportId,
        validUserId,
        undefined,
        undefined,
        undefined,
        undefined,
        true
      );

      mockReportRepository.findById.mockResolvedValue(existingReport);
      mockReportRepository.save.mockResolvedValue();

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.isPublic).toBe(true);
    });

    it('should update multiple fields successfully', async () => {
      // Arrange
      const command = new UpdateReportCommand(
        validReportId,
        validUserId,
        'New Title',
        'New Description',
        validConfig,
        ReportStatus.PUBLISHED,
        true
      );

      mockReportRepository.findById.mockResolvedValue(existingReport);
      mockReportRepository.existsByTitle.mockResolvedValue(false);
      mockReportRepository.save.mockResolvedValue();

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.title).toBe('New Title');
      expect(result.value!.description).toBe('New Description');
      expect(result.value!.status).toBe(ReportStatus.PUBLISHED);
      expect(result.value!.isPublic).toBe(true);
    });

    it('should handle command validation errors', async () => {
      // Arrange
      const command = new UpdateReportCommand(
        validReportId,
        validUserId,
        '' // Empty title should fail validation
      );

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toContain('validation');
    });
  });

  describe('error handling', () => {
    it('should handle repository findById errors', async () => {
      // Arrange
      const command = new UpdateReportCommand(
        validReportId,
        validUserId,
        'New Title'
      );

      mockReportRepository.findById.mockRejectedValue(new Error('Database connection failed'));

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toContain('Database connection failed');
    });

    it('should handle title existence check errors', async () => {
      // Arrange
      const command = new UpdateReportCommand(
        validReportId,
        validUserId,
        'New Title'
      );

      mockReportRepository.findById.mockResolvedValue(existingReport);
      mockReportRepository.existsByTitle.mockRejectedValue(new Error('Database query failed'));

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toContain('Database query failed');
    });
  });
});