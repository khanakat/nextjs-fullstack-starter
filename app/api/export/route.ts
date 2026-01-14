import { NextRequest } from 'next/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { ExportsApiController } from '@/slices/reporting/presentation/controllers/exports-api.controller';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * Export API Routes
 * Handles HTTP requests for export management using clean architecture
 */

// POST /api/export - Generate direct export (without queue)
export async function POST(request: NextRequest) {
  try {
    const controller = DIContainer.get<ExportsApiController>(TYPES.ExportsApiController);
    return await controller.generateDirectExport(request);
  } catch (error) {
    console.error('Error in POST /api/export:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// GET /api/export - Get export history (deprecated - use /api/export-jobs)
export async function GET(request: NextRequest) {
  try {
    const controller = DIContainer.get<ExportsApiController>(TYPES.ExportsApiController);
    return await controller.getExportJobs(request);
  } catch (error) {
    console.error('Error in GET /api/export:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
