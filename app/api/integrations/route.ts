import { NextRequest } from 'next/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { IntegrationsApiController } from '@/slices/integrations/presentation/api/integrations-api.controller';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * Integrations API Routes
 * Handles HTTP requests for integration management using clean architecture
 */

// GET /api/integrations - Get integrations with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const controller = DIContainer.get<IntegrationsApiController>(TYPES.IntegrationsApiController);
    return await controller.getIntegrations(request);
  } catch (error) {
    console.error('Error in GET /api/integrations:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// POST /api/integrations - Create a new integration
export async function POST(request: NextRequest) {
  try {
    const controller = DIContainer.get<IntegrationsApiController>(TYPES.IntegrationsApiController);
    return await controller.createIntegration(request);
  } catch (error) {
    console.error('Error in POST /api/integrations:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
