import { injectable } from 'inversify';
import { GetIntegrationQuery } from '../queries/get-integration-query';
import { IntegrationDto } from '../dtos/integration-dto';
import { GetIntegrationHandler } from '../handlers/get-integration-handler';
import { UseCase } from '../../../../shared/application/base/use-case';
import { Result } from '../../../../shared/application/base/result';

/**
 * Get Integration Use Case
 */
@injectable()
export class GetIntegrationUseCase extends UseCase<GetIntegrationQuery, IntegrationDto> {
  constructor(
    private readonly getIntegrationHandler: GetIntegrationHandler
  ) {
    super();
  }

  async execute(query: GetIntegrationQuery): Promise<Result<IntegrationDto>> {
    return await this.getIntegrationHandler.handle(query);
  }
}
