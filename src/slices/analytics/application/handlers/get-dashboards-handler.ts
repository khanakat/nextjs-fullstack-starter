import { injectable, inject } from 'inversify';
import { IQueryHandler } from '../../../../shared/application/base/query-handler';
import { Result } from '../../../../shared/application/base/result';
import { Dashboard } from '../../domain/entities/dashboard';
import { GetDashboardsQuery } from '../queries/get-dashboards-query';
import type { IDashboardRepository } from '../../domain/repositories/dashboard-repository';
import { DashboardDto } from '../dtos/dashboard-dto';

/**
 * Get Dashboards Handler
 * Handles retrieval of multiple dashboards with optional filters
 */
@injectable()
export class GetDashboardsHandler implements IQueryHandler<GetDashboardsQuery, DashboardDto[]> {
  constructor(
    @inject('DashboardRepository') private dashboardRepository: IDashboardRepository
  ) {}

  async handle(query: GetDashboardsQuery): Promise<Result<DashboardDto[]>> {
    // Build where clause for filtering
    const where: any = {};

    if (query.props.organizationId) {
      where.organizationId = query.props.organizationId;
    }

    if (query.props.createdBy) {
      where.createdBy = query.props.createdBy;
    }

    if (query.props.status) {
      // Filter by status from settings JSON (client-side filter)
      const dashboards = await this.dashboardRepository.findAll();
      const filteredDashboards = dashboards.filter(d => d.status === query.props.status);
      const dtos = filteredDashboards.map((dashboard) => this.toDto(dashboard));
      return Result.success(dtos);
    }

    if (query.props.isPublic !== undefined) {
      where.isPublic = query.props.isPublic;
    }

    if (query.props.isTemplate !== undefined) {
      where.isTemplate = query.props.isTemplate;
    }

    // Apply pagination
    const page = query.props.page || 1;
    const limit = query.props.limit || 20;

    // Fetch dashboards
    let dashboards = await this.dashboardRepository.findAll();

    // Apply filters
    if (Object.keys(where).length > 0) {
      dashboards = dashboards.filter((d) => {
        if (query.props.organizationId && d.organizationId !== query.props.organizationId) {
          return false;
        }
        if (query.props.createdBy && d.createdBy !== query.props.createdBy) {
          return false;
        }
        if (query.props.status && d.status !== query.props.status) {
          return false;
        }
        if (query.props.isPublic !== undefined && d.isPublic !== query.props.isPublic) {
          return false;
        }
        if (query.props.isTemplate !== undefined && d.isTemplate !== query.props.isTemplate) {
          return false;
        }
        return true;
      });
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedDashboards = dashboards.slice(startIndex, startIndex + limit);

    // Convert to DTOs
    const dtos = paginatedDashboards.map((dashboard) => this.toDto(dashboard));

    return Result.success(dtos);
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
