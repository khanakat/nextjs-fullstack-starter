import { injectable } from 'inversify';
import { UpdateIntegrationCommand } from '../commands/update-integration-command';
import { Integration } from '../../domain/entities/integration';
import { IntegrationId } from '../../domain/value-objects/integration-id';
import type { IIntegrationRepository } from '../../domain/repositories/integration-repository';
import { Result } from '../../../../shared/application/base/result';
import { CommandHandler } from '../../../../shared/application/base/command-handler';
import { NotFoundError } from '../../../../shared/domain/exceptions/not-found-error';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';

/**
 * Update Integration Handler
 */
@injectable()
export class UpdateIntegrationHandler extends CommandHandler<UpdateIntegrationCommand, Integration> {
  constructor(
    private readonly integrationRepository: IIntegrationRepository
  ) {
    super();
  }

  async handle(command: UpdateIntegrationCommand): Promise<Result<Integration>> {
    // Find integration
    const integrationId = UniqueId.create(command.props.integrationId);
    const integration = await this.integrationRepository.findById(integrationId);

    if (!integration) {
      return Result.failure(new NotFoundError('Integration', command.props.integrationId));
    }

    // Update config
    if (command.props.config) {
      integration.updateConfig(command.props.config);
    }

    // Update status
    if (command.props.status) {
      if (command.props.status === 'COMPLETED') {
        integration.markAsCompleted();
      } else if (command.props.status === 'FAILED') {
        integration.markAsFailed('Update failed');
      }
    }

    // Update last sync
    if (command.props.lastSyncAt) {
      integration.updateLastSync(command.props.lastSyncAt);
    }

    // Save integration
    await this.integrationRepository.save(integration);

    return Result.success(integration);
  }
}
