import { NextRequest } from 'next/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { WorkflowTasksApiController } from '@/slices/workflows/presentation/api/workflow-tasks-api.controller';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * Workflow Tasks API Routes
 * Handles HTTP requests for workflow task management using clean architecture
 */

// GET /api/workflows/tasks/[id] - Get workflow task by ID
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const controller = DIContainer.get<WorkflowTasksApiController>(TYPES.WorkflowTasksApiController);
    return await controller.getTask(params.id);
  } catch (error) {
    console.error('Error in GET /api/workflows/tasks/[id]:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// PUT /api/workflows/tasks/[id] - Update workflow task
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const controller = DIContainer.get<WorkflowTasksApiController>(TYPES.WorkflowTasksApiController);
    return await controller.updateTask(params.id, request);
  } catch (error) {
    console.error('Error in PUT /api/workflows/tasks/[id]:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// POST /api/workflows/tasks/[id] - Complete workflow task
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const controller = DIContainer.get<WorkflowTasksApiController>(TYPES.WorkflowTasksApiController);
    return await controller.completeTask(params.id, request);
  } catch (error) {
    console.error('Error in POST /api/workflows/tasks/[id]:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
