import { injectable, inject } from 'inversify';
import { Result } from '../../../../shared/application/base/result';
import { GetAuditLogQuery } from '../commands/create-audit-log-command';
import { AuditLog } from '../../domain/entities/audit-log';
import { AuditLogDto } from '../dtos/audit-log-dto';
import type { IAuditLogRepository } from '../../domain/repositories/audit-log-repository';
import { TYPES } from '../../../../shared/infrastructure/di/types';

/**
 * Get Audit Log Handler
 * Handles retrieving a single audit log entry
 */
@injectable()
export class GetAuditLogHandler {
  constructor(
    @inject(TYPES.AuditLogRepository)
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}

  async handle(query: GetAuditLogQuery): Promise<Result<AuditLogDto>> {
    try {
      // Find audit log
      const auditLog = await this.auditLogRepository.findById(query.id);
      if (!auditLog) {
        return Result.failure<AuditLogDto>(new Error('Audit log not found'));
      }

      // Convert to DTO
      const auditLogDto = AuditLogDto.fromObject({
        id: auditLog.getId(),
        action: auditLog.getAction(),
        resource: auditLog.getResource(),
        resourceId: auditLog.getResourceId(),
        userId: auditLog.getUserId(),
        organizationId: auditLog.getOrganizationId(),
        sessionId: auditLog.getSessionId(),
        ipAddress: auditLog.getIpAddress(),
        userAgent: auditLog.getUserAgent(),
        endpoint: auditLog.getEndpoint(),
        method: auditLog.getMethod(),
        oldValues: auditLog.getOldValues(),
        newValues: auditLog.getNewValues(),
        metadata: auditLog.getMetadata(),
        status: auditLog.getStatus(),
        severity: auditLog.getSeverity(),
        category: auditLog.getCategory(),
        retentionDate: auditLog.getRetentionDate()?.toISOString() ?? null,
        isArchived: auditLog.isArchived(),
        createdAt: auditLog.getCreatedAt().toISOString(),
      });

      return Result.success<AuditLogDto>(auditLogDto);
    } catch (error) {
      return Result.failure<AuditLogDto>(
        error instanceof Error ? error : new Error('Failed to get audit log'),
      );
    }
  }
}
