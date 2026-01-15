import { Query } from '@/shared/application/base';

/**
 * TODO: Implement security metrics queries
 * Placeholder to prevent TypeScript compilation errors
 */
export class GetSecurityMetricsQuery extends Query {
  constructor(public props: any) {
    super();
  }

  get organizationId(): string {
    return this.props.organizationId;
  }

  get range(): string {
    return this.props.range || '24h';
  }

  get startDate(): Date {
    return this.props.startDate;
  }

  get endDate(): Date {
    return this.props.endDate;
  }
}
