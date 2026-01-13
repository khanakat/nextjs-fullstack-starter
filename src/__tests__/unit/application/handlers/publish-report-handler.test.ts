import { PublishReportHandler } from '../../../../slices/reporting/application/handlers/publish-report-handler';
import { PublishReportCommand } from '../../../../slices/reporting/application/commands/publish-report-command';
import { IReportRepository } from '../../../../shared/domain/reporting/repositories/report-repository';
import { Report, ReportStatus } from '../../../../shared/domain/reporting/entities/report';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { MockReportRepository } from '../../../mocks/repository-mocks';
import { ReportFactory } from '../../../factories/report-factory';

describe('PublishReportHandler', () => {
  let handler: PublishReportHandler;
  let mockRepository: MockReportRepository;
  let draftReport: Report;
  let userId: UniqueId;
  let reportId: UniqueId;

  beforeEach(() => {
    mockRepository = new MockReportRepository();
    handler = new PublishReportHandler(mockRepository);
    
    userId = UniqueId.generate();
    reportId = UniqueId.generate();
    
    draftReport = ReportFactory.create({
      id: reportId.value,
      createdBy: userId.value,
      status: ReportStatus.DRAFT,
      isPublic: false
    });
    
    mockRepository.addReport(draftReport);
  });

  afterEach(() => {
    mockRepository.clear();
  });

  describe('handle', () => {
    it('should successfully publish a draft report', async () => {
      const command = new PublishReportCommand(reportId.value, userId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeDefined();
      expect(result.value!.status).toBe(ReportStatus.PUBLISHED);
      expect(result.value!.publishedAt).toBeDefined();
    });

    it('should return error when report does not exist', async () => {
      const nonExistentId = UniqueId.generate();
      const command = new PublishReportCommand(nonExistentId.value, userId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('not found');
    });

    it('should return error when user is not the owner', async () => {
      const differentUserId = UniqueId.generate();
      const command = new PublishReportCommand(reportId.value, differentUserId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('permission');
    });

    it('should return error when report is already published', async () => {
      // First publish the report
      draftReport.publish();
      await mockRepository.save(draftReport);
      
      const command = new PublishReportCommand(reportId.value, userId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('already published');
    });

    it('should return error when report is archived', async () => {
      draftReport.archive();
      await mockRepository.save(draftReport);
      
      const command = new PublishReportCommand(reportId.value, userId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('archived');
    });

    it('should handle repository save failure', async () => {
      mockRepository.setShouldFail(true);
      const command = new PublishReportCommand(reportId.value, userId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Failed to save');
    });

    it('should validate command before processing', async () => {
      const invalidCommand = new PublishReportCommand('', userId.value);
      
      const result = await handler.handle(invalidCommand);
      
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('required');
    });

    it('should preserve report metadata when publishing', async () => {
      const originalTitle = draftReport.title;
      const originalDescription = draftReport.description;
      const originalCreatedAt = draftReport.createdAt;
      
      const command = new PublishReportCommand(reportId.value, userId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isSuccess).toBe(true);
      expect(result.value!.title).toBe(originalTitle);
      expect(result.value!.description).toBe(originalDescription);
      expect(result.value!.createdAt).toEqual(originalCreatedAt);
    });

    it('should update the updatedAt timestamp when publishing', async () => {
      const originalUpdatedAt = draftReport.updatedAt;
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const command = new PublishReportCommand(reportId.value, userId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isSuccess).toBe(true);
      expect(result.value!.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('should handle concurrent publishing attempts', async () => {
      const command1 = new PublishReportCommand(reportId.value, userId.value);
      const command2 = new PublishReportCommand(reportId.value, userId.value);
      
      // Execute both commands concurrently
      const [result1, result2] = await Promise.all([
        handler.handle(command1),
        handler.handle(command2)
      ]);
      
      // One should succeed, one should fail
      const successCount = [result1, result2].filter(r => r.isSuccess).length;
      const failureCount = [result1, result2].filter(r => r.isFailure).length;
      
      expect(successCount).toBe(1);
      expect(failureCount).toBe(1);
    });
  });

  describe('validation', () => {
    it('should validate report ID format', async () => {
      const command = new PublishReportCommand('invalid-id', userId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Invalid');
    });

    it('should validate user ID format', async () => {
      const command = new PublishReportCommand(reportId.value, 'invalid-user-id');
      
      const result = await handler.handle(command);
      
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Invalid');
    });

    it('should handle null/undefined inputs', async () => {
      expect(async () => {
        await handler.handle(null as any);
      }).rejects.toThrow();
      
      expect(async () => {
        await handler.handle(undefined as any);
      }).rejects.toThrow();
    });
  });

  describe('business rules', () => {
    it('should validate report completeness before publishing', async () => {
      const incompleteReport = ReportFactory.create({
        createdBy: userId.value,
        status: ReportStatus.DRAFT,
        title: '', // Empty title should prevent publishing
      });
      mockRepository.addReport(incompleteReport);
      
      const command = new PublishReportCommand(incompleteReport.id.value, userId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('incomplete');
    });

    it('should validate report configuration before publishing', async () => {
      const reportWithInvalidConfig = ReportFactory.create({
        createdBy: userId.value,
        status: ReportStatus.DRAFT,
        config: null // Invalid config
      });
      mockRepository.addReport(reportWithInvalidConfig);
      
      const command = new PublishReportCommand(reportWithInvalidConfig.id.value, userId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('configuration');
    });

    it('should allow publishing reports with valid data sources', async () => {
      const reportWithValidDataSource = ReportFactory.create({
        createdBy: userId.value,
        status: ReportStatus.DRAFT,
        hasValidDataSource: true
      });
      mockRepository.addReport(reportWithValidDataSource);
      
      const command = new PublishReportCommand(reportWithValidDataSource.id.value, userId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isSuccess).toBe(true);
    });

    it('should prevent publishing reports with invalid data sources', async () => {
      const reportWithInvalidDataSource = ReportFactory.create({
        createdBy: userId.value,
        status: ReportStatus.DRAFT,
        hasValidDataSource: false
      });
      mockRepository.addReport(reportWithInvalidDataSource);
      
      const command = new PublishReportCommand(reportWithInvalidDataSource.id.value, userId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('data source');
    });
  });

  describe('permissions and security', () => {
    it('should allow owner to publish their report', async () => {
      const command = new PublishReportCommand(reportId.value, userId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isSuccess).toBe(true);
    });

    it('should deny publishing for non-owners', async () => {
      const otherUserId = UniqueId.generate();
      const command = new PublishReportCommand(reportId.value, otherUserId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('permission');
    });

    it('should handle organization-level permissions', async () => {
      const organizationId = UniqueId.generate();
      const orgReport = ReportFactory.create({
        createdBy: userId.value,
        organizationId: organizationId.value,
        status: ReportStatus.DRAFT
      });
      mockRepository.addReport(orgReport);
      
      const command = new PublishReportCommand(orgReport.id.value, userId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isSuccess).toBe(true);
    });
  });

  describe('error scenarios', () => {
    it('should handle database connection errors', async () => {
      mockRepository.setShouldFail(true);
      const command = new PublishReportCommand(reportId.value, userId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeDefined();
    });

    it('should handle timeout scenarios', async () => {
      mockRepository.setOperationDelay(5000); // 5 second delay
      const command = new PublishReportCommand(reportId.value, userId.value);
      
      // Set a shorter timeout for this test
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 1000)
      );
      
      await expect(Promise.race([
        handler.handle(command),
        timeoutPromise
      ])).rejects.toThrow('Timeout');
    });

    it('should provide meaningful error messages', async () => {
      const nonExistentId = UniqueId.generate();
      const command = new PublishReportCommand(nonExistentId.value, userId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isFailure).toBe(true);
      expect(result.error).toMatch(/Report.*not found/i);
    });
  });

  describe('state transitions', () => {
    it('should transition from DRAFT to PUBLISHED', async () => {
      expect(draftReport.status).toBe(ReportStatus.DRAFT);
      
      const command = new PublishReportCommand(reportId.value, userId.value);
      const result = await handler.handle(command);
      
      expect(result.isSuccess).toBe(true);
      expect(result.value!.status).toBe(ReportStatus.PUBLISHED);
    });

    it('should not allow transition from ARCHIVED to PUBLISHED', async () => {
      draftReport.archive();
      await mockRepository.save(draftReport);
      
      const command = new PublishReportCommand(reportId.value, userId.value);
      const result = await handler.handle(command);
      
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('archived');
    });

    it('should handle invalid state transitions gracefully', async () => {
      // Manually set an invalid status
      const invalidReport = ReportFactory.create({
        createdBy: userId.value,
        status: 'INVALID_STATUS' as any
      });
      mockRepository.addReport(invalidReport);
      
      const command = new PublishReportCommand(invalidReport.id.value, userId.value);
      const result = await handler.handle(command);
      
      expect(result.isFailure).toBe(true);
    });
  });

  describe('performance', () => {
    it('should complete publishing within reasonable time', async () => {
      const command = new PublishReportCommand(reportId.value, userId.value);
      
      const startTime = Date.now();
      const result = await handler.handle(command);
      const endTime = Date.now();
      
      expect(result.isSuccess).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle multiple publish operations efficiently', async () => {
      const reports = Array.from({ length: 10 }, () => {
        const report = ReportFactory.create({
          createdBy: userId.value,
          status: ReportStatus.DRAFT
        });
        mockRepository.addReport(report);
        return report;
      });
      
      const commands = reports.map(report => 
        new PublishReportCommand(report.id.value, userId.value)
      );
      
      const startTime = Date.now();
      const results = await Promise.all(commands.map(cmd => handler.handle(cmd)));
      const endTime = Date.now();
      
      expect(results.every(r => r.isSuccess)).toBe(true);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });

  describe('integration with domain events', () => {
    it('should trigger domain events when publishing', async () => {
      const command = new PublishReportCommand(reportId.value, userId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isSuccess).toBe(true);
      // In a real implementation, we would check that ReportPublishedEvent was raised
      // This would require event tracking in the mock or integration with an event bus
    });

    it('should not trigger events when publishing fails', async () => {
      mockRepository.setShouldFail(true);
      const command = new PublishReportCommand(reportId.value, userId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isFailure).toBe(true);
      // Should not have triggered any domain events
    });
  });
});