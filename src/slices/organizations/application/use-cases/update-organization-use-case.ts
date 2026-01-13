import { injectable, inject } from 'inversify';
import { UseCase } from '../../../../shared/application/base/use-case';
import { Result } from '../../../../shared/application/base/result';
import { UpdateOrganizationCommand } from '../commands/update-organization-command';
import { UpdateOrganizationHandler } from '../handlers/update-organization-handler';

/**
 * Update Organization Use Case
 * Orchestrates the update of an existing organization
 */
@injectable()
export class UpdateOrganizationUseCase extends UseCase<UpdateOrganizationCommand, void> {
  constructor(
    @inject('UpdateOrganizationHandler') private handler: UpdateOrganizationHandler
  ) {
    super();
  }

  /**
   * Execute * use case
   */
  async execute(command: UpdateOrganizationCommand): Promise<Result<void>> {
    return this.handler.handle(command);
  }
}
