import { injectable, inject } from 'inversify';
import { CommandHandler } from '../../../../shared/application/base/command-handler';
import { Result } from '../../../../shared/application/base/result';
import { CreateOrganizationCommand } from '../commands/create-organization-command';
import { Organization, OrganizationRole, OrganizationStatus } from '../../domain/entities/organization';
import type { IOrganizationRepository } from '../../domain/repositories/organization-repository';

/**
 * Create Organization Command Handler
 * Handles the creation of new organizations
 */
@injectable()
export class CreateOrganizationHandler extends CommandHandler<CreateOrganizationCommand, Organization> {
  constructor(
    @inject('OrganizationRepository') private organizationRepository: IOrganizationRepository
  ) {
    super();
  }

  /**
   * Execute the command
   */
  async handle(command: CreateOrganizationCommand): Promise<Result<Organization>> {
    // Validate slug uniqueness
    const slugExists = await this.organizationRepository.existsBySlug(command.props.slug);
    if (slugExists) {
      return Result.failure(new Error('Organization slug already exists'));
    }

    // Create organization entity
    const organization = Organization.create({
      name: command.props.name,
      slug: command.props.slug,
      description: command.props.description,
      imageUrl: command.props.imageUrl,
      website: command.props.website,
      role: OrganizationRole.OWNER,
      status: OrganizationStatus.ACTIVE,
      maxMembers: command.props.maxMembers || 5,
      plan: command.props.plan || 'free',
      settings: command.props.settings || '{}',
    });

    // Save to repository
    await this.organizationRepository.save(organization);

    return Result.success(organization);
  }
}
