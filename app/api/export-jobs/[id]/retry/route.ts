import { NextRequest } from 'next/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { ExportsApiController } from '@/slices/reporting/presentation/controllers/exports-api.controller';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * Retry Export Job Route
 * Handles retrying failed export jobs
 */

// POST /api/export-jobs/[id]/retry - Retry a failed export job
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const controller = DIContainer.get<ExportsApiController>(TYPES.ExportsApiController);
    return await controller.retryExportJob(request, { params });
  } catch (error) {
    console.error('Error in POST /api/export-jobs/[id]/retry:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
