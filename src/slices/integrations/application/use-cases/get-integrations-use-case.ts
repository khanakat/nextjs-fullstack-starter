import { injectable } from 'inversify';
import { GetIntegrationsQuery } from '../queries/get-integrations-query';
import { IntegrationDto } from '../dtos/integration-dto';
import { GetIntegrationsHandler } from '../handlers/get-integrations-handler';
import { UseCase } from '../../../../shared/application/base/use-case';
import { Result } from '../../../../shared/application/base/result';

/**
 * Get Integrations Use Case
 */
@injectable()
export class GetIntegrationsUseCase extends UseCase<GetIntegrationsQuery, IntegrationDto[]> {
  constructor(
    private readonly getIntegrationsHandler: GetIntegrationsHandler
  ) {
    super();
  }

  async execute(query: GetIntegrationsQuery): Promise<Result<IntegrationDto[]>> {
    return await this.getIntegrationsHandler.handle(query);
  }
}
