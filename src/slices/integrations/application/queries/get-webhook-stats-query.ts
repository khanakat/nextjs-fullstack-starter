import { Query } from '../../../../shared/application/base/query';

/**
 * Get Webhook Stats Query Props
 */
export interface GetWebhookStatsQueryProps {
  webhookId: string;
  organizationId: string;
  startDate?: Date;
  endDate?: Date;
  period?: '1h' | '24h' | '7d' | '30d';
}

/**
 * Get Webhook Stats Query
 */
export class GetWebhookStatsQuery extends Query {
  public readonly props: GetWebhookStatsQueryProps;

  constructor(props: GetWebhookStatsQueryProps) {
    super();
    this.props = {
      period: props.period || '24h',
      ...props,
    };
  }
}
