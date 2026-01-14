import { NextRequest } from 'next/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { EmailListsApiController } from '@/slices/email/presentation/api/email-lists-api.controller';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * Email Lists API Routes
 * Handles HTTP requests for email list management using clean architecture
 */

// POST /api/email/lists - Create a new email list
export async function POST(request: NextRequest) {
  try {
    const controller = DIContainer.get<EmailListsApiController>(TYPES.EmailListsApiController);
    return await controller.createEmailList(request);
  } catch (error) {
    console.error('Error in POST /api/email/lists:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// GET /api/email/lists - Get email lists
export async function GET(request: NextRequest) {
  try {
    const controller = DIContainer.get<EmailListsApiController>(TYPES.EmailListsApiController);
    return await controller.getEmailLists(request);
  } catch (error) {
    console.error('Error in GET /api/email/lists:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
