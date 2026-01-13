import { injectable, inject } from 'inversify';
import { Result } from '../../../../shared/application/base/result';
import { CreateAuditLogCommand } from '../commands/create-audit-log-command';
import { AuditLog } from '../../domain/entities/audit-log';
import { AuditId } from '../../domain/value-objects/audit-id';
import type { IAuditLogRepository } from '../../domain/repositories/audit-log-repository';
import { TYPES } from '../../../../shared/infrastructure/di/types';

/**
 * Create Audit Log Handler
 * Handles the creation of a new audit log entry
 */
@injectable()
export class CreateAuditLogHandler {
  constructor(
    @inject(TYPES.AuditLogRepository)
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}

  async handle(command: CreateAuditLogCommand): Promise<Result<AuditLog>> {
    try {
      // Generate audit log ID
      const auditId = AuditId.fromValue(crypto.randomUUID());

      // Create new audit log
      const auditLog = AuditLog.create({
        id: auditId.getValue(),
        action: command.action,
        resource: command.resource,
        resourceId: command.resourceId ?? undefined,
        userId: command.userId ?? undefined,
        organizationId: command.organizationId ?? undefined,
        sessionId: command.sessionId ?? undefined,
        ipAddress: command.ipAddress ?? undefined,
        userAgent: command.userAgent ?? undefined,
        endpoint: command.endpoint ?? undefined,
        method: command.method ?? undefined,
        oldValues: command.oldValues ?? undefined,
        newValues: command.newValues ?? undefined,
        metadata: command.metadata,
        status: command.status,
        severity: command.severity,
        category: command.category,
        retentionDate: command.retentionDate ?? undefined,
      });

      // Save audit log
      const savedAuditLog = await this.auditLogRepository.save(auditLog);

      return Result.success<AuditLog>(savedAuditLog);
    } catch (error) {
      return Result.failure<AuditLog>(
        error instanceof Error ? error : new Error('Failed to create audit log'),
      );
    }
  }
}
