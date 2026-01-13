import { injectable, inject } from 'inversify';
import { UseCase } from '../../../../shared/application/base/use-case';
import { Result } from '../../../../shared/application/base/result';
import { DeleteOrganizationCommand } from '../commands/delete-organization-command';
import { DeleteOrganizationHandler } from '../handlers/delete-organization-handler';

/**
 * Delete Organization Use Case
 * Orchestrates deletion of an organization
 */
@injectable()
export class DeleteOrganizationUseCase extends UseCase<DeleteOrganizationCommand, void> {
  constructor(
    @inject('DeleteOrganizationHandler') private handler: DeleteOrganizationHandler
  ) {
    super();
  }

  /**
   * Execute * use case
   */
  async execute(command: DeleteOrganizationCommand): Promise<Result<void>> {
    return this.handler.handle(command);
  }
}
