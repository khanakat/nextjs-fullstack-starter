/**
 * Query to list security events
 */
export class ListSecurityEventsQuery {
  public readonly organizationId?: string;
  public readonly page: number;
  public readonly limit: number;

  constructor(params: {
    organizationId?: string;
    page?: number;
    limit?: number;
  }) {
    this.organizationId = params.organizationId;
    this.page = params.page || 1;
    this.limit = params.limit || 50;
  }
}
