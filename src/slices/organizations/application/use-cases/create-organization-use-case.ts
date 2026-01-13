import { injectable, inject } from 'inversify';
import { UseCase } from '../../../../shared/application/base/use-case';
import { Result } from '../../../../shared/application/base/result';
import { CreateOrganizationCommand } from '../commands/create-organization-command';
import { CreateOrganizationHandler } from '../handlers/create-organization-handler';
import { OrganizationDto } from '../dtos/organization-dto';

/**
 * Create Organization Use Case
 * Orchestrates the creation of a new organization
 */
@injectable()
export class CreateOrganizationUseCase extends UseCase<CreateOrganizationCommand, OrganizationDto> {
  constructor(
    @inject('CreateOrganizationHandler') private handler: CreateOrganizationHandler
  ) {
    super();
  }

  /**
   * Execute * use case
   */
  async execute(command: CreateOrganizationCommand): Promise<Result<OrganizationDto>> {
    const result = await this.handler.handle(command);

    if (result.isFailure) {
      return Result.failure(result.error);
    }

    const dto = OrganizationDto.fromEntity(result.value);
    return Result.success(dto);
  }
}
