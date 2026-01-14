import { NextRequest } from 'next/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { WorkflowsApiController } from '@/slices/workflows/presentation/api/workflows-api.controller';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * Workflows API Routes
 * Handles HTTP requests for workflow management using clean architecture
 */

// GET /api/workflows - Get workflows with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const controller = DIContainer.get<WorkflowsApiController>(TYPES.WorkflowsApiController);
    return await controller.getWorkflows(request);
  } catch (error) {
    console.error('Error in GET /api/workflows:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// POST /api/workflows - Create a new workflow
export async function POST(request: NextRequest) {
  try {
    const controller = DIContainer.get<WorkflowsApiController>(TYPES.WorkflowsApiController);
    return await controller.createWorkflow(request);
  } catch (error) {
    console.error('Error in POST /api/workflows:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
