import { Query } from '../../../../shared/application/base/query';

/**
 * Get Webhook Deliveries Query Props
 */
export interface GetWebhookDeliveriesQueryProps {
  webhookId: string;
  organizationId: string;
  page?: number;
  limit?: number;
  status?: string;
  event?: string;
}

/**
 * Get Webhook Deliveries Query
 */
export class GetWebhookDeliveriesQuery extends Query {
  public readonly props: GetWebhookDeliveriesQueryProps;

  constructor(props: GetWebhookDeliveriesQueryProps) {
    super();
    this.props = props;
  }
}
