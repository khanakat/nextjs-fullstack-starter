import { injectable, inject } from 'inversify';
import { Result } from '../../../../shared/application/base/result';
import { UpdateAuditLogCommand } from '../commands/create-audit-log-command';
import { AuditLog } from '../../domain/entities/audit-log';
import type { IAuditLogRepository } from '../../domain/repositories/audit-log-repository';
import { TYPES } from '../../../../shared/infrastructure/di/types';

/**
 * Update Audit Log Handler
 * Handles updating an existing audit log entry
 */
@injectable()
export class UpdateAuditLogHandler {
  constructor(
    @inject(TYPES.AuditLogRepository)
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}

  async handle(command: UpdateAuditLogCommand): Promise<Result<AuditLog>> {
    try {
      // Find existing audit log
      const existingAuditLog = await this.auditLogRepository.findById(command.id);
      if (!existingAuditLog) {
        return Result.failure<AuditLog>(new Error('Audit log not found'));
      }

      // Handle archiving/unarchiving
      let auditLogToSave = existingAuditLog;
      if (command.isArchived !== undefined) {
        auditLogToSave = command.isArchived
          ? existingAuditLog.archive()
          : existingAuditLog.unarchive();
      }

      // Update audit log
      const updatedAuditLog = AuditLog.create({
        id: auditLogToSave.getId(),
        action: auditLogToSave.getAction(),
        resource: auditLogToSave.getResource(),
        resourceId: auditLogToSave.getResourceId() ?? undefined,
        userId: auditLogToSave.getUserId() ?? undefined,
        organizationId: auditLogToSave.getOrganizationId() ?? undefined,
        sessionId: auditLogToSave.getSessionId() ?? undefined,
        ipAddress: auditLogToSave.getIpAddress() ?? undefined,
        userAgent: auditLogToSave.getUserAgent() ?? undefined,
        endpoint: auditLogToSave.getEndpoint() ?? undefined,
        method: auditLogToSave.getMethod() ?? undefined,
        oldValues: auditLogToSave.getOldValues() ?? undefined,
        newValues: auditLogToSave.getNewValues() ?? undefined,
        metadata: command.metadata ?? auditLogToSave.getMetadata(),
        status: command.status ?? auditLogToSave.getStatus(),
        severity: auditLogToSave.getSeverity(),
        category: auditLogToSave.getCategory(),
        retentionDate: command.retentionDate ?? auditLogToSave.getRetentionDate() ?? undefined,
        isArchived: auditLogToSave.isArchived(),
        createdAt: auditLogToSave.getCreatedAt(),
      });

      // Save updated audit log
      const savedAuditLog = await this.auditLogRepository.update(updatedAuditLog);

      return Result.success<AuditLog>(savedAuditLog);
    } catch (error) {
      return Result.failure<AuditLog>(
        error instanceof Error ? error : new Error('Failed to update audit log'),
      );
    }
  }
}
