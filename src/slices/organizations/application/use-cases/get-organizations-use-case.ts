import { injectable, inject } from 'inversify';
import { UseCase } from '../../../../shared/application/base/use-case';
import { Result } from '../../../../shared/application/base/result';
import { GetOrganizationsQuery } from '../queries/get-organizations-query';
import { GetOrganizationsHandler } from '../handlers/get-organizations-handler';
import { OrganizationDto } from '../dtos/organization-dto';

/**
 * Get Organizations Use Case
 * Orchestrates retrieval of multiple organizations with optional filters
 */
@injectable()
export class GetOrganizationsUseCase extends UseCase<GetOrganizationsQuery, OrganizationDto[]> {
  constructor(
    @inject('GetOrganizationsHandler') private handler: GetOrganizationsHandler
  ) {
    super();
  }

  /**
   * Execute * use case
   */
  async execute(query: GetOrganizationsQuery): Promise<Result<OrganizationDto[]>> {
    const result = await this.handler.handle(query);

    if (result.isFailure) {
      return Result.failure(result.error);
    }

    const dtos = OrganizationDto.fromEntities(result.value);
    return Result.success(dtos);
  }
}
