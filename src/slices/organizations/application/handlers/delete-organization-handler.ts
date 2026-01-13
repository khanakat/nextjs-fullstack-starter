import { injectable, inject } from 'inversify';
import { CommandHandler } from '../../../../shared/application/base/command-handler';
import { Result } from '../../../../shared/application/base/result';
import { DeleteOrganizationCommand } from '../commands/delete-organization-command';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import type { IOrganizationRepository } from '../../domain/repositories/organization-repository';

/**
 * Delete Organization Command Handler
 * Handles the deletion of organizations
 */
@injectable()
export class DeleteOrganizationHandler extends CommandHandler<DeleteOrganizationCommand, void> {
  constructor(
    @inject('OrganizationRepository') private organizationRepository: IOrganizationRepository
  ) {
    super();
  }

  /**
   * Execute command
   */
  async handle(command: DeleteOrganizationCommand): Promise<Result<void>> {
    // Find existing organization
    const organization = await this.organizationRepository.findById(
      UniqueId.create(command.props.id)
    );

    if (!organization) {
      return Result.failure(new Error('Organization not found'));
    }

    // Delete from repository
    await this.organizationRepository.delete(UniqueId.create(command.props.id));

    return Result.success(undefined);
  }
}
