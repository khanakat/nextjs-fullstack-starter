import { injectable, inject } from 'inversify';
import { Result } from '../../../../shared/application/base/result';
import { AuditLogDto } from '../dtos/audit-log-dto';
import type { IAuditLogRepository } from '../../domain/repositories/audit-log-repository';
import { TYPES } from '../../../../shared/infrastructure/di/types';

/**
 * Get Audit Logs Handler
 * Handles retrieving all audit logs
 */
@injectable()
export class GetAuditLogsHandler {
  constructor(
    @inject(TYPES.AuditLogRepository)
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}

  async handle(): Promise<Result<AuditLogDto[]>> {
    try {
      // Get all audit logs
      const auditLogs = await this.auditLogRepository.findAll();

      // Convert to DTOs
      const auditLogDtos = auditLogs.map(auditLog =>
        AuditLogDto.fromObject({
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
        }),
      );

      return Result.success<AuditLogDto[]>(auditLogDtos);
    } catch (error) {
      return Result.failure<AuditLogDto[]>(
        error instanceof Error ? error : new Error('Failed to get audit logs'),
      );
    }
  }
}
