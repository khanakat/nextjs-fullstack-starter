import { injectable } from 'inversify';
import { UpdateIntegrationCommand } from '../commands/update-integration-command';
import { Integration } from '../../domain/entities/integration';
import { IntegrationDto } from '../dtos/integration-dto';
import { UpdateIntegrationHandler } from '../handlers/update-integration-handler';
import { UseCase } from '../../../../shared/application/base/use-case';
import { Result } from '../../../../shared/application/base/result';

/**
 * Update Integration Use Case
 */
@injectable()
export class UpdateIntegrationUseCase extends UseCase<UpdateIntegrationCommand, IntegrationDto> {
  constructor(
    private readonly updateIntegrationHandler: UpdateIntegrationHandler
  ) {
    super();
  }

  async execute(command: UpdateIntegrationCommand): Promise<Result<IntegrationDto>> {
    const result = await this.updateIntegrationHandler.handle(command);

    if (result.isFailure) {
      return Result.failure(result.error);
    }

    const dto = IntegrationDto.fromDomain(result.value);
    return Result.success(dto);
  }
}
