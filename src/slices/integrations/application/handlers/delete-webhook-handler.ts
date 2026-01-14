import { injectable, inject } from 'inversify';
import { CommandHandler } from '../../../../shared/application/base/command-handler';
import { Result } from '../../../../shared/application/base/result';
import { WebhookId } from '../../domain/value-objects/webhook-id';
import { DeleteWebhookCommand } from '../../application/commands/delete-webhook-command';
import type { IWebhookRepository } from '../../domain/repositories/webhook-repository';
import type { IWebhookEventRepository } from '../../domain/repositories/webhook-event-repository';

/**
 * Delete Webhook Handler
 */
@injectable()
export class DeleteWebhookHandler extends CommandHandler<DeleteWebhookCommand, { success: boolean }> {
  constructor(
    @inject('WebhookRepository') private webhookRepository: IWebhookRepository,
    @inject('WebhookEventRepository') private webhookEventRepository: IWebhookEventRepository
  ) {
    super();
  }

  async handle(command: DeleteWebhookCommand): Promise<Result<{ success: boolean }>> {
    // Get webhook first for logging
    const webhook = await this.webhookRepository.findById(
      WebhookId.fromValue(command.props.webhookId)
    );

    if (!webhook) {
      return Result.failure<{ success: boolean }>(new Error('Webhook not found'));
    }

    const integrationId = webhook.integrationId;

    // Delete webhook
    await this.webhookRepository.delete(WebhookId.fromValue(command.props.webhookId));

    // Log webhook deletion
    const logEvent = require('../../domain/entities/webhook-event').WebhookEvent;
    const event = logEvent.create({
      integrationId,
      webhookId: command.props.webhookId,
      action: 'webhook_deleted',
      status: 'success' as any,
      requestData: JSON.stringify({ webhookId: command.props.webhookId }),
      responseData: JSON.stringify({ deleted: true }),
      timestamp: new Date(),
    });
    await this.webhookEventRepository.save(event);

    return Result.success({ success: true });
  }
}
