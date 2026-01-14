import { NextRequest } from 'next/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { DashboardsApiController } from '@/slices/analytics/presentation/api/dashboards-api.controller';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * Dashboards API Routes
 * Handles HTTP requests for dashboard management using clean architecture
 */

// GET /api/analytics/dashboards - Get dashboards with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const controller = DIContainer.get<DashboardsApiController>(TYPES.DashboardsController);
    return await controller.getDashboards(request);
  } catch (error) {
    console.error('Error in GET /api/analytics/dashboards:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// POST /api/analytics/dashboards - Create a new dashboard
export async function POST(request: NextRequest) {
  try {
    const controller = DIContainer.get<DashboardsApiController>(TYPES.DashboardsController);
    return await controller.createDashboard(request);
  } catch (error) {
    console.error('Error in POST /api/analytics/dashboards:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

