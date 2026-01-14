import { injectable, inject } from 'inversify';
import { QueryHandler } from '../../../../shared/application/base/query-handler';
import { Result } from '../../../../shared/application/base/result';
import { GetWebhookDeliveriesQuery } from '../../application/queries/get-webhook-deliveries-query';
import type { IWebhookEventRepository } from '../../domain/repositories/webhook-event-repository';
import { WebhookEventDto } from '../../application/dtos/webhook-event-dto';

/**
 * Get Webhook Deliveries Handler
 */
@injectable()
export class GetWebhookDeliveriesHandler extends QueryHandler<GetWebhookDeliveriesQuery, {
  deliveries: WebhookEventDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}> {
  constructor(
    @inject('WebhookEventRepository') private webhookEventRepository: IWebhookEventRepository
  ) {
    super();
  }

  async handle(query: GetWebhookDeliveriesQuery): Promise<Result<{
    deliveries: WebhookEventDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }>> {
    const page = query.props.page || 1;
    const limit = query.props.limit || 20;
    const offset = (page - 1) * limit;

    const { events, total } = await this.webhookEventRepository.findByWebhookId(
      query.props.webhookId,
      {
        limit,
        offset,
        status: query.props.status,
      }
    );

    // Filter by event type if specified
    const filteredEvents = query.props.event
      ? events.filter((e) => e.action === query.props.event)
      : events;

    return Result.success({
      deliveries: filteredEvents.map((e) => new WebhookEventDto({
        id: e.id.value,
        integrationId: e.integrationId,
        webhookId: e.webhookId,
        action: e.action,
        status: e.status,
        requestData: e.requestData ? JSON.parse(e.requestData) : undefined,
        responseData: e.responseData ? JSON.parse(e.responseData) : undefined,
        errorDetails: e.errorDetails ? JSON.parse(e.errorDetails) : undefined,
        timestamp: e.timestamp,
        duration: e.duration,
        retryCount: e.retryCount,
        statusCode: e.statusCode,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  }
}
