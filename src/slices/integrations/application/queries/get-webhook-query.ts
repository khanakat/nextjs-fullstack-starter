import { Query } from '../../../../shared/application/base/query';

/**
 * Get Webhook Query Props
 */
export interface GetWebhookQueryProps {
  webhookId: string;
  organizationId: string;
}

/**
 * Get Webhook Query
 */
export class GetWebhookQuery extends Query {
  public readonly props: GetWebhookQueryProps;

  constructor(props: GetWebhookQueryProps) {
    super();
    this.props = props;
  }
}
