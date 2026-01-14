import { NextRequest } from 'next/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { WorkflowInstancesApiController } from '@/slices/workflows/presentation/api/workflow-instances-api.controller';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * Workflow Instances API Routes
 * Handles HTTP requests for workflow instance management using clean architecture
 */

// GET /api/workflows/instances - Get workflow instances with filtering
export async function GET(request: NextRequest) {
  try {
    const controller = DIContainer.get<WorkflowInstancesApiController>(TYPES.WorkflowInstancesApiController);
    return await controller.getInstances(request);
  } catch (error) {
    console.error('Error in GET /api/workflows/instances:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// POST /api/workflows/instances - Create a new workflow instance
export async function POST(request: NextRequest) {
  try {
    const controller = DIContainer.get<WorkflowInstancesApiController>(TYPES.WorkflowInstancesApiController);
    return await controller.createInstance(request);
  } catch (error) {
    console.error('Error in POST /api/workflows/instances:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
