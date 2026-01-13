import { injectable } from 'inversify';
import { DeleteIntegrationCommand } from '../commands/delete-integration-command';
import type { IIntegrationRepository } from '../../domain/repositories/integration-repository';
import { Result } from '../../../../shared/application/base/result';
import { CommandHandler } from '../../../../shared/application/base/command-handler';
import { NotFoundError } from '../../../../shared/domain/exceptions/not-found-error';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';

/**
 * Delete Integration Handler
 */
@injectable()
export class DeleteIntegrationHandler extends CommandHandler<DeleteIntegrationCommand, void> {
  constructor(
    private readonly integrationRepository: IIntegrationRepository
  ) {
    super();
  }

  async handle(command: DeleteIntegrationCommand): Promise<Result<void>> {
    // Find integration
    const integrationId = UniqueId.create(command.props.integrationId);
    const exists = await this.integrationRepository.exists(integrationId);

    if (!exists) {
      return Result.failure(new NotFoundError('Integration', command.props.integrationId));
    }

    // Delete integration
    await this.integrationRepository.delete(integrationId);

    return Result.success(undefined);
  }
}
