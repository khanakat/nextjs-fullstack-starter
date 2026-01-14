import { NextRequest } from 'next/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { OrganizationsApiController } from '@/slices/organizations/presentation/api/organizations-api.controller';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * Organizations API Routes
 * Handles HTTP requests for organization management using clean architecture
 */

// GET /api/organizations - Get organizations for the current user
export async function GET(request: NextRequest) {
  try {
    const controller = DIContainer.get<OrganizationsApiController>(TYPES.OrganizationsController);
    return await controller.getOrganizations(request);
  } catch (error) {
    console.error('Error in GET /api/organizations:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// POST /api/organizations - Create a new organization
export async function POST(request: NextRequest) {
  try {
    const controller = DIContainer.get<OrganizationsApiController>(TYPES.OrganizationsController);
    return await controller.createOrganization(request);
  } catch (error) {
    console.error('Error in POST /api/organizations:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
