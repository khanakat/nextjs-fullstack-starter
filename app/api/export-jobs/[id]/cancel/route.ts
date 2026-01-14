import { NextRequest } from 'next/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { ExportsApiController } from '@/slices/reporting/presentation/controllers/exports-api.controller';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * Cancel Export Job Route
 * Handles canceling export jobs
 */

// POST /api/export-jobs/[id]/cancel - Cancel an export job
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const controller = DIContainer.get<ExportsApiController>(TYPES.ExportsApiController);
    return await controller.cancelExportJob(request, { params });
  } catch (error) {
    console.error('Error in POST /api/export-jobs/[id]/cancel:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
