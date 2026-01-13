import { injectable, inject } from 'inversify';
import { Result } from '../../../../shared/application/base/result';
import { DeleteAuditLogCommand } from '../commands/create-audit-log-command';
import type { IAuditLogRepository } from '../../domain/repositories/audit-log-repository';
import { TYPES } from '../../../../shared/infrastructure/di/types';

/**
 * Delete Audit Log Handler
 * Handles deleting an audit log entry
 */
@injectable()
export class DeleteAuditLogHandler {
  constructor(
    @inject(TYPES.AuditLogRepository)
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}

  async handle(command: DeleteAuditLogCommand): Promise<Result<boolean>> {
    try {
      // Find existing audit log
      const existingAuditLog = await this.auditLogRepository.findById(command.id);
      if (!existingAuditLog) {
        return Result.failure<boolean>(new Error('Audit log not found'));
      }

      // Delete audit log
      await this.auditLogRepository.delete(command.id);

      return Result.success<boolean>(true);
    } catch (error) {
      return Result.failure<boolean>(
        error instanceof Error ? error : new Error('Failed to delete audit log'),
      );
    }
  }
}
