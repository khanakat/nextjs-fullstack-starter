import { injectable, inject } from 'inversify';
import { CommandHandler } from '../../../../shared/application/base/command-handler';
import { Result } from '../../../../shared/application/base/result';
import { UpdateOrganizationCommand } from '../commands/update-organization-command';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import type { IOrganizationRepository } from '../../domain/repositories/organization-repository';

/**
 * Update Organization Command Handler
 * Handles the update of existing organizations
 */
@injectable()
export class UpdateOrganizationHandler extends CommandHandler<UpdateOrganizationCommand, void> {
  constructor(
    @inject('OrganizationRepository') private organizationRepository: IOrganizationRepository
  ) {
    super();
  }

  /**
   * Execute the command
   */
  async handle(command: UpdateOrganizationCommand): Promise<Result<void>> {
    // Find existing organization
    const organization = await this.organizationRepository.findById(
      UniqueId.create(command.props.id)
    );

    if (!organization) {
      return Result.failure(new Error('Organization not found'));
    }

    // Update organization details
    organization.updateDetails({
      name: command.props.name,
      description: command.props.description,
      imageUrl: command.props.imageUrl,
      website: command.props.website,
      plan: command.props.plan,
      settings: command.props.settings,
    });

    // Save to repository
    await this.organizationRepository.update(organization);

    return Result.success(undefined);
  }
}
