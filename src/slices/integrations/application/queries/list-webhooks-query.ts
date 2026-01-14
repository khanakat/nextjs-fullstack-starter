import { Query } from '../../../../shared/application/base/query';

/**
 * List Webhooks Query Props
 */
export interface ListWebhooksQueryProps {
  organizationId: string;
  integrationId?: string;
  status?: string;
  page: number;
  limit: number;
}

/**
 * List Webhooks Query
 */
export class ListWebhooksQuery extends Query {
  public readonly props: ListWebhooksQueryProps;

  constructor(props: ListWebhooksQueryProps) {
    super();
    this.props = props;
  }
}
