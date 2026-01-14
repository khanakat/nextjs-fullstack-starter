import { NextRequest } from 'next/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { ExportsApiController } from '@/slices/reporting/presentation/controllers/exports-api.controller';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * Bulk Delete Export Jobs Route
 * Handles deleting multiple export jobs
 */

// POST /api/export-jobs/bulk-delete - Delete multiple export jobs
export async function POST(request: NextRequest) {
  try {
    const controller = DIContainer.get<ExportsApiController>(TYPES.ExportsApiController);
    return await controller.bulkDeleteExportJobs(request);
  } catch (error) {
    console.error('Error in POST /api/export-jobs/bulk-delete:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
