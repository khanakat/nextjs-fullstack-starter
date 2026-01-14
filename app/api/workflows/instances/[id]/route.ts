import { NextRequest } from 'next/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { WorkflowInstancesApiController } from '@/slices/workflows/presentation/api/workflow-instances-api.controller';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * Workflow Instances API Routes
 * Handles HTTP requests for workflow instance management using clean architecture
 */

// GET /api/workflows/instances/[id] - Get workflow instance by ID
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const controller = DIContainer.get<WorkflowInstancesApiController>(TYPES.WorkflowInstancesApiController);
    return await controller.getInstance(params.id);
  } catch (error) {
    console.error('Error in GET /api/workflows/instances/[id]:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// PUT /api/workflows/instances/[id] - Update workflow instance
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const controller = DIContainer.get<WorkflowInstancesApiController>(TYPES.WorkflowInstancesApiController);
    return await controller.updateInstance(params.id, request);
  } catch (error) {
    console.error('Error in PUT /api/workflows/instances/[id]:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// POST /api/workflows/instances/[id] - Perform workflow action
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const controller = DIContainer.get<WorkflowInstancesApiController>(TYPES.WorkflowInstancesApiController);
    return await controller.performAction(params.id, request);
  } catch (error) {
    console.error('Error in POST /api/workflows/instances/[id]:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
