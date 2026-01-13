import { injectable, inject } from 'inversify';
import { Result } from '../../../../shared/application/base/result';
import { GetAuditStatisticsQuery } from '../commands/create-audit-log-command';
import { AuditStatisticsDto } from '../dtos/audit-log-dto';
import type { IAuditLogRepository } from '../../domain/repositories/audit-log-repository';
import { TYPES } from '../../../../shared/infrastructure/di/types';

/**
 * Get Audit Statistics Handler
 * Handles retrieving audit statistics
 */
@injectable()
export class GetAuditStatisticsHandler {
  constructor(
    @inject(TYPES.AuditLogRepository)
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}

  async handle(query: GetAuditStatisticsQuery): Promise<Result<AuditStatisticsDto>> {
    try {
      // Get all audit logs
      const allLogs = await this.auditLogRepository.findAll();

      // Filter logs based on query parameters
      let filteredLogs = allLogs;
      if (query.userId) {
        filteredLogs = filteredLogs.filter(log => log.getUserId() === query.userId);
      }
      if (query.organizationId) {
        filteredLogs = filteredLogs.filter(log => log.getOrganizationId() === query.organizationId);
      }
      if (query.startDate) {
        filteredLogs = filteredLogs.filter(log => log.getCreatedAt() >= query.startDate!);
      }
      if (query.endDate) {
        filteredLogs = filteredLogs.filter(log => log.getCreatedAt() <= query.endDate!);
      }

      // Calculate statistics
      const totalLogs = filteredLogs.length;
      const byAction: Record<string, number> = {};
      const byResource: Record<string, number> = {};
      const byCategory: Record<string, number> = {};
      const bySeverity: Record<string, number> = {};
      let successCount = 0;
      let failureCount = 0;
      let warningCount = 0;

      for (const log of filteredLogs) {
        // Count by action
        byAction[log.getAction()] = (byAction[log.getAction()] || 0) + 1;

        // Count by resource
        byResource[log.getResource()] = (byResource[log.getResource()] || 0) + 1;

        // Count by category
        byCategory[log.getCategory()] = (byCategory[log.getCategory()] || 0) + 1;

        // Count by severity
        bySeverity[log.getSeverity()] = (bySeverity[log.getSeverity()] || 0) + 1;

        // Count by status
        if (log.getStatus() === 'success') {
          successCount++;
        } else if (log.getStatus() === 'failure') {
          failureCount++;
        } else if (log.getStatus() === 'warning') {
          warningCount++;
        }
      }

      // Create statistics DTO
      const statistics = new AuditStatisticsDto(
        totalLogs,
        byAction,
        byResource,
        byCategory,
        bySeverity,
        successCount,
        failureCount,
        warningCount,
      );

      return Result.success<AuditStatisticsDto>(statistics);
    } catch (error) {
      return Result.failure<AuditStatisticsDto>(
        error instanceof Error ? error : new Error('Failed to get audit statistics'),
      );
    }
  }
}
