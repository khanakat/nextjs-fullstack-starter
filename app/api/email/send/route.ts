import { NextRequest } from 'next/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { EmailApiController } from '@/slices/email/presentation/api/email-api.controller';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * Email Send API Routes
 * Handles HTTP requests for bulk email sending using clean architecture
 */

// POST /api/email/send - Send bulk emails with advanced options
export async function POST(request: NextRequest) {
  try {
    const controller = DIContainer.get<EmailApiController>(TYPES.EmailApiController);
    return await controller.sendBulkEmail(request);
  } catch (error) {
    console.error('Error in POST /api/email/send:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// GET /api/email/send - Get bulk email sending status and queue
export async function GET(request: NextRequest) {
  try {
    const controller = DIContainer.get<EmailApiController>(TYPES.EmailApiController);
    return await controller.getTrackingData(request);
  } catch (error) {
    console.error('Error in GET /api/email/send:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
