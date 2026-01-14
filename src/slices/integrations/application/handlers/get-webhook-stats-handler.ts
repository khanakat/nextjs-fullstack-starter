import { injectable, inject } from 'inversify';
import { QueryHandler } from '../../../../shared/application/base/query-handler';
import { Result } from '../../../../shared/application/base/result';
import { GetWebhookStatsQuery } from '../../application/queries/get-webhook-stats-query';
import type { IWebhookEventRepository } from '../../domain/repositories/webhook-event-repository';
import type { IWebhookRepository } from '../../domain/repositories/webhook-repository';
import { WebhookId } from '../../domain/value-objects/webhook-id';

/**
 * Get Webhook Stats Handler
 */
@injectable()
export class GetWebhookStatsHandler extends QueryHandler<GetWebhookStatsQuery, any> {
  constructor(
    @inject('WebhookRepository') private webhookRepository: IWebhookRepository,
    @inject('WebhookEventRepository') private webhookEventRepository: IWebhookEventRepository
  ) {
    super();
  }

  async handle(query: GetWebhookStatsQuery): Promise<Result<any>> {
    // Get webhook
    const webhook = await this.webhookRepository.findById(
      WebhookId.fromValue(query.props.webhookId)
    );

    if (!webhook) {
      return Result.failure<any>(new Error('Webhook not found'));
    }

    // Calculate date range
    let startDate: Date;
    let endDate: Date = new Date();

    if (query.props.startDate && query.props.endDate) {
      startDate = new Date(query.props.startDate);
      endDate = new Date(query.props.endDate);
    } else {
      // Calculate based on period
      const now = new Date();
      switch (query.props.period) {
        case '1h':
          startDate = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }
    }

    // Get stats
    const stats = await this.webhookEventRepository.getStats(
      query.props.webhookId,
      startDate,
      endDate
    );

    // Get recent deliveries
    const { events } = await this.webhookEventRepository.findByWebhookId(
      query.props.webhookId,
      { limit: 10 }
    );

    return Result.success({
      webhook: {
        id: webhook.id.value,
        url: webhook.url,
        status: webhook.status,
      },
      period: {
        start: startDate,
        end: endDate,
        duration: query.props.period,
      },
      summary: stats,
      recentDeliveries: events.map((e) => e.toPersistence()),
    });
  }
}
