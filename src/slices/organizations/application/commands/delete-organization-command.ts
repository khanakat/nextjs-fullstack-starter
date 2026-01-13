import { Command } from '../../../../shared/application/base/command';

/**
 * Delete Organization Command
 * Used to delete an organization
 */
export interface DeleteOrganizationCommandProps {
  id: string;
}

export class DeleteOrganizationCommand extends Command {
  public readonly props: DeleteOrganizationCommandProps;

  constructor(props: DeleteOrganizationCommandProps, userId?: string) {
    super(userId);
    this.props = props;
  }
}
