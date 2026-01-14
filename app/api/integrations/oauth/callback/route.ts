import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { IntegrationsApiController } from '@/slices/integrations/presentation/api/integrations-api.controller';
import { TYPES } from '@/shared/infrastructure/di/types';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/integrations/oauth/callback - Handle OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description') || 'OAuth authorization failed';
    const integrationId = searchParams.get('integration_id');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Handle OAuth error
    if (error) {
      const redirectUrl = new URL('/integrations', appUrl);
      redirectUrl.searchParams.set('error', error);
      redirectUrl.searchParams.set('error_description', errorDescription);
      return NextResponse.redirect(redirectUrl);
    }

    // Validate required parameters
    if (!code || !state || !integrationId) {
      const redirectUrl = new URL('/integrations', appUrl);
      redirectUrl.searchParams.set('error', 'invalid_request');
      redirectUrl.searchParams.set('error_description', 'Missing required OAuth parameters');
      return NextResponse.redirect(redirectUrl);
    }

    const authResult = auth();
    const userId = authResult.userId;

    if (!userId) {
      const redirectUrl = new URL('/sign-in', appUrl);
      redirectUrl.searchParams.set('redirect_url', request.url);
      return NextResponse.redirect(redirectUrl);
    }

    // Get user's organization
    const userOrganization = await db.organizationMember.findFirst({
      where: { userId },
      include: { organization: true },
    });

    if (!userOrganization) {
      const redirectUrl = new URL('/integrations', appUrl);
      redirectUrl.searchParams.set('error', 'no_organization');
      redirectUrl.searchParams.set('error_description', 'No organization found');
      return NextResponse.redirect(redirectUrl);
    }

    const organizationId = userOrganization.organizationId;

    // Add user ID and organization ID to request headers
    const headers = new Headers(request.headers);
    headers.set('x-user-id', userId);
    headers.set('x-organization-id', organizationId);

    const requestWithContext = new Request(request.url, {
      ...request,
      headers,
    });

    const controller = DIContainer.get<IntegrationsApiController>(TYPES.IntegrationsApiController);
    const response = await controller.handleOAuthCallback(requestWithContext as NextRequest);

    // Parse the response and redirect accordingly
    const responseData = await response.json();
    const redirectUrl = new URL('/integrations', appUrl);

    if (responseData.data && responseData.data.success) {
      redirectUrl.searchParams.set('success', 'true');
      redirectUrl.searchParams.set('integration_id', integrationId);
      redirectUrl.searchParams.set('connection_id', responseData.data.connectionId || '');
    } else {
      redirectUrl.searchParams.set('error', 'oauth_failed');
      redirectUrl.searchParams.set(
        'error_description',
        responseData.data?.errorDescription || responseData.error || 'OAuth callback failed'
      );
      redirectUrl.searchParams.set('integration_id', integrationId);
    }

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('OAuth callback processing error:', error);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUrl = new URL('/integrations', appUrl);
    redirectUrl.searchParams.set('error', 'callback_error');
    redirectUrl.searchParams.set('error_description', 'OAuth callback processing failed');

    return NextResponse.redirect(redirectUrl);
  }
}
