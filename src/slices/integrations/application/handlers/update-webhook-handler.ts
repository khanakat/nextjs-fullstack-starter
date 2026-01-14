import { injectable, inject } from 'inversify';
import { CommandHandler } from '../../../../shared/application/base/command-handler';
import { Result } from '../../../../shared/application/base/result';
import { Webhook } from '../../domain/entities/webhook';
import { WebhookId } from '../../domain/value-objects/webhook-id';
import { UpdateWebhookCommand } from '../../application/commands/update-webhook-command';
import type { IWebhookRepository } from '../../domain/repositories/webhook-repository';
import type { IWebhookEventRepository } from '../../domain/repositories/webhook-event-repository';
import { WebhookDto } from '../../application/dtos/webhook-dto';

/**
 * Update Webhook Handler
 */
@injectable()
export class UpdateWebhookHandler extends CommandHandler<UpdateWebhookCommand, WebhookDto> {
  constructor(
    @inject('WebhookRepository') private webhookRepository: IWebhookRepository,
    @inject('WebhookEventRepository') private webhookEventRepository: IWebhookEventRepository
  ) {
    super();
  }

  async handle(command: UpdateWebhookCommand): Promise<Result<WebhookDto>> {
    // Get webhook
    const webhook = await this.webhookRepository.findById(
      WebhookId.fromValue(command.props.webhookId)
    );

    if (!webhook) {
      return Result.failure<WebhookDto>(new Error('Webhook not found'));
    }

    // Update webhook fields
    if (command.props.url) {
      webhook.updateUrl(command.props.url);
    }

    if (command.props.events) {
      webhook.updateEvents(command.props.events);
    }

    if (command.props.isEnabled !== undefined) {
      if (command.props.isEnabled) {
        webhook.activate();
      } else {
        webhook.deactivate();
      }
    }

    // Save webhook
    await this.webhookRepository.save(webhook);

    // Log webhook update
    const logEvent = require('../../domain/entities/webhook-event').WebhookEvent;
    const event = logEvent.create({
      integrationId: webhook.integrationId,
      webhookId: webhook.id.value,
      action: 'webhook_updated',
      status: 'success' as any,
      requestData: JSON.stringify(command.props),
      timestamp: new Date(),
    });
    await this.webhookEventRepository.save(event);

    return Result.success(new WebhookDto({
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
    }));
  }
}
