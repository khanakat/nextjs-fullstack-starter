import { injectable, inject } from 'inversify';
import { Result } from '../../../../shared/application/base/result';
import { ListAuditLogsQuery } from '../commands/create-audit-log-command';
import { AuditLogDto, PaginatedAuditLogsDto } from '../dtos/audit-log-dto';
import { AuditLog } from '../../domain/entities/audit-log';
import type { IAuditLogRepository } from '../../domain/repositories/audit-log-repository';
import { TYPES } from '../../../../shared/infrastructure/di/types';

/**
 * List Audit Logs Handler
 * Handles retrieving audit logs with filters
 */
@injectable()
export class ListAuditLogsHandler {
  constructor(
    @inject(TYPES.AuditLogRepository)
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}

  async handle(query: ListAuditLogsQuery): Promise<Result<PaginatedAuditLogsDto>> {
    try {
      // Get audit logs with filters
      const result = await this.auditLogRepository.findByFilters({
        userId: query.userId,
        organizationId: query.organizationId,
        action: query.action,
        resource: query.resource,
        category: query.category,
        severity: query.severity,
        startDate: query.startDate,
        endDate: query.endDate,
        limit: query.limit,
        offset: query.offset,
      });

      // Get total count
      const total = await this.auditLogRepository.count({
        userId: query.userId,
        organizationId: query.organizationId,
        action: query.action,
        resource: query.resource,
        category: query.category,
        severity: query.severity,
      });

      // Convert to DTOs
      const auditLogDtos = result.logs.map((auditLog: AuditLog) =>
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

      // Create paginated result
      const paginatedResult = new PaginatedAuditLogsDto(
        auditLogDtos,
        total,
        query.limit ?? 50,
        query.offset ?? 0,
      );

      return Result.success<PaginatedAuditLogsDto>(paginatedResult);
    } catch (error) {
      return Result.failure<PaginatedAuditLogsDto>(
        error instanceof Error ? error : new Error('Failed to list audit logs'),
      );
    }
  }
}
