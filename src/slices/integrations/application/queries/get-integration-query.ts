import { Query } from '../../../../shared/application/base/query';

/**
 * Get Integration Query
 */
export class GetIntegrationQuery extends Query {
  readonly props: {
    integrationId: string;
  };

  constructor(props: { integrationId: string }) {
    super();
    this.props = props;
  }
}
