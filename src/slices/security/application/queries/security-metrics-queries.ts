/**
 * Query to get security metrics
 */
export class GetSecurityMetricsQuery {
  public readonly organizationId: string;
  public readonly range: '1h' | '24h' | '7d' | '30d';
  public readonly startDate: Date;
  public readonly endDate: Date;

  constructor(params: {
    organizationId: string;
    range: '1h' | '24h' | '7d' | '30d';
    startDate: Date;
    endDate: Date;
  }) {
    this.organizationId = params.organizationId;
    this.range = params.range;
    this.startDate = params.startDate;
    this.endDate = params.endDate;
  }
}
