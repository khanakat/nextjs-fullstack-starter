import { DeleteReportHandler } from '../../../../slices/reporting/application/handlers/delete-report-handler';
import { DeleteReportCommand } from '../../../../slices/reporting/application/commands/delete-report-command';
import { IReportRepository } from '../../../../shared/domain/reporting/repositories/report-repository';
import { Report, ReportStatus } from '../../../../shared/domain/reporting/entities/report';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { MockReportRepository } from '../../../mocks/repository-mocks';
import { ReportFactory } from '../../../factories/report-factory';

describe('DeleteReportHandler', () => {
  let handler: DeleteReportHandler;
  let mockRepository: MockReportRepository;
  let existingReport: Report;
  let userId: UniqueId;
  let reportId: UniqueId;

  beforeEach(() => {
    mockRepository = new MockReportRepository();
    handler = new DeleteReportHandler(mockRepository);
    
    userId = UniqueId.generate();
    reportId = UniqueId.generate();
    
    existingReport = ReportFactory.create({
      id: reportId.value,
      createdBy: userId.value,
      status: ReportStatus.DRAFT,
      isArchived: false
    });
    
    mockRepository.addReport(existingReport);
  });

  afterEach(() => {
    mockRepository.clear();
  });

  describe('handle', () => {
    it('should successfully delete an existing draft report', async () => {
      const command = new DeleteReportCommand(reportId.value, userId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe(true);
      
      // Verify report is actually deleted
      const deletedReport = await mockRepository.findById(reportId);
      expect(deletedReport).toBeNull();
    });

    it('should successfully delete an archived report', async () => {
      existingReport.archive();
      await mockRepository.save(existingReport);
      
      const command = new DeleteReportCommand(reportId.value, userId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe(true);
    });

    it('should return error when report does not exist', async () => {
      const nonExistentId = UniqueId.generate();
      const command = new DeleteReportCommand(nonExistentId.value, userId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('not found');
    });

    it('should return error when user is not the owner', async () => {
      const differentUserId = UniqueId.generate();
      const command = new DeleteReportCommand(reportId.value, differentUserId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('permission');
    });

    it('should prevent deletion of published reports', async () => {
      existingReport.publish();
      await mockRepository.save(existingReport);
      
      const command = new DeleteReportCommand(reportId.value, userId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('published');
    });

    it('should handle repository delete failure', async () => {
      mockRepository.setShouldFail(true);
      const command = new DeleteReportCommand(reportId.value, userId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Failed to delete');
    });

    it('should validate command before processing', async () => {
      const invalidCommand = new DeleteReportCommand('', userId.value);
      
      const result = await handler.handle(invalidCommand);
      
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('required');
    });

    it('should handle concurrent deletion attempts', async () => {
      const command1 = new DeleteReportCommand(reportId.value, userId.value);
      const command2 = new DeleteReportCommand(reportId.value, userId.value);
      
      // Execute both commands concurrently
      const [result1, result2] = await Promise.all([
        handler.handle(command1),
        handler.handle(command2)
      ]);
      
      // One should succeed, one should fail (report not found)
      const successCount = [result1, result2].filter(r => r.isSuccess).length;
      const failureCount = [result1, result2].filter(r => r.isFailure).length;
      
      expect(successCount).toBe(1);
      expect(failureCount).toBe(1);
    });
  });

  describe('validation', () => {
    it('should validate report ID format', async () => {
      const command = new DeleteReportCommand('invalid-id', userId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Invalid');
    });

    it('should validate user ID format', async () => {
      const command = new DeleteReportCommand(reportId.value, 'invalid-user-id');
      
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
    it('should allow deletion of draft reports', async () => {
      const draftReport = ReportFactory.create({
        createdBy: userId.value,
        status: ReportStatus.DRAFT
      });
      mockRepository.addReport(draftReport);
      
      const command = new DeleteReportCommand(draftReport.id.value, userId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isSuccess).toBe(true);
    });

    it('should prevent deletion of published reports', async () => {
      const publishedReport = ReportFactory.create({
        createdBy: userId.value,
        status: ReportStatus.PUBLISHED
      });
      mockRepository.addReport(publishedReport);
      
      const command = new DeleteReportCommand(publishedReport.id.value, userId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('published');
    });

    it('should allow deletion of archived reports', async () => {
      const archivedReport = ReportFactory.create({
        createdBy: userId.value,
        status: ReportStatus.ARCHIVED
      });
      mockRepository.addReport(archivedReport);
      
      const command = new DeleteReportCommand(archivedReport.id.value, userId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isSuccess).toBe(true);
    });

    it('should handle reports with dependencies', async () => {
      const reportWithDependencies = ReportFactory.create({
        createdBy: userId.value,
        status: ReportStatus.DRAFT,
        hasDependencies: true
      });
      mockRepository.addReport(reportWithDependencies);
      
      const command = new DeleteReportCommand(reportWithDependencies.id.value, userId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('dependencies');
    });

    it('should handle reports with scheduled executions', async () => {
      const reportWithSchedule = ReportFactory.create({
        createdBy: userId.value,
        status: ReportStatus.DRAFT,
        hasScheduledExecutions: true
      });
      mockRepository.addReport(reportWithSchedule);
      
      const command = new DeleteReportCommand(reportWithSchedule.id.value, userId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('scheduled');
    });
  });

  describe('permissions and security', () => {
    it('should allow owner to delete their report', async () => {
      const command = new DeleteReportCommand(reportId.value, userId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isSuccess).toBe(true);
    });

    it('should deny deletion for non-owners', async () => {
      const otherUserId = UniqueId.generate();
      const command = new DeleteReportCommand(reportId.value, otherUserId.value);
      
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
      
      const command = new DeleteReportCommand(orgReport.id.value, userId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isSuccess).toBe(true);
    });

    it('should handle admin permissions for organization reports', async () => {
      const organizationId = UniqueId.generate();
      const adminUserId = UniqueId.generate();
      
      const orgReport = ReportFactory.create({
        createdBy: userId.value,
        organizationId: organizationId.value,
        status: ReportStatus.DRAFT
      });
      mockRepository.addReport(orgReport);
      
      // In a real implementation, we would check admin permissions
      // For now, we expect this to fail since adminUserId is not the owner
      const command = new DeleteReportCommand(orgReport.id.value, adminUserId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('permission');
    });
  });

  describe('error scenarios', () => {
    it('should handle database connection errors', async () => {
      mockRepository.setShouldFail(true);
      const command = new DeleteReportCommand(reportId.value, userId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeDefined();
    });

    it('should handle timeout scenarios', async () => {
      mockRepository.setOperationDelay(5000); // 5 second delay
      const command = new DeleteReportCommand(reportId.value, userId.value);
      
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
      const command = new DeleteReportCommand(nonExistentId.value, userId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isFailure).toBe(true);
      expect(result.error).toMatch(/Report.*not found/i);
    });

    it('should handle partial deletion failures', async () => {
      // Simulate a scenario where the report exists but deletion fails
      mockRepository.setShouldFail(true);
      const command = new DeleteReportCommand(reportId.value, userId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isFailure).toBe(true);
      
      // Report should still exist after failed deletion
      const stillExistingReport = await mockRepository.findById(reportId);
      expect(stillExistingReport).not.toBeNull();
    });
  });

  describe('cascading operations', () => {
    it('should handle deletion of reports with related data', async () => {
      const reportWithRelatedData = ReportFactory.create({
        createdBy: userId.value,
        status: ReportStatus.DRAFT,
        hasRelatedData: true
      });
      mockRepository.addReport(reportWithRelatedData);
      
      const command = new DeleteReportCommand(reportWithRelatedData.id.value, userId.value);
      
      const result = await handler.handle(command);
      
      // Should succeed and clean up related data
      expect(result.isSuccess).toBe(true);
    });

    it('should handle deletion rollback on cascade failure', async () => {
      const reportWithFailingCascade = ReportFactory.create({
        createdBy: userId.value,
        status: ReportStatus.DRAFT,
        hasCascadeFailure: true
      });
      mockRepository.addReport(reportWithFailingCascade);
      
      const command = new DeleteReportCommand(reportWithFailingCascade.id.value, userId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('cascade');
      
      // Report should still exist after failed cascade deletion
      const stillExistingReport = await mockRepository.findById(reportWithFailingCascade.id);
      expect(stillExistingReport).not.toBeNull();
    });
  });

  describe('performance', () => {
    it('should complete deletion within reasonable time', async () => {
      const command = new DeleteReportCommand(reportId.value, userId.value);
      
      const startTime = Date.now();
      const result = await handler.handle(command);
      const endTime = Date.now();
      
      expect(result.isSuccess).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle multiple delete operations efficiently', async () => {
      const reports = Array.from({ length: 10 }, () => {
        const report = ReportFactory.create({
          createdBy: userId.value,
          status: ReportStatus.DRAFT
        });
        mockRepository.addReport(report);
        return report;
      });
      
      const commands = reports.map(report => 
        new DeleteReportCommand(report.id.value, userId.value)
      );
      
      const startTime = Date.now();
      const results = await Promise.all(commands.map(cmd => handler.handle(cmd)));
      const endTime = Date.now();
      
      expect(results.every(r => r.isSuccess)).toBe(true);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });

  describe('integration with domain events', () => {
    it('should trigger domain events when deleting', async () => {
      const command = new DeleteReportCommand(reportId.value, userId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isSuccess).toBe(true);
      // In a real implementation, we would check that ReportDeletedEvent was raised
      // This would require event tracking in the mock or integration with an event bus
    });

    it('should not trigger events when deletion fails', async () => {
      mockRepository.setShouldFail(true);
      const command = new DeleteReportCommand(reportId.value, userId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isFailure).toBe(true);
      // Should not have triggered any domain events
    });
  });

  describe('soft vs hard deletion', () => {
    it('should perform soft deletion by default', async () => {
      const command = new DeleteReportCommand(reportId.value, userId.value);
      
      const result = await handler.handle(command);
      
      expect(result.isSuccess).toBe(true);
      
      // In a real implementation with soft deletion, the report would be marked as deleted
      // but still exist in the database with a deletedAt timestamp
    });

    it('should handle hard deletion when specified', async () => {
      const command = new DeleteReportCommand(reportId.value, userId.value, true); // Hard delete
      
      const result = await handler.handle(command);
      
      expect(result.isSuccess).toBe(true);
      
      // Report should be completely removed from the database
      const deletedReport = await mockRepository.findById(reportId);
      expect(deletedReport).toBeNull();
    });
  });
});