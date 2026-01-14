import { injectable, inject } from 'inversify';
import { CommandHandler } from '../../../../shared/application/base/command-handler';
import { Result } from '../../../../shared/application/base/result';
import { WebhookId } from '../../domain/value-objects/webhook-id';
import { ProcessWebhookCommand } from '../../application/commands/process-webhook-command';
import type { IWebhookRepository } from '../../domain/repositories/webhook-repository';
import type { IWebhookEventRepository } from '../../domain/repositories/webhook-event-repository';

/**
 * Process Webhook Handler
 */
@injectable()
export class ProcessWebhookHandler extends CommandHandler<ProcessWebhookCommand, {
  success: boolean;
  shouldRetry?: boolean;
  error?: string;
}> {
  constructor(
    @inject('WebhookRepository') private webhookRepository: IWebhookRepository,
    @inject('WebhookEventRepository') private webhookEventRepository: IWebhookEventRepository
  ) {
    super();
  }

  async handle(command: ProcessWebhookCommand): Promise<Result<{
    success: boolean;
    shouldRetry?: boolean;
    error?: string;
  }>> {
    // Get webhook
    const webhook = await this.webhookRepository.findById(
      WebhookId.fromValue(command.props.webhookId)
    );

    if (!webhook) {
      return Result.failure(new Error('Webhook not found'));
    }

    if (!webhook.isActive || webhook.status !== 'active') {
      return Result.failure(new Error('Webhook is not active'));
    }

    // Create webhook event for processing
    const logEvent = require('../../domain/entities/webhook-event').WebhookEvent;
    const event = logEvent.create({
      integrationId: webhook.integrationId,
      webhookId: command.props.webhookId,
      action: 'webhook_received',
      status: 'success' as any,
      requestData: JSON.stringify(command.props.payload),
      timestamp: new Date(),
    });

    await this.webhookEventRepository.save(event);

    // TODO: Implement actual webhook forwarding logic
    // This would:
    // 1. Verify webhook signature if secret exists
    // 2. Forward the payload to the configured URL
    // 3. Handle retries on failure
    // 4. Update event status based on response

    // For now, simulate success
    event.markAsSuccess(
      {
        message: 'Webhook processed successfully',
        timestamp: new Date().toISOString(),
      },
      200
    );

    await this.webhookEventRepository.save(event);

    return Result.success({
      success: true,
    });
  }
}
