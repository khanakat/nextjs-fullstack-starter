import { Command } from '../../../../shared/application/base/command';
import { DashboardStatus } from '../../domain/entities/dashboard';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';

/**
 * Update Dashboard Command
 * Command for updating an existing analytics dashboard
 */
export interface UpdateDashboardCommandProps {
  name?: string;
  description?: string;
  layout?: string;
  settings?: string;
  isPublic?: boolean;
  isTemplate?: boolean;
  tags?: string;
  status?: DashboardStatus;
}

export class UpdateDashboardCommand extends Command {
  public readonly dashboardId: UniqueId;
  public readonly props: UpdateDashboardCommandProps;

  constructor(dashboardId: UniqueId, props: UpdateDashboardCommandProps, userId?: string) {
    super(userId);
    this.dashboardId = dashboardId;
    this.props = props;
  }
}
