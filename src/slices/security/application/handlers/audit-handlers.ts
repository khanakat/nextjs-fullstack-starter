import { injectable } from 'inversify';
import { Result } from '@/shared/application/base/result';
import {
  GetPermissionAnalyticsQuery,
  GetViolationsQuery,
  AuditUserPermissionsQuery,
  GetComplianceReportQuery,
} from '@/slices/security/application/queries/audit-queries';
import {
  ResolveViolationCommand,
  LogPermissionCheckCommand,
  CreateViolationCommand,
} from '@/slices/security/application/commands/audit-commands';

/**
 * Get Permission Analytics Handler
 */
@injectable()
export class GetPermissionAnalyticsHandler {
  async handle(query: GetPermissionAnalyticsQuery): Promise<Result<any>> {
    try {
      const { getPermissionAuditService } = await import('@/lib/security/permission-audit');
      const auditService = getPermissionAuditService();

      const analytics = await auditService.getPermissionAnalytics(
        query.startDate,
        query.endDate,
        query.organizationId,
      );

      return Result.success({
        analytics,
        period: {
          start: query.startDate.toISOString(),
          end: query.endDate.toISOString(),
        },
      });
    } catch (error) {
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to get permission analytics'),
      );
    }
  }
}

/**
 * Get Violations Handler
 */
@injectable()
export class GetViolationsHandler {
  async handle(query: GetViolationsQuery): Promise<Result<any>> {
    try {
      const { getPermissionAuditService } = await import('@/lib/security/permission-audit');
      const auditService = getPermissionAuditService();

      const violations = await auditService.getViolations(
        query.limit,
        query.organizationId,
      );

      return Result.success({ violations });
    } catch (error) {
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to get violations'),
      );
    }
  }
}

/**
 * Audit User Permissions Handler
 */
@injectable()
export class AuditUserPermissionsHandler {
  async handle(query: AuditUserPermissionsQuery): Promise<Result<any>> {
    try {
      const { getPermissionAuditService } = await import('@/lib/security/permission-audit');
      const auditService = getPermissionAuditService();

      const audit = await auditService.auditUserPermissions(query.targetUserId);

      return Result.success({ audit });
    } catch (error) {
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to audit user permissions'),
      );
    }
  }
}

/**
 * Get Compliance Report Handler
 */
@injectable()
export class GetComplianceReportHandler {
  async handle(query: GetComplianceReportQuery): Promise<Result<any>> {
    try {
      const { getPermissionAuditService } = await import('@/lib/security/permission-audit');
      const auditService = getPermissionAuditService();

      const compliance = await auditService.generateComplianceReport(
        query.organizationId,
      );

      return Result.success({ compliance });
    } catch (error) {
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to generate compliance report'),
      );
    }
  }
}

/**
 * Resolve Violation Handler
 */
@injectable()
export class ResolveViolationHandler {
  async handle(command: ResolveViolationCommand): Promise<Result<any>> {
    try {
      const { getPermissionAuditService } = await import('@/lib/security/permission-audit');
      const auditService = getPermissionAuditService();

      const resolved = await auditService.resolveViolation(
        command.violationId,
        command.resolverUserId,
        command.resolution,
      );

      if (!resolved) {
        return Result.failure(new Error('Failed to resolve violation'));
      }

      return Result.success({
        success: true,
        message: 'Violation resolved',
      });
    } catch (error) {
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to resolve violation'),
      );
    }
  }
}

/**
 * Log Permission Check Handler
 */
@injectable()
export class LogPermissionCheckHandler {
  async handle(command: LogPermissionCheckCommand): Promise<Result<any>> {
    try {
      const { getPermissionAuditService } = await import('@/lib/security/permission-audit');
      const auditService = getPermissionAuditService();

      await auditService.logPermissionCheck(
        command.targetUserId,
        command.targetUserEmail,
        command.targetUserRole as any,
        command.resource as any,
        command.action as any,
        command.granted,
        command.context,
      );

      return Result.success({
        success: true,
        message: 'Permission check logged',
      });
    } catch (error) {
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to log permission check'),
      );
    }
  }
}

/**
 * Create Violation Handler
 */
@injectable()
export class CreateViolationHandler {
  async handle(command: CreateViolationCommand): Promise<Result<any>> {
    try {
      const { getPermissionAuditService } = await import('@/lib/security/permission-audit');
      const auditService = getPermissionAuditService();

      await auditService.createViolation(command.violation);

      return Result.success({
        success: true,
        message: 'Violation created',
      });
    } catch (error) {
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to create violation'),
      );
    }
  }
}
