import { NextRequest } from 'next/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { WorkflowsApiController } from '@/slices/workflows/presentation/api/workflows-api.controller';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * Workflow Execution API Routes
 * Handles HTTP requests for workflow execution using clean architecture
 */

// POST /api/workflows/[id]/execute - Execute a workflow
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const controller = DIContainer.get<WorkflowsApiController>(TYPES.WorkflowsApiController);
    return await controller.executeWorkflow(params.id, request);
  } catch (error) {
    console.error('Error in POST /api/workflows/[id]/execute:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
