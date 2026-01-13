import { Command } from '../../../../shared/application/base/command';

/**
 * Create Organization Command
 * Used to create a new organization
 */
export interface CreateOrganizationCommandProps {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  website?: string;
  plan?: string;
  maxMembers?: number;
  settings?: string;
  ownerId: string;
}

export class CreateOrganizationCommand extends Command {
  public readonly props: CreateOrganizationCommandProps;

  constructor(props: CreateOrganizationCommandProps, userId?: string) {
    super(userId);
    this.props = props;
  }
}
