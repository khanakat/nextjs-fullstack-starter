import { injectable, inject } from 'inversify';
import { CommandHandler } from '../../../../shared/application/base/command-handler';
import { Result } from '../../../../shared/application/base/result';
import { DeleteDashboardCommand } from '../commands/delete-dashboard-command';
import type { IDashboardRepository } from '../../domain/repositories/dashboard-repository';

/**
 * Delete Dashboard Handler
 * Handles dashboard deletion
 */
@injectable()
export class DeleteDashboardHandler extends CommandHandler<DeleteDashboardCommand, void> {
  constructor(
    @inject('DashboardRepository') private dashboardRepository: IDashboardRepository
  ) {
    super();
  }

  async handle(command: DeleteDashboardCommand): Promise<Result<void>> {
    // Validate command
    const validationResult = this.validate(command);
    if (!validationResult.isValid) {
      return Result.failure<void>(new Error(validationResult.errors.join(', ')));
    }

    // Check if dashboard exists
    const dashboard = await this.dashboardRepository.findById(command.dashboardId);
    if (!dashboard) {
      return Result.failure(new Error('Dashboard not found'));
    }

    // Delete dashboard
    await this.dashboardRepository.delete(command.dashboardId);

    return Result.success(undefined);
  }

  private validate(command: DeleteDashboardCommand): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!command.dashboardId) {
      errors.push('Dashboard ID is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
