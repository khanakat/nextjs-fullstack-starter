import { NextRequest } from 'next/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { EmailApiController } from '@/slices/email/presentation/api/email-api.controller';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * Email Test API Routes
 * Handles HTTP requests for testing email functionality using clean architecture
 */

// POST /api/email/test - Test email functionality
export async function POST(request: NextRequest) {
  try {
    const controller = DIContainer.get<EmailApiController>(TYPES.EmailApiController);
    return await controller.testEmail(request);
  } catch (error) {
    console.error('Error in POST /api/email/test:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
