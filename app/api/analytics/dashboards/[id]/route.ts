import { NextRequest } from 'next/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { DashboardsApiController } from '@/slices/analytics/presentation/api/dashboards-api.controller';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * Dashboard by ID API Routes
 * Handles HTTP requests for individual dashboard management using clean architecture
 */

// GET /api/analytics/dashboards/[id] - Get dashboard by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const controller = DIContainer.get<DashboardsApiController>(TYPES.DashboardsController);
    return await controller.getDashboard(params.id);
  } catch (error) {
    console.error('Error in GET /api/analytics/dashboards/[id]:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// PUT /api/analytics/dashboards/[id] - Update a dashboard
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const controller = DIContainer.get<DashboardsApiController>(TYPES.DashboardsController);
    return await controller.updateDashboard(params.id, request);
  } catch (error) {
    console.error('Error in PUT /api/analytics/dashboards/[id]:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// DELETE /api/analytics/dashboards/[id] - Delete a dashboard
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const controller = DIContainer.get<DashboardsApiController>(TYPES.DashboardsController);
    return await controller.deleteDashboard(params.id);
  } catch (error) {
    console.error('Error in DELETE /api/analytics/dashboards/[id]:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
