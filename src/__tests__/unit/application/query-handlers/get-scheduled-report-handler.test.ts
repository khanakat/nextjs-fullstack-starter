import { GetScheduledReportHandler } from '../../../../slices/reporting/application/query-handlers/get-scheduled-report-handler';
import { GetScheduledReportQuery } from '../../../../slices/reporting/application/queries/get-scheduled-report-query';
import { IScheduledReportRepository } from '../../../../shared/domain/reporting/repositories/scheduled-report-repository';
import { ScheduledReport } from '../../../../shared/domain/reporting/entities/scheduled-report';
import { ScheduledReportFactory } from '../../../factories/scheduled-report-factory';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { ScheduledReportDto } from '../../../../slices/reporting/application/dtos/scheduled-report-dto';

describe('GetScheduledReportHandler', () => {
  let handler: GetScheduledReportHandler;
  let mockScheduledReportRepository: jest.Mocked<IScheduledReportRepository>;
  let scheduledReportFactory: ScheduledReportFactory;

  beforeEach(() => {
    mockScheduledReportRepository = {
      findById: jest.fn(),
      findByName: jest.fn(),
      findByOrganization: jest.fn(),
      findByCreator: jest.fn(),
      findByTemplate: jest.fn(),
      findDue: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      exists: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    };

    handler = new GetScheduledReportHandler(mockScheduledReportRepository);
    scheduledReportFactory = new ScheduledReportFactory();
  });

  describe('handle', () => {
    it('should return scheduled report when found', async () => {
      // Arrange
      const scheduledReportId = UniqueId.generate();
      const userId = UniqueId.generate();
      const scheduledReport = scheduledReportFactory.create({
        id: scheduledReportId,
        name: 'Weekly Sales Report',
        description: 'Automated weekly sales report',
      });

      const query = new GetScheduledReportQuery(scheduledReportId.value, userId.value);
      mockScheduledReportRepository.findById.mockResolvedValue(scheduledReport);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeInstanceOf(ScheduledReportDto);
      expect(result.value.id).toBe(scheduledReportId.value);
      expect(result.value.name).toBe('Weekly Sales Report');
      expect(mockScheduledReportRepository.findById).toHaveBeenCalledWith(scheduledReportId);
    });

    it('should return error when scheduled report not found', async () => {
      // Arrange
      const scheduledReportId = UniqueId.generate();
      const userId = UniqueId.generate();
      const query = new GetScheduledReportQuery(scheduledReportId.value, userId.value);
      
      mockScheduledReportRepository.findById.mockResolvedValue(null);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain(`Scheduled report with ID ${scheduledReportId.value} not found`);
      expect(mockScheduledReportRepository.findById).toHaveBeenCalledWith(scheduledReportId);
    });

    it('should validate query parameters', async () => {
      // Arrange
      const userId = UniqueId.generate();
      
      // Act & Assert
      const emptyIdQuery = new GetScheduledReportQuery('', userId.value);
      const emptyResult = await handler.handle(emptyIdQuery);
      expect(emptyResult.isFailure).toBe(true);

      const whitespaceIdQuery = new GetScheduledReportQuery('   ', userId.value);
      const whitespaceResult = await handler.handle(whitespaceIdQuery);
      expect(whitespaceResult.isFailure).toBe(true);
    });

    it('should handle invalid UUID format', async () => {
      // Arrange
      const userId = UniqueId.generate();
      const invalidId = 'invalid-uuid-format';
      const query = new GetScheduledReportQuery(invalidId, userId.value);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Invalid UUID format');
    });

    it('should handle repository errors', async () => {
      // Arrange
      const scheduledReportId = UniqueId.generate();
      const userId = UniqueId.generate();
      const query = new GetScheduledReportQuery(scheduledReportId.value, userId.value);
      
      const error = new Error('Database connection failed');
      mockScheduledReportRepository.findById.mockRejectedValue(error);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Database connection failed');
    });

    it('should handle access control for organization-specific reports', async () => {
      // Arrange
      const scheduledReportId = UniqueId.generate();
      const userId = UniqueId.generate();
      const organizationId = UniqueId.generate();
      const differentOrgId = UniqueId.generate();
      
      const scheduledReport = scheduledReportFactory.create({
        id: scheduledReportId,
        organizationId: organizationId,
        name: 'Organization Report',
      });

      const query = new GetScheduledReportQuery(scheduledReportId.value, userId.value);
      mockScheduledReportRepository.findById.mockResolvedValue(scheduledReport);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.organizationId).toBe(organizationId.value);
    });

    it('should handle archived scheduled reports', async () => {
      // Arrange
      const scheduledReportId = UniqueId.generate();
      const userId = UniqueId.generate();
      const scheduledReport = scheduledReportFactory.create({
        id: scheduledReportId,
        name: 'Archived Report',
        isActive: false,
      });

      const query = new GetScheduledReportQuery(scheduledReportId.value, userId.value);
      mockScheduledReportRepository.findById.mockResolvedValue(scheduledReport);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.isActive).toBe(false);
    });

    it('should handle concurrent requests efficiently', async () => {
      // Arrange
      const scheduledReportId = UniqueId.generate();
      const userId = UniqueId.generate();
      const scheduledReport = scheduledReportFactory.create({
        id: scheduledReportId,
        name: 'Concurrent Test Report',
      });

      const query = new GetScheduledReportQuery(scheduledReportId.value, userId.value);
      mockScheduledReportRepository.findById.mockResolvedValue(scheduledReport);

      // Act
      const promises = Array(10).fill(null).map(() => handler.handle(query));
      const results = await Promise.all(promises);

      // Assert
      results.forEach(result => {
        expect(result.isSuccess).toBe(true);
        expect(result.value.id).toBe(scheduledReportId.value);
      });
      expect(mockScheduledReportRepository.findById).toHaveBeenCalledTimes(10);
    });

    it('should handle null/undefined inputs gracefully', async () => {
      // Act & Assert
      const nullResult = await handler.handle(null as any);
      expect(nullResult.isFailure).toBe(true);

      const undefinedResult = await handler.handle(undefined as any);
      expect(undefinedResult.isFailure).toBe(true);
    });

    it('should maintain performance for complex scheduled reports', async () => {
      // Arrange
      const scheduledReportId = UniqueId.generate();
      const userId = UniqueId.generate();
      const scheduledReport = scheduledReportFactory.create({
        id: scheduledReportId,
        name: 'Complex Performance Test Report',
        description: 'A complex report with many configurations and parameters',
      });

      const query = new GetScheduledReportQuery(scheduledReportId.value, userId.value);
      mockScheduledReportRepository.findById.mockResolvedValue(scheduledReport);

      // Act
      const startTime = Date.now();
      const result = await handler.handle(query);
      const endTime = Date.now();

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });

    it('should handle scheduled reports with execution history', async () => {
      // Arrange
      const scheduledReportId = UniqueId.generate();
      const userId = UniqueId.generate();
      const scheduledReport = scheduledReportFactory.create({
        id: scheduledReportId,
        name: 'Report with History',
        executionCount: 25,
        successCount: 23,
        lastExecutedAt: new Date('2024-01-15T10:00:00Z'),
      });

      const query = new GetScheduledReportQuery(scheduledReportId.value, userId.value);
      mockScheduledReportRepository.findById.mockResolvedValue(scheduledReport);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.executionCount).toBe(25);
      expect(result.value.successCount).toBe(23);
      expect(result.value.lastExecutedAt).toEqual(new Date('2024-01-15T10:00:00Z'));
    });

    it('should handle scheduled reports with different frequencies', async () => {
      // Arrange
      const scheduledReportId = UniqueId.generate();
      const userId = UniqueId.generate();
      const scheduledReport = scheduledReportFactory.create({
        id: scheduledReportId,
        name: 'Daily Report',
        frequency: 'daily',
        nextRunAt: new Date('2024-01-16T09:00:00Z'),
      });

      const query = new GetScheduledReportQuery(scheduledReportId.value, userId.value);
      mockScheduledReportRepository.findById.mockResolvedValue(scheduledReport);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.frequency).toBe('daily');
      expect(result.value.nextRunAt).toEqual(new Date('2024-01-16T09:00:00Z'));
    });

    it('should handle scheduled reports with recipients', async () => {
      // Arrange
      const scheduledReportId = UniqueId.generate();
      const userId = UniqueId.generate();
      const scheduledReport = scheduledReportFactory.create({
        id: scheduledReportId,
        name: 'Report with Recipients',
        recipients: ['user1@example.com', 'user2@example.com'],
      });

      const query = new GetScheduledReportQuery(scheduledReportId.value, userId.value);
      mockScheduledReportRepository.findById.mockResolvedValue(scheduledReport);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.recipients).toEqual(['user1@example.com', 'user2@example.com']);
    });

    it('should handle scheduled reports with custom parameters', async () => {
      // Arrange
      const scheduledReportId = UniqueId.generate();
      const userId = UniqueId.generate();
      const customParameters = {
        dateRange: '30days',
        includeCharts: true,
        format: 'pdf',
      };
      
      const scheduledReport = scheduledReportFactory.create({
        id: scheduledReportId,
        name: 'Parameterized Report',
        parameters: customParameters,
      });

      const query = new GetScheduledReportQuery(scheduledReportId.value, userId.value);
      mockScheduledReportRepository.findById.mockResolvedValue(scheduledReport);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.parameters).toEqual(customParameters);
    });

    it('should handle user authorization for private reports', async () => {
      // Arrange
      const scheduledReportId = UniqueId.generate();
      const userId = UniqueId.generate();
      const creatorId = UniqueId.generate();
      
      const scheduledReport = scheduledReportFactory.create({
        id: scheduledReportId,
        name: 'Private Report',
        createdBy: creatorId,
        isPublic: false,
      });

      const query = new GetScheduledReportQuery(scheduledReportId.value, userId.value);
      mockScheduledReportRepository.findById.mockResolvedValue(scheduledReport);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.createdBy).toBe(creatorId.value);
      expect(result.value.isPublic).toBe(false);
    });

    it('should handle timeout scenarios gracefully', async () => {
      // Arrange
      const scheduledReportId = UniqueId.generate();
      const userId = UniqueId.generate();
      const query = new GetScheduledReportQuery(scheduledReportId.value, userId.value);
      
      // Simulate timeout
      mockScheduledReportRepository.findById.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Request timeout');
    });
  });
});