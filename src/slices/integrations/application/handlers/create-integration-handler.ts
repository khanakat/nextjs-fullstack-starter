import { injectable } from 'inversify';
import { CreateIntegrationCommand } from '../commands/create-integration-command';
import { Integration, IntegrationStatus } from '../../domain/entities/integration';
import { IntegrationId } from '../../domain/value-objects/integration-id';
import type { IIntegrationRepository } from '../../domain/repositories/integration-repository';
import { Result } from '../../../../shared/application/base/result';
import { CommandHandler } from '../../../../shared/application/base/command-handler';
import { ValidationError } from '../../../../shared/domain/exceptions/validation-error';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';

/**
 * Create Integration Handler
 */
@injectable()
export class CreateIntegrationHandler extends CommandHandler<CreateIntegrationCommand, Integration> {
  constructor(
    private readonly integrationRepository: IIntegrationRepository
  ) {
    super();
  }

  async handle(command: CreateIntegrationCommand): Promise<Result<Integration>> {
    // Validate input
    if (!command.props.name || command.props.name.trim().length === 0) {
      return Result.failure(new ValidationError('name', 'Integration name is required'));
    }

    if (!command.props.type || command.props.type.trim().length === 0) {
      return Result.failure(new ValidationError('type', 'Integration type is required'));
    }

    if (!command.props.provider || command.props.provider.trim().length === 0) {
      return Result.failure(new ValidationError('provider', 'Integration provider is required'));
    }

    // Validate config is valid JSON
    try {
      JSON.parse(command.props.config);
    } catch {
      return Result.failure(new ValidationError('config', 'Integration config must be valid JSON'));
    }

    // Check if integration with same name already exists in organization
    if (command.props.organizationId) {
      const existingIntegration = await this.integrationRepository.findByName(
        UniqueId.create(command.props.organizationId),
        command.props.name
      );

      if (existingIntegration) {
        return Result.failure(new Error('Integration with this name already exists in organization'));
      }
    }

    // Create integration
    const integration = Integration.create({
      name: command.props.name,
      type: command.props.type,
      provider: command.props.provider,
      config: command.props.config,
      organizationId: command.props.organizationId,
      status: command.props.status ?? IntegrationStatus.PENDING,
    });

    // Save integration
    await this.integrationRepository.save(integration);

    return Result.success(integration);
  }
}
