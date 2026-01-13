import { injectable, inject } from 'inversify';
import { IUseCase } from '../../../../shared/application/base/use-case';
import { Result } from '../../../../shared/application/base/result';
import { CreateDashboardCommand } from '../commands/create-dashboard-command';
import type { CreateDashboardHandler } from '../handlers/create-dashboard-handler';
import { DashboardDto } from '../dtos/dashboard-dto';

/**
 * Create Dashboard Use Case
 * Orchestrates the creation of a new dashboard
 */
@injectable()
export class CreateDashboardUseCase implements IUseCase<CreateDashboardCommand, DashboardDto> {
  constructor(
    @inject('CreateDashboardHandler') private handler: CreateDashboardHandler
  ) {}

  async execute(command: CreateDashboardCommand): Promise<Result<DashboardDto>> {
    return this.handler.handle(command);
  }
}
