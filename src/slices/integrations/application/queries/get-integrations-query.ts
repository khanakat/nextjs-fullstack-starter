import { Query } from '../../../../shared/application/base/query';
import { IntegrationStatus } from '../../domain/entities/integration';

/**
 * Get Integrations Query
 */
export class GetIntegrationsQuery extends Query {
  readonly props: {
    organizationId?: string;
    type?: string;
    provider?: string;
    status?: IntegrationStatus;
    limit?: number;
    offset?: number;
  };

  constructor(props: {
    organizationId?: string;
    type?: string;
    provider?: string;
    status?: IntegrationStatus;
    limit?: number;
    offset?: number;
  }) {
    super();
    this.props = props;
  }
}
