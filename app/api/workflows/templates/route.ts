import { NextRequest } from 'next/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { WorkflowTemplatesApiController } from '@/slices/workflows/presentation/api/workflow-templates-api.controller';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * Workflow Templates API Routes
 * Handles HTTP requests for workflow template management using clean architecture
 */

// GET /api/workflows/templates - Get workflow templates with filtering
export async function GET(request: NextRequest) {
  try {
    const controller = DIContainer.get<WorkflowTemplatesApiController>(TYPES.WorkflowTemplatesApiController);
    return await controller.getTemplates(request);
  } catch (error) {
    console.error('Error in GET /api/workflows/templates:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// POST /api/workflows/templates - Create a new workflow template
export async function POST(request: NextRequest) {
  try {
    const controller = DIContainer.get<WorkflowTemplatesApiController>(TYPES.WorkflowTemplatesApiController);
    return await controller.createTemplate(request);
  } catch (error) {
    console.error('Error in POST /api/workflows/templates:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
