import { Command } from '../../../../shared/application/base/command';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';

/**
 * Delete Dashboard Command
 * Command for deleting an analytics dashboard
 */
export class DeleteDashboardCommand extends Command {
  public readonly dashboardId: UniqueId;

  constructor(dashboardId: UniqueId, userId?: string) {
    super(userId);
    this.dashboardId = dashboardId;
  }
}
