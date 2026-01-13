import { injectable } from 'inversify';
import { CreateIntegrationCommand } from '../commands/create-integration-command';
import { Integration } from '../../domain/entities/integration';
import { IntegrationDto } from '../dtos/integration-dto';
import { CreateIntegrationHandler } from '../handlers/create-integration-handler';
import { UseCase } from '../../../../shared/application/base/use-case';
import { Result } from '../../../../shared/application/base/result';

/**
 * Create Integration Use Case
 */
@injectable()
export class CreateIntegrationUseCase extends UseCase<CreateIntegrationCommand, IntegrationDto> {
  constructor(
    private readonly createIntegrationHandler: CreateIntegrationHandler
  ) {
    super();
  }

  async execute(command: CreateIntegrationCommand): Promise<Result<IntegrationDto>> {
    const result = await this.createIntegrationHandler.handle(command);

    if (result.isFailure) {
      return Result.failure(result.error);
    }

    const dto = IntegrationDto.fromDomain(result.value);
    return Result.success(dto);
  }
}
