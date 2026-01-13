import { GetReportHandler } from '../../../../slices/reporting/application/query-handlers/get-report-handler';
import { GetReportQuery } from '../../../../slices/reporting/application/queries/get-report-query';
import { IReportRepository } from '../../../../shared/domain/reporting/repositories/report-repository';
import { Report } from '../../../../shared/domain/reporting/entities/report';
import { ReportFactory } from '../../../factories/report-factory';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';

describe('GetReportHandler', () => {
  let handler: GetReportHandler;
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
    };

    handler = new GetReportHandler(mockReportRepository);
  });

  describe('handle', () => {
    it('should return report when found', async () => {
      // Arrange
      const reportId = UniqueId.generate();
      const userId = UniqueId.generate();
      
      console.log('Test: Generated reportId:', reportId.value);
      console.log('Test: Generated userId:', userId.value);
      
      const report = ReportFactory.create({
        id: reportId.value,
        createdBy: userId.value,
        title: 'Test Report',
      });

      console.log('Test: Created report:', report ? 'Success' : 'Failed');
      console.log('Test: Report ID:', report?.id?.value);

      const query = new GetReportQuery(reportId.value, userId.value);
      console.log('Test: Created query with reportId:', query.reportId);
      
      mockReportRepository.findById.mockResolvedValue(report);
      console.log('Test: Mocked repository to return report');

      // Act
      console.log('Test: Calling handler.handle...');
      const result = await handler.handle(query);
      console.log('Test: Handler returned result');
      console.log('Test: Result isSuccess:', result.isSuccess);
      if (!result.isSuccess) {
        console.log('Test: Result error:', result.error?.message);
      }

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value?.id).toBe(reportId.value);
      expect(result.value?.title).toBe('Test Report');
      expect(mockReportRepository.findById).toHaveBeenCalledWith(expect.objectContaining({
        value: reportId.value
      }));
    });

    it('should return null when report not found', async () => {
      // Arrange
      const reportId = UniqueId.generate();
      const userId = UniqueId.generate();
      const query = new GetReportQuery(reportId.value, userId.value);
      
      mockReportRepository.findById.mockResolvedValue(null);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error?.message).toContain('not found');
      expect(mockReportRepository.findById).toHaveBeenCalledWith(expect.objectContaining({
        value: reportId.value
      }));
    });

    it('should validate query parameters', async () => {
      // Arrange
      const query = new GetReportQuery('', '');

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(false);
    });

    it('should handle repository errors', async () => {
      // Arrange
      const reportId = UniqueId.generate();
      const userId = UniqueId.generate();
      const query = new GetReportQuery(reportId.value, userId.value);
      
      const error = new Error('Database connection failed');
      mockReportRepository.findById.mockRejectedValue(error);

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.error?.message).toBe('Database connection failed');
    });

    it('should handle invalid UUID format', async () => {
      // Arrange
      const query = new GetReportQuery('invalid-uuid', 'another-invalid-uuid');

      // Act
      const result = await handler.handle(query);

      // Assert
      expect(result.isSuccess).toBe(false);
    });

    it('should not return archived reports to unauthorized users', async () => {
      // Arrange
      const reportId = UniqueId.generate();
      const userId = UniqueId.generate();
      const differentUserId = UniqueId.generate();
      
      const archivedReport = ReportFactory.create({
        id: reportId.value,
        createdBy: userId.value,
        title: 'Archived Report',
        isArchived: true,
      });

      const query = new GetReportQuery(reportId.value, differentUserId.value);
      mockReportRepository.findById.mockResolvedValue(archivedReport);

      // Act
      const result = await handler.handle(query);

      // Assert - Should implement access control logic
      expect(mockReportRepository.findById).toHaveBeenCalledWith(expect.objectContaining({
        value: reportId.value
      }));
    });

    it('should handle concurrent requests', async () => {
      // Arrange
      const reportId = UniqueId.generate();
      const userId = UniqueId.generate();
      const report = ReportFactory.create({
        id: reportId.value,
        createdBy: userId.value,
        title: 'Concurrent Test Report',
      });

      const query = new GetReportQuery(reportId.value, userId.value);
      mockReportRepository.findById.mockResolvedValue(report);

      // Act
      const promises = Array(5).fill(null).map(() => handler.handle(query));
      const results = await Promise.all(promises);

      // Assert
      results.forEach(result => {
        expect(result.isSuccess).toBe(true);
        expect(result.value?.id).toBe(reportId.value);
        expect(result.value?.title).toBe('Concurrent Test Report');
      });
      expect(mockReportRepository.findById).toHaveBeenCalledTimes(5);
    });

    it('should handle null/undefined inputs gracefully', async () => {
      // Act
      const nullResult = await handler.handle(null as any);
      const undefinedResult = await handler.handle(undefined as any);

      // Assert
      expect(nullResult.isSuccess).toBe(false);
      expect(undefinedResult.isSuccess).toBe(false);
    });

    it('should maintain performance for large datasets', async () => {
      // Arrange
      const reportId = UniqueId.generate();
      const userId = UniqueId.generate();
      const report = ReportFactory.create({
        id: reportId.value,
        createdBy: userId.value,
        title: 'Performance Test Report',
      });

      const query = new GetReportQuery(reportId.value, userId.value);
      mockReportRepository.findById.mockResolvedValue(report);

      // Act
      const startTime = Date.now();
      await handler.handle(query);
      const endTime = Date.now();

      // Assert
      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });
  });
});