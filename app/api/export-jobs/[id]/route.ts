import { NextRequest } from 'next/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { ExportsApiController } from '@/slices/reporting/presentation/controllers/exports-api.controller';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * Export Job Detail API Routes
 * Handles HTTP requests for individual export job operations
 */

// GET /api/export-jobs/[id] - Get a specific export job
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const controller = DIContainer.get<ExportsApiController>(TYPES.ExportsApiController);
    return await controller.getExportJob(request, { params });
  } catch (error) {
    console.error('Error in GET /api/export-jobs/[id]:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// DELETE /api/export-jobs/[id] - Delete an export job
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const controller = DIContainer.get<ExportsApiController>(TYPES.ExportsApiController);
    return await controller.deleteExportJob(request, { params });
  } catch (error) {
    console.error('Error in DELETE /api/export-jobs/[id]:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
