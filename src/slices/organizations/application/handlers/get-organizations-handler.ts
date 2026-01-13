import { injectable, inject } from 'inversify';
import { QueryHandler } from '../../../../shared/application/base/query-handler';
import { Result } from '../../../../shared/application/base/result';
import { GetOrganizationsQuery } from '../queries/get-organizations-query';
import type { IOrganizationRepository } from '../../domain/repositories/organization-repository';

/**
 * Get Organizations Query Handler
 * Handles retrieval of multiple organizations with optional filters
 */
@injectable()
export class GetOrganizationsHandler extends QueryHandler<GetOrganizationsQuery, any[]> {
  constructor(
    @inject('OrganizationRepository') private organizationRepository: IOrganizationRepository
  ) {
    super();
  }

  /**
   * Execute * query
   */
  async handle(query: GetOrganizationsQuery): Promise<Result<any[]>> {
    let organizations: any[] = [];

    // Apply filters
    if (query.props.ownerId) {
      organizations = await this.organizationRepository.findByOwnerId(query.props.ownerId);
    } else if (query.props.status) {
      organizations = await this.organizationRepository.findByStatus(query.props.status);
    } else {
      organizations = await this.organizationRepository.findAll();
    }

    // Apply pagination if specified
    if (query.props.page && query.props.limit) {
      const result = await this.organizationRepository.findPaginated(
        query.props.page,
        query.props.limit
      );
      return Result.success(result.organizations);
    }

    return Result.success(organizations);
  }
}
