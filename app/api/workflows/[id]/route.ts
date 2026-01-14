import { NextRequest } from 'next/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { WorkflowsApiController } from '@/slices/workflows/presentation/api/workflows-api.controller';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * Workflow by ID API Routes
 * Handles HTTP requests for individual workflow management using clean architecture
 */

// GET /api/workflows/[id] - Get workflow by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const controller = DIContainer.get<WorkflowsApiController>(TYPES.WorkflowsApiController);
    return await controller.getWorkflow(params.id);
  } catch (error) {
    console.error('Error in GET /api/workflows/[id]:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// PUT /api/workflows/[id] - Update a workflow
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const controller = DIContainer.get<WorkflowsApiController>(TYPES.WorkflowsApiController);
    return await controller.updateWorkflow(params.id, request);
  } catch (error) {
    console.error('Error in PUT /api/workflows/[id]:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// DELETE /api/workflows/[id] - Delete a workflow
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const controller = DIContainer.get<WorkflowsApiController>(TYPES.WorkflowsApiController);
    return await controller.deleteWorkflow(params.id);
  } catch (error) {
    console.error('Error in DELETE /api/workflows/[id]:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
