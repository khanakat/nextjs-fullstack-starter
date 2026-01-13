import { injectable, inject } from 'inversify';
import { IUseCase } from '../../../../shared/application/base/use-case';
import { Result } from '../../../../shared/application/base/result';
import { GetDashboardsQuery } from '../queries/get-dashboards-query';
import type { GetDashboardsHandler } from '../handlers/get-dashboards-handler';
import { DashboardDto } from '../dtos/dashboard-dto';

/**
 * Get Dashboards Use Case
 * Orchestrates retrieval of multiple dashboards with optional filters
 */
@injectable()
export class GetDashboardsUseCase implements IUseCase<GetDashboardsQuery, DashboardDto[]> {
  constructor(
    @inject('GetDashboardsHandler') private handler: GetDashboardsHandler
  ) {}

  async execute(query: GetDashboardsQuery): Promise<Result<DashboardDto[]>> {
    return this.handler.handle(query);
  }
}
