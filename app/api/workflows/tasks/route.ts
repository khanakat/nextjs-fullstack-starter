import { NextRequest } from 'next/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { WorkflowTasksApiController } from '@/slices/workflows/presentation/api/workflow-tasks-api.controller';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * Workflow Tasks API Routes
 * Handles HTTP requests for workflow task management using clean architecture
 */

// GET /api/workflows/tasks - Get workflow tasks with filtering
export async function GET(request: NextRequest) {
  try {
    const controller = DIContainer.get<WorkflowTasksApiController>(TYPES.WorkflowTasksApiController);
    return await controller.getTasks(request);
  } catch (error) {
    console.error('Error in GET /api/workflows/tasks:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
