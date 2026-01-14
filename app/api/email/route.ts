import { NextRequest } from 'next/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { EmailApiController } from '@/slices/email/presentation/api/email-api.controller';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * Email API Routes
 * Handles HTTP requests for email management using clean architecture
 */

// POST /api/email - Send single or bulk emails
export async function POST(request: NextRequest) {
  try {
    const controller = DIContainer.get<EmailApiController>(TYPES.EmailApiController);
    return await controller.sendEmail(request);
  } catch (error) {
    console.error('Error in POST /api/email:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// GET /api/email - Get email sending statistics and history
export async function GET(request: NextRequest) {
  try {
    const controller = DIContainer.get<EmailApiController>(TYPES.EmailApiController);
    return await controller.getEmailStatistics(request);
  } catch (error) {
    console.error('Error in GET /api/email:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
