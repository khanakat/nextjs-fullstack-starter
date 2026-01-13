import { Query } from '../../../../shared/application/base/query';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';

/**
 * Get Dashboard Query
 * Query for retrieving a single dashboard by ID
 */
export class GetDashboardQuery extends Query {
  public readonly dashboardId: UniqueId;

  constructor(dashboardId: UniqueId, userId?: string) {
    super(userId);
    this.dashboardId = dashboardId;
  }
}
