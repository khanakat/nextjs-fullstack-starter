import { injectable, inject } from 'inversify';
import { IUseCase } from '../../../../shared/application/base/use-case';
import { Result } from '../../../../shared/application/base/result';
import { DeleteDashboardCommand } from '../commands/delete-dashboard-command';
import type { DeleteDashboardHandler } from '../handlers/delete-dashboard-handler';

/**
 * Delete Dashboard Use Case
 * Orchestrates the deletion of a dashboard
 */
@injectable()
export class DeleteDashboardUseCase implements IUseCase<DeleteDashboardCommand, void> {
  constructor(
    @inject('DeleteDashboardHandler') private handler: DeleteDashboardHandler
  ) {}

  async execute(command: DeleteDashboardCommand): Promise<Result<void>> {
    return this.handler.handle(command);
  }
}
