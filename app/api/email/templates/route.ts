import { NextRequest } from 'next/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { EmailTemplatesApiController } from '@/slices/email/presentation/api/email-templates-api.controller';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * Email Templates API Routes
 * Handles HTTP requests for email template management using clean architecture
 */

// POST /api/email/templates - Create a new email template
export async function POST(request: NextRequest) {
  try {
    const controller = DIContainer.get<EmailTemplatesApiController>(TYPES.EmailTemplatesApiController);
    return await controller.createEmailTemplate(request);
  } catch (error) {
    console.error('Error in POST /api/email/templates:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// GET /api/email/templates - Get email templates
export async function GET(request: NextRequest) {
  try {
    const controller = DIContainer.get<EmailTemplatesApiController>(TYPES.EmailTemplatesApiController);
    return await controller.getEmailTemplates(request);
  } catch (error) {
    console.error('Error in GET /api/email/templates:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
