import { injectable, inject } from 'inversify';
import { QueryHandler } from '../../../../shared/application/base/query-handler';
import { Result } from '../../../../shared/application/base/result';
import { GetOrganizationQuery } from '../queries/get-organization-query';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import type { IOrganizationRepository } from '../../domain/repositories/organization-repository';

/**
 * Get Organization Query Handler
 * Handles retrieval of a single organization
 */
@injectable()
export class GetOrganizationHandler extends QueryHandler<GetOrganizationQuery, any> {
  constructor(
    @inject('OrganizationRepository') private organizationRepository: IOrganizationRepository
  ) {
    super();
  }

  /**
   * Execute * query
   */
  async handle(query: GetOrganizationQuery): Promise<Result<any>> {
    const organization = await this.organizationRepository.findById(
      UniqueId.create(query.props.id)
    );

    if (!organization) {
      return Result.failure(new Error('Organization not found'));
    }

    return Result.success(organization);
  }
}
