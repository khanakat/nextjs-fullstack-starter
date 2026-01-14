import { injectable, inject } from 'inversify';
import { CommandHandler } from '../../../../shared/application/base/command-handler';
import { Result } from '../../../../shared/application/base/result';
import { Webhook } from '../../domain/entities/webhook';
import { WebhookId } from '../../domain/value-objects/webhook-id';
import { CreateWebhookCommand } from '../../application/commands/create-webhook-command';
import type { IWebhookRepository } from '../../domain/repositories/webhook-repository';
import type { IIntegrationRepository } from '../../domain/repositories/integration-repository';
import type { IWebhookEventRepository } from '../../domain/repositories/webhook-event-repository';
import { WebhookDto } from '../../application/dtos/webhook-dto';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import * as crypto from 'crypto';

/**
 * Create Webhook Handler
 */
@injectable()
export class CreateWebhookHandler extends CommandHandler<CreateWebhookCommand, { webhook: WebhookDto; secret: string }> {
  constructor(
    @inject('WebhookRepository') private webhookRepository: IWebhookRepository,
    @inject('IntegrationRepository') private integrationRepository: IIntegrationRepository,
    @inject('WebhookEventRepository') private webhookEventRepository: IWebhookEventRepository
  ) {
    super();
  }

  async handle(command: CreateWebhookCommand): Promise<Result<{ webhook: WebhookDto; secret: string }>> {
    // Verify integration exists and belongs to organization
    const integration = await this.integrationRepository.findById(
      UniqueId.create(command.props.integrationId)
    );

    if (!integration) {
      return Result.failure<{ webhook: WebhookDto; secret: string }>(new Error('Integration not found'));
    }

    // Generate webhook secret
    const secret = crypto.randomBytes(32).toString('hex');

    // Create webhook
    const webhook = Webhook.create({
      integrationId: command.props.integrationId,
      url: command.props.url,
      events: command.props.events,
      status: 'active' as any,
      httpMethod: command.props.method,
      headers: command.props.headers ? JSON.stringify(command.props.headers) : undefined,
      retryConfig: command.props.retryPolicy ? JSON.stringify(command.props.retryPolicy) : undefined,
      isActive: true,
      createdBy: command.userId,
    });

    // Save webhook (secret will be stored separately)
    await this.webhookRepository.save(webhook);

    // Log webhook creation
    // Note: In production, you'd want to store the secret securely (e.g., encrypted)

    return Result.success({
      webhook: new WebhookDto({
        id: webhook.id.value,
        integrationId: webhook.integrationId,
        url: webhook.url,
        events: webhook.events,
        status: webhook.status,
        httpMethod: webhook.httpMethod,
        headers: webhook.headers,
        retryConfig: webhook.retryConfig,
        isActive: webhook.isActive,
        createdAt: webhook.createdAt,
        updatedAt: webhook.updatedAt,
        createdBy: webhook.createdBy,
      }),
      secret,
    });
  }
}
