import { Query } from '@/shared/application/base';

/**
 * TODO: Implement API key queries
 * Placeholder to prevent TypeScript compilation errors
 */
export class ListApiKeysQuery extends Query {
  constructor(public props: any) {
    super();
  }

  get organizationId(): string {
    return this.props.organizationId;
  }
}

export class GetApiKeyQuery extends Query {
  constructor(public props: any) {
    super();
  }
}
