import { NextRequest } from 'next/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { ExportsApiController } from '@/slices/reporting/presentation/controllers/exports-api.controller';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * Export Jobs API Routes
 * Handles HTTP requests for export job management using clean architecture
 */

// GET /api/export-jobs - List export jobs for the current user
export async function GET(request: NextRequest) {
  try {
    const controller = DIContainer.get<ExportsApiController>(TYPES.ExportsApiController);
    return await controller.getExportJobs(request);
  } catch (error) {
    console.error('Error in GET /api/export-jobs:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// POST /api/export-jobs - Create a new export job
export async function POST(request: NextRequest) {
  try {
    const controller = DIContainer.get<ExportsApiController>(TYPES.ExportsApiController);
    return await controller.createExportJob(request);
  } catch (error) {
    console.error('Error in POST /api/export-jobs:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
