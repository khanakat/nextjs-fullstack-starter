import { Command } from '../../../../shared/application/base/command';
import { DashboardStatus } from '../../domain/entities/dashboard';

/**
 * Create Dashboard Command
 * Command for creating a new analytics dashboard
 */
export interface CreateDashboardCommandProps {
  name: string;
  description?: string;
  layout: string;
  settings: string;
  isPublic: boolean;
  isTemplate: boolean;
  tags: string;
  organizationId: string;
  createdBy: string;
  status?: DashboardStatus;
}

export class CreateDashboardCommand extends Command {
  public readonly props: CreateDashboardCommandProps;

  constructor(props: CreateDashboardCommandProps, userId?: string) {
    super(userId);
    this.props = props;
  }
}
