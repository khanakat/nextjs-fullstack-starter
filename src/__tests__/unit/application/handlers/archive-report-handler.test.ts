import { ArchiveReportHandler } from '../../../../slices/reporting/application/handlers/archive-report-handler';
import { ArchiveReportCommand } from '../../../../slices/reporting/application/commands/archive-report-command';
import { IReportRepository } from '../../../../shared/domain/reporting/repositories/report-repository';
import { Report, ReportStatus } from '../../../../shared/domain/reporting/entities/report';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { MockReportRepository } from '../../../mocks/repository-mocks';
import { ReportFactory } from '../../../factories/report-factory';

describe('ArchiveReportHandler', () => {
  let handler: ArchiveReportHandler;
  let mockRepository: MockReportRepository;
  let existingReport: Report;
  let userId: UniqueId;
  let reportId: UniqueId;

  beforeEach(() => {
    mockRepository = new MockReportRepository();
    handler = new ArchiveReportHandler(mockRepository);
    
    userId = UniqueId.generate();
    reportId = UniqueId.generate();
    
    existingReport = ReportFactory.create({
      id: reportId.value,
      createdBy: userId.value,
      status: ReportStatus.PUBLISHED,
      isArchived: false
    });
    
    mockRepository.addReport(existingReport);
  });

  afterEach(() => {
    mockRepository.clear();
  });

  describe('handle', () => {
    it('should successfully archive an existing report', async () => {
      const command = new ArchiveReportCommand(reportId.value, userId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeDefined();
      expect(result.value!.isArchived).toBe(true);
      expect(result.value!.archivedAt).toBeDefined();
      expect(result.value!.status).toBe(ReportStatus.ARCHIVED);
    });

    it('should return error when report does not exist', async () => {
      const nonExistentId = UniqueId.generate();
      const command = new ArchiveReportCommand(nonExistentId.value, userId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('not found');
    });

    it('should return error when user is not the owner', async () => {
      const differentUserId = UniqueId.generate();
      const command = new ArchiveReportCommand(reportId.value, differentUserId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('permission');
    });

    it('should return error when report is already archived', async () => {
      // First archive the report
      existingReport.archive();
      await mockRepository.save(existingReport);
      
      const command = new ArchiveReportCommand(reportId.value, userId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('already archived');
    });

    it('should handle repository save failure', async () => {
      mockRepository.setShouldFail(true);
      const command = new ArchiveReportCommand(reportId.value, userId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Failed to save');
    });

    it('should validate command before processing', async () => {
      const invalidCommand = new ArchiveReportCommand('', userId.value);
      
      const result = await handler.handle(invalidCommand);
      
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('required');
    });

    it('should handle concurrent archiving attempts', async () => {
      const command1 = new ArchiveReportCommand(reportId.value, userId.value);
      const command2 = new ArchiveReportCommand(reportId.value, userId.value);
      
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

    it('should preserve report metadata when archiving', async () => {
      const originalTitle = existingReport.title;
      const originalDescription = existingReport.description;
      const originalCreatedAt = existingReport.createdAt;
      
      const command = new ArchiveReportCommand(reportId.value, userId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isSuccess).toBe(true);
      expect(result.value!.title).toBe(originalTitle);
      expect(result.value!.description).toBe(originalDescription);
      expect(result.value!.createdAt).toEqual(originalCreatedAt);
    });

    it('should update the updatedAt timestamp when archiving', async () => {
      const originalUpdatedAt = existingReport.updatedAt;
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const command = new ArchiveReportCommand(reportId.value, userId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isSuccess).toBe(true);
      expect(result.value!.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('validation', () => {
    it('should validate report ID format', async () => {
      const command = new ArchiveReportCommand('invalid-id', userId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Invalid');
    });

    it('should validate user ID format', async () => {
      const command = new ArchiveReportCommand(reportId.value, 'invalid-user-id');
      
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

  describe('error scenarios', () => {
    it('should handle database connection errors', async () => {
      mockRepository.setShouldFail(true);
      const command = new ArchiveReportCommand(reportId.value, userId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeDefined();
    });

    it('should handle timeout scenarios', async () => {
      mockRepository.setOperationDelay(5000); // 5 second delay
      const command = new ArchiveReportCommand(reportId.value, userId.value);
      
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
      const command = new ArchiveReportCommand(nonExistentId.value, userId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isFailure).toBe(true);
      expect(result.error).toMatch(/Report.*not found/i);
    });
  });

  describe('business rules', () => {
    it('should not allow archiving draft reports', async () => {
      const draftReport = ReportFactory.create({
        createdBy: userId.value,
        status: ReportStatus.DRAFT
      });
      mockRepository.addReport(draftReport);
      
      const command = new ArchiveReportCommand(draftReport.id.value, userId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('draft');
    });

    it('should allow archiving published reports', async () => {
      const publishedReport = ReportFactory.create({
        createdBy: userId.value,
        status: ReportStatus.PUBLISHED
      });
      mockRepository.addReport(publishedReport);
      
      const command = new ArchiveReportCommand(publishedReport.id.value, userId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isSuccess).toBe(true);
    });

    it('should handle reports with scheduled executions', async () => {
      const reportWithSchedule = ReportFactory.create({
        createdBy: userId.value,
        status: ReportStatus.PUBLISHED,
        hasScheduledExecutions: true
      });
      mockRepository.addReport(reportWithSchedule);
      
      const command = new ArchiveReportCommand(reportWithSchedule.id.value, userId.value);
      
      const result = await handler.handle(command);
      
      // Should succeed but might include warnings about scheduled executions
      expect(result.isSuccess).toBe(true);
    });
  });

  describe('performance', () => {
    it('should complete archiving within reasonable time', async () => {
      const command = new ArchiveReportCommand(reportId.value, userId.value);
      
      const startTime = Date.now();
      const result = await handler.handle(command);
      const endTime = Date.now();
      
      expect(result.isSuccess).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle multiple archive operations efficiently', async () => {
      const reports = Array.from({ length: 10 }, () => {
        const report = ReportFactory.create({
          createdBy: userId.value,
          status: ReportStatus.PUBLISHED
        });
        mockRepository.addReport(report);
        return report;
      });
      
      const commands = reports.map(report => 
        new ArchiveReportCommand(report.id.value, userId.value)
      );
      
      const startTime = Date.now();
      const results = await Promise.all(commands.map(cmd => handler.handle(cmd)));
      const endTime = Date.now();
      
      expect(results.every(r => r.isSuccess)).toBe(true);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });
});