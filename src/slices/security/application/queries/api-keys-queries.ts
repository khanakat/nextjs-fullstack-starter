import { ListApiKeysRequest } from '../dto';

/**
 * Query to list API keys
 */
export class ListApiKeysQuery {
  public readonly organizationId: string;

  constructor(params: ListApiKeysRequest) {
    this.organizationId = params.organizationId;
  }
}
