import { injectable, inject } from 'inversify';
import { NextRequest, NextResponse } from 'next/server';
import { CreateDashboardCommand } from '../../application/commands/create-dashboard-command';
import { UpdateDashboardCommand } from '../../application/commands/update-dashboard-command';
import { DeleteDashboardCommand } from '../../application/commands/delete-dashboard-command';
import { GetDashboardQuery } from '../../application/queries/get-dashboard-query';
import { GetDashboardsQuery } from '../../application/queries/get-dashboards-query';
import { CreateDashboardHandler } from '../../application/handlers/create-dashboard-handler';
import { UpdateDashboardHandler } from '../../application/handlers/update-dashboard-handler';
import { DeleteDashboardHandler } from '../../application/handlers/delete-dashboard-handler';
import { GetDashboardHandler } from '../../application/handlers/get-dashboard-handler';
import { GetDashboardsHandler } from '../../application/handlers/get-dashboards-handler';
import { TYPES } from '@/shared/infrastructure/di/types';
import { UniqueId } from '@/shared/domain/value-objects/unique-id';

/**
 * Dashboards API Controller
 * Handles HTTP requests for dashboard management
 */
@injectable()
export class DashboardsApiController {
  constructor(
    @inject(TYPES.CreateDashboardHandler) private createDashboardHandler: CreateDashboardHandler,
    @inject(TYPES.UpdateDashboardHandler) private updateDashboardHandler: UpdateDashboardHandler,
    @inject(TYPES.DeleteDashboardHandler) private deleteDashboardHandler: DeleteDashboardHandler,
    @inject(TYPES.GetDashboardHandler) private getDashboardHandler: GetDashboardHandler,
    @inject(TYPES.GetDashboardsHandler) private getDashboardsHandler: GetDashboardsHandler
  ) {}

  /**
   * GET /api/analytics/dashboards
   * Get dashboards with filtering and pagination
   */
  async getDashboards(request: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url);

      const query = new GetDashboardsQuery({
        organizationId: searchParams.get('organizationId') || undefined,
        createdBy: searchParams.get('createdBy') || undefined,
        status: searchParams.get('status') as any || undefined,
        isPublic: searchParams.get('isPublic') === 'true' ? true : undefined,
        isTemplate: searchParams.get('isTemplate') === 'true' ? true : undefined,
        page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
        limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      });

      const result = await this.getDashboardsHandler.handle(query);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { data: result.value },
        { status: 200 }
      );
    } catch (error) {
      console.error('Error in DashboardsApiController.getDashboards:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * GET /api/analytics/dashboards/[id]
   * Get dashboard by ID
   */
  async getDashboard(dashboardId: string): Promise<NextResponse> {
    try {
      const query = new GetDashboardQuery(UniqueId.create(dashboardId));
      const result = await this.getDashboardHandler.handle(query);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { data: result.value },
        { status: 200 }
      );
    } catch (error) {
      console.error('Error in DashboardsApiController.getDashboard:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * POST /api/analytics/dashboards
   * Create a new dashboard
   */
  async createDashboard(request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();

      const command = new CreateDashboardCommand({
        name: body.name,
        description: body.description || '',
        layout: body.layout ? JSON.stringify(body.layout) : '{}',
        settings: body.settings ? JSON.stringify(body.settings) : '{}',
        isPublic: body.isPublic || false,
        isTemplate: body.isTemplate || false,
        tags: body.tags || [],
        organizationId: body.organizationId,
        createdBy: body.createdBy,
      });

      const result = await this.createDashboardHandler.handle(command);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { data: result.value },
        { status: 201 }
      );
    } catch (error) {
      console.error('Error in DashboardsApiController.createDashboard:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * PUT /api/analytics/dashboards/[id]
   * Update a dashboard
   */
  async updateDashboard(dashboardId: string, request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();

      const command = new UpdateDashboardCommand(
        UniqueId.create(dashboardId),
        {
          name: body.name,
          description: body.description,
          layout: body.layout ? JSON.stringify(body.layout) : undefined,
          settings: body.settings ? JSON.stringify(body.settings) : undefined,
          isPublic: body.isPublic,
          tags: body.tags,
        }
      );

      const result = await this.updateDashboardHandler.handle(command);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { data: result.value },
        { status: 200 }
      );
    } catch (error) {
      console.error('Error in DashboardsApiController.updateDashboard:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * DELETE /api/analytics/dashboards/[id]
   * Delete a dashboard
   */
  async deleteDashboard(dashboardId: string): Promise<NextResponse> {
    try {
      const command = new DeleteDashboardCommand(UniqueId.create(dashboardId));
      const result = await this.deleteDashboardHandler.handle(command);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { data: { success: true } },
        { status: 200 }
      );
    } catch (error) {
      console.error('Error in DashboardsApiController.deleteDashboard:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
}
