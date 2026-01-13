import { injectable } from 'inversify';
import { GetIntegrationQuery } from '../queries/get-integration-query';
import { Integration } from '../../domain/entities/integration';
import { IntegrationDto } from '../dtos/integration-dto';
import type { IIntegrationRepository } from '../../domain/repositories/integration-repository';
import { Result } from '../../../../shared/application/base/result';
import { QueryHandler } from '../../../../shared/application/base/query-handler';
import { NotFoundError } from '../../../../shared/domain/exceptions/not-found-error';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';

/**
 * Get Integration Handler
 */
@injectable()
export class GetIntegrationHandler extends QueryHandler<GetIntegrationQuery, IntegrationDto> {
  constructor(
    private readonly integrationRepository: IIntegrationRepository
  ) {
    super();
  }

  async handle(query: GetIntegrationQuery): Promise<Result<IntegrationDto>> {
    // Find integration
    const integrationId = UniqueId.create(query.props.integrationId);
    const integration = await this.integrationRepository.findById(integrationId);

    if (!integration) {
      return Result.failure(new NotFoundError('Integration', query.props.integrationId));
    }

    // Convert to DTO
    const dto = IntegrationDto.fromDomain(integration);

    return Result.success(dto);
  }
}
