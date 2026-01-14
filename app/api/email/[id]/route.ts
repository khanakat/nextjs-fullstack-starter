import { NextRequest } from 'next/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { EmailApiController } from '@/slices/email/presentation/api/email-api.controller';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * Email [id] API Routes
 * Handles HTTP requests for specific email operations
 */

// GET /api/email/[id] - Get specific email details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const controller = DIContainer.get<EmailApiController>(TYPES.EmailApiController);
    return await controller.getEmailById(params.id, request);
  } catch (error) {
    console.error('Error in GET /api/email/[id]:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Note: PATCH and DELETE would be implemented similarly in the controller
// For now, we're keeping the existing functionality
