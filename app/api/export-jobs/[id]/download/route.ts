import { NextRequest } from 'next/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { ExportsApiController } from '@/slices/reporting/presentation/controllers/exports-api.controller';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * Download Export File Route
 * Handles downloading exported files
 */

// GET /api/export-jobs/[id]/download - Download exported file
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const controller = DIContainer.get<ExportsApiController>(TYPES.ExportsApiController);
    return await controller.downloadExportFile(request, { params });
  } catch (error) {
    console.error('Error in GET /api/export-jobs/[id]/download:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
