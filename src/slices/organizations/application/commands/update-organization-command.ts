import { Command } from '../../../../shared/application/base/command';

/**
 * Update Organization Command
 * Used to update an existing organization
 */
export interface UpdateOrganizationCommandProps {
  id: string;
  name?: string;
  description?: string;
  imageUrl?: string;
  website?: string;
  plan?: string;
  maxMembers?: number;
  settings?: string;
}

export class UpdateOrganizationCommand extends Command {
  public readonly props: UpdateOrganizationCommandProps;

  constructor(props: UpdateOrganizationCommandProps, userId?: string) {
    super(userId);
    this.props = props;
  }
}
