import { injectable, inject } from 'inversify';
import { UseCase } from '../../../../shared/application/base/use-case';
import { Result } from '../../../../shared/application/base/result';
import { GetOrganizationQuery } from '../queries/get-organization-query';
import { GetOrganizationHandler } from '../handlers/get-organization-handler';
import { OrganizationDto } from '../dtos/organization-dto';

/**
 * Get Organization Use Case
 * Orchestrates retrieval of a single organization
 */
@injectable()
export class GetOrganizationUseCase extends UseCase<GetOrganizationQuery, OrganizationDto> {
  constructor(
    @inject('GetOrganizationHandler') private handler: GetOrganizationHandler
  ) {
    super();
  }

  /**
   * Execute * use case
   */
  async execute(query: GetOrganizationQuery): Promise<Result<OrganizationDto>> {
    const result = await this.handler.handle(query);

    if (result.isFailure) {
      return Result.failure(result.error);
    }

    const dto = OrganizationDto.fromEntity(result.value);
    return Result.success(dto);
  }
}
