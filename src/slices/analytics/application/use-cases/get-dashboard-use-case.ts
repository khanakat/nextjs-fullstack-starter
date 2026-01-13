import { injectable, inject } from 'inversify';
import { IUseCase } from '../../../../shared/application/base/use-case';
import { Result } from '../../../../shared/application/base/result';
import { GetDashboardQuery } from '../queries/get-dashboard-query';
import type { GetDashboardHandler } from '../handlers/get-dashboard-handler';
import { DashboardDto } from '../dtos/dashboard-dto';

/**
 * Get Dashboard Use Case
 * Orchestrates retrieval of a single dashboard by ID
 */
@injectable()
export class GetDashboardUseCase implements IUseCase<GetDashboardQuery, DashboardDto> {
  constructor(
    @inject('GetDashboardHandler') private handler: GetDashboardHandler
  ) {}

  async execute(query: GetDashboardQuery): Promise<Result<DashboardDto>> {
    return this.handler.handle(query);
  }
}
