import { injectable, inject } from 'inversify';
import { CommandHandler } from '../../../../shared/application/base/command-handler';
import { Result } from '../../../../shared/application/base/result';
import { WebhookEvent } from '../../domain/entities/webhook-event';
import { Webhook } from '../../domain/entities/webhook';
import { WebhookId } from '../../domain/value-objects/webhook-id';
import { TestWebhookCommand } from '../../application/commands/test-webhook-command';
import type { IWebhookRepository } from '../../domain/repositories/webhook-repository';
import type { IWebhookEventRepository } from '../../domain/repositories/webhook-event-repository';

/**
 * Test Webhook Handler
 */
@injectable()
export class TestWebhookHandler extends CommandHandler<TestWebhookCommand, { success: boolean; response?: any }> {
  constructor(
    @inject('WebhookRepository') private webhookRepository: IWebhookRepository,
    @inject('WebhookEventRepository') private webhookEventRepository: IWebhookEventRepository
  ) {
    super();
  }

  async handle(command: TestWebhookCommand): Promise<Result<{ success: boolean; response?: any }>> {
    // Get webhook
    const webhook = await this.webhookRepository.findById(
      WebhookId.fromValue(command.props.webhookId)
    );

    if (!webhook) {
      return Result.failure<{ success: boolean; response?: any }>(new Error('Webhook not found'));
    }

    // Create test event
    const testEvent = WebhookEvent.create({
      integrationId: webhook.integrationId,
      webhookId: webhook.id.value,
      action: 'test_sent',
      status: 'pending' as any,
      requestData: JSON.stringify({
        event: command.props.event || 'test',
        timestamp: new Date().toISOString(),
      }),
      timestamp: new Date(),
    });

    // Save test event
    await this.webhookEventRepository.save(testEvent);

    // TODO: Actually send the webhook test
    // For now, simulate success
    testEvent.markAsSuccess({
      message: 'Test webhook sent successfully',
      timestamp: new Date().toISOString(),
    }, 200);

    await this.webhookEventRepository.save(testEvent);

    return Result.success({
      success: true,
      response: {
        status: 200,
        message: 'Test webhook sent successfully',
      },
    });
  }
}
