import { injectable, inject } from 'inversify';
import { CommandHandler } from '../../../../shared/application/base/command-handler';
import { Result } from '../../../../shared/application/base/result';
import { Integration, IntegrationStatus } from '../../domain/entities/integration';
import { IntegrationTemplate } from '../../domain/entities/integration-template';
import { IntegrationTemplateId } from '../../domain/value-objects/integration-template-id';
import { CreateIntegrationFromTemplateCommand } from '../../application/commands/create-integration-from-template-command';
import type { IIntegrationTemplateRepository } from '../../domain/repositories/integration-template-repository';
import type { IIntegrationRepository } from '../../domain/repositories/integration-repository';
import { IntegrationDto } from '../../application/dtos/integration-dto';

/**
 * Create Integration From Template Handler
 */
@injectable()
export class CreateIntegrationFromTemplateHandler extends CommandHandler<CreateIntegrationFromTemplateCommand, IntegrationDto> {
  constructor(
    @inject('IntegrationTemplateRepository') private templateRepository: IIntegrationTemplateRepository,
    @inject('IntegrationRepository') private integrationRepository: IIntegrationRepository
  ) {
    super();
  }

  async handle(command: CreateIntegrationFromTemplateCommand): Promise<Result<IntegrationDto>> {
    // Get template
    const template = await this.templateRepository.findById(
      IntegrationTemplateId.fromValue(command.props.templateId)
    );

    if (!template) {
      return Result.failure<IntegrationDto>(new Error('Template not found'));
    }

    // Check if template can be used
    if (!template.isPublic && template.organizationId !== command.props.organizationId) {
      return Result.failure<IntegrationDto>(new Error('Template not accessible'));
    }

    // Merge template config with custom config
    const templateConfig = template.getTemplateAsObject();
    const finalConfig = {
      ...templateConfig,
      ...command.props.customConfig,
    };

    // Create integration
    const integration = Integration.create({
      name: command.props.name || template.name,
      type: 'webhook', // Determine from template provider if needed
      provider: template.provider,
      category: template.category,
      config: JSON.stringify(finalConfig),
      organizationId: command.props.organizationId,
      status: IntegrationStatus.PENDING,
      isEnabled: true,
      createdBy: command.userId,
    });

    // Save integration
    await this.integrationRepository.save(integration);

    return Result.success(new IntegrationDto(
      integration.id.value,
      integration.createdAt,
      integration.updatedAt,
      integration.name,
      integration.type,
      integration.provider,
      integration.config,
      integration.organizationId ?? null,
      integration.status,
      integration.lastSync ?? null,
      integration.lastError ?? null
    ));
  }
}
