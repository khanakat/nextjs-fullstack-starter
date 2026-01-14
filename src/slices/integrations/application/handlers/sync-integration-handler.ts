import { injectable, inject } from 'inversify';
import { CommandHandler } from '../../../../shared/application/base/command-handler';
import { Result } from '../../../../shared/application/base/result';
import { Integration } from '../../domain/entities/integration';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { SyncIntegrationCommand } from '../../application/commands/sync-integration-command';
import type { IIntegrationRepository } from '../../domain/repositories/integration-repository';
import { IntegrationDto } from '../../application/dtos/integration-dto';

/**
 * Sync Integration Handler
 */
@injectable()
export class SyncIntegrationHandler extends CommandHandler<SyncIntegrationCommand, any> {
  constructor(
    @inject('IntegrationRepository') private integrationRepository: IIntegrationRepository
  ) {
    super();
  }

  async handle(command: SyncIntegrationCommand): Promise<Result<any>> {
    // Get integration
    const integration = await this.integrationRepository.findById(
      UniqueId.create(command.props.integrationId)
    );

    if (!integration) {
      return Result.failure<any>(new Error('Integration not found'));
    }

    // Update last sync timestamp
    integration.updateLastSync(new Date());

    // Save integration
    await this.integrationRepository.save(integration);

    // TODO: Implement actual sync logic
    // This would trigger the background sync job or execute sync directly

    return Result.success({
      success: true,
      integrationId: integration.id.value,
      syncType: command.props.syncType,
      timestamp: new Date(),
      message: 'Integration synchronization started',
    });
  }
}
