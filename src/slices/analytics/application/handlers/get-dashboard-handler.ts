import { injectable, inject } from 'inversify';
import { IQueryHandler } from '../../../../shared/application/base/query-handler';
import { Result } from '../../../../shared/application/base/result';
import { Dashboard } from '../../domain/entities/dashboard';
import { GetDashboardQuery } from '../queries/get-dashboard-query';
import type { IDashboardRepository } from '../../domain/repositories/dashboard-repository';
import { DashboardDto } from '../dtos/dashboard-dto';

/**
 * Get Dashboard Handler
 * Handles retrieval of a single dashboard by ID
 */
@injectable()
export class GetDashboardHandler implements IQueryHandler<GetDashboardQuery, DashboardDto> {
  constructor(
    @inject('DashboardRepository') private dashboardRepository: IDashboardRepository
  ) {}

  async handle(query: GetDashboardQuery): Promise<Result<DashboardDto>> {
    const dashboard = await this.dashboardRepository.findById(query.dashboardId);

    if (!dashboard) {
      return Result.failure<DashboardDto>(new Error('Dashboard not found'));
    }

    // Increment view count
    await this.dashboardRepository.incrementViewCount(query.dashboardId);

    // Return DTO
    return Result.success(this.toDto(dashboard));
  }

  private toDto(dashboard: Dashboard): DashboardDto {
    return new DashboardDto(
      dashboard.id.value,
      new Date(),
      {
        name: dashboard.name,
        description: dashboard.description,
        layout: dashboard.layout,
        settings: dashboard.settings,
        isPublic: dashboard.isPublic,
        isTemplate: dashboard.isTemplate,
        tags: dashboard.tags,
        organizationId: dashboard.organizationId,
        createdBy: dashboard.createdBy,
        status: dashboard.status,
        lastViewedAt: undefined,
        viewCount: 0,
      }
    );
  }
}
