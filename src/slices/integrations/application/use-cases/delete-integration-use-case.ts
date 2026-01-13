import { injectable } from 'inversify';
import { DeleteIntegrationCommand } from '../commands/delete-integration-command';
import { DeleteIntegrationHandler } from '../handlers/delete-integration-handler';
import { UseCase } from '../../../../shared/application/base/use-case';
import { Result } from '../../../../shared/application/base/result';

/**
 * Delete Integration Use Case
 */
@injectable()
export class DeleteIntegrationUseCase extends UseCase<DeleteIntegrationCommand, void> {
  constructor(
    private readonly deleteIntegrationHandler: DeleteIntegrationHandler
  ) {
    super();
  }

  async execute(command: DeleteIntegrationCommand): Promise<Result<void>> {
    return await this.deleteIntegrationHandler.handle(command);
  }
}
