import { injectable } from 'inversify';
import { GetIntegrationsQuery } from '../queries/get-integrations-query';
import { IntegrationDto } from '../dtos/integration-dto';
import type { IIntegrationRepository } from '../../domain/repositories/integration-repository';
import { Result } from '../../../../shared/application/base/result';
import { QueryHandler } from '../../../../shared/application/base/query-handler';

/**
 * Get Integrations Handler
 */
@injectable()
export class GetIntegrationsHandler extends QueryHandler<GetIntegrationsQuery, IntegrationDto[]> {
  constructor(
    private readonly integrationRepository: IIntegrationRepository
  ) {
    super();
  }

  async handle(query: GetIntegrationsQuery): Promise<Result<IntegrationDto[]>> {
    // Get integrations with pagination and filters
    const limit = query.props.limit ?? 50;
    const offset = query.props.offset ?? 0;

    const integrations = await this.integrationRepository.findAll({
      limit,
      offset,
      organizationId: query.props.organizationId,
      type: query.props.type,
      provider: query.props.provider,
      status: query.props.status,
    });

    // Convert to DTOs
    const dtos = integrations.map(integration => IntegrationDto.fromDomain(integration));

    return Result.success(dtos);
  }
}
