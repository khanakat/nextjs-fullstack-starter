import { Query } from '@/shared/application/base';

/**
 * TODO: Implement security events queries
 * Placeholder to prevent TypeScript compilation errors
 */
export class GetSecurityEventsQuery extends Query {
  constructor(public props: any) {
    super();
  }

  get organizationId(): string {
    return this.props.organizationId;
  }

  get page(): number {
    return this.props.page || 1;
  }

  get limit(): number {
    return this.props.limit || 10;
  }
}

export class GetSecurityEventQuery extends Query {
  constructor(public props: any) {
    super();
  }
}
