import { NextRequest } from 'next/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { EmailApiController } from '@/slices/email/presentation/api/email-api.controller';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * Email Tracking API Routes
 * Handles HTTP requests for email tracking using clean architecture
 */

// POST /api/email/tracking - Record email tracking event
export async function POST(request: NextRequest) {
  try {
    const controller = DIContainer.get<EmailApiController>(TYPES.EmailApiController);
    return await controller.recordTrackingEvent(request);
  } catch (error) {
    console.error('Error in POST /api/email/tracking:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// GET /api/email/tracking - Get email tracking data and analytics
export async function GET(request: NextRequest) {
  try {
    const controller = DIContainer.get<EmailApiController>(TYPES.EmailApiController);
    return await controller.getTrackingData(request);
  } catch (error) {
    console.error('Error in GET /api/email/tracking:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
