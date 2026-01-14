import { injectable, inject } from 'inversify';
import { QueryHandler } from '../../../../shared/application/base/query-handler';
import { Result } from '../../../../shared/application/base/result';
import { GetWebhookQuery } from '../../application/queries/get-webhook-query';
import type { IWebhookRepository } from '../../domain/repositories/webhook-repository';
import { WebhookDto } from '../../application/dtos/webhook-dto';

/**
 * Get Webhook Handler
 */
@injectable()
export class GetWebhookHandler extends QueryHandler<GetWebhookQuery, WebhookDto> {
  constructor(
    @inject('WebhookRepository') private webhookRepository: IWebhookRepository
  ) {
    super();
  }

  async handle(query: GetWebhookQuery): Promise<Result<WebhookDto>> {
    const webhook = await this.webhookRepository.findById(
      require('../../domain/value-objects/webhook-id').WebhookId.fromValue(query.props.webhookId)
    );

    if (!webhook) {
      return Result.failure<WebhookDto>(new Error('Webhook not found'));
    }

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
