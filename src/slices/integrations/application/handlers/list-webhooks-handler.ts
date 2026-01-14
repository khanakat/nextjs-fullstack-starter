import { injectable, inject } from 'inversify';
import { QueryHandler } from '../../../../shared/application/base/query-handler';
import { Result } from '../../../../shared/application/base/result';
import { ListWebhooksQuery } from '../../application/queries/list-webhooks-query';
import type { IWebhookRepository } from '../../domain/repositories/webhook-repository';
import { WebhookDto } from '../../application/dtos/webhook-dto';

/**
 * List Webhooks Handler
 */
@injectable()
export class ListWebhooksHandler extends QueryHandler<ListWebhooksQuery, {
  webhooks: WebhookDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}> {
  constructor(
    @inject('WebhookRepository') private webhookRepository: IWebhookRepository
  ) {
    super();
  }

  async handle(query: ListWebhooksQuery): Promise<Result<{
    webhooks: WebhookDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }>> {
    const offset = (query.props.page - 1) * query.props.limit;

    const { webhooks, total } = await this.webhookRepository.findAll({
      integrationId: query.props.integrationId,
      status: query.props.status,
      limit: query.props.limit,
      offset,
    });

    return Result.success({
      webhooks: webhooks.map((w) => new WebhookDto({
        id: w.id.value,
        integrationId: w.integrationId,
        url: w.url,
        events: w.events,
        status: w.status,
        httpMethod: w.httpMethod,
        headers: w.headers,
        retryConfig: w.retryConfig,
        isActive: w.isActive,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
        createdBy: w.createdBy,
      })),
      pagination: {
        page: query.props.page,
        limit: query.props.limit,
        total,
        pages: Math.ceil(total / query.props.limit),
      },
    });
  }
}
