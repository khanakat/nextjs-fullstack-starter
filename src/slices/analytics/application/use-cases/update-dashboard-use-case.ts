import { injectable, inject } from 'inversify';
import { IUseCase } from '../../../../shared/application/base/use-case';
import { Result } from '../../../../shared/application/base/result';
import { UpdateDashboardCommand } from '../commands/update-dashboard-command';
import type { UpdateDashboardHandler } from '../handlers/update-dashboard-handler';
import { DashboardDto } from '../dtos/dashboard-dto';

/**
 * Update Dashboard Use Case
 * Orchestrates the update of an existing dashboard
 */
@injectable()
export class UpdateDashboardUseCase implements IUseCase<UpdateDashboardCommand, DashboardDto> {
  constructor(
    @inject('UpdateDashboardHandler') private handler: UpdateDashboardHandler
  ) {}

  async execute(command: UpdateDashboardCommand): Promise<Result<DashboardDto>> {
    return this.handler.handle(command);
  }
}
