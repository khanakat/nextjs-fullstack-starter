import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { SecurityApiController } from '@/slices/security/presentation/api/security-api.controller';
import { TYPES } from '@/shared/infrastructure/di/types';
import { MembershipService } from '@/lib/services/organization-service';

/**
 * GET /api/security/events - List security events
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId');

    if (!organizationId) {
      return Response.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Check if user has access to the organization
    const hasAccess = await MembershipService.hasUserAccess(organizationId, userId);
    if (!hasAccess) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    const controller = DIContainer.get<SecurityApiController>(TYPES.SecurityApiController);
    return controller.listSecurityEvents(request);
  } catch (error) {
    console.error('Failed to list security events:', error);
    return Response.json(
      { error: 'Failed to list security events' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/security/events - Update security event
 */
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { eventId } = body;

    // Get the event to check organization access
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const event = await prisma.securityEvent.findUnique({
      where: { id: eventId },
    });
    if (!event) {
      return Response.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if user has access to the organization
    const hasAccess = event.organizationId
      ? await MembershipService.hasUserAccess(event.organizationId, userId)
      : true;
    if (!hasAccess) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    // Add user ID to request headers for handler to use
    const headers = new Headers(request.headers);
    headers.set('x-user-id', userId);

    const requestWithUserId = new Request(request.url, {
      ...request,
      headers,
    });

    const controller = DIContainer.get<SecurityApiController>(TYPES.SecurityApiController);
    return controller.updateSecurityEvent(requestWithUserId as NextRequest);
  } catch (error) {
    console.error('Failed to update security event:', error);
    return Response.json(
      { error: 'Failed to update security event' },
      { status: 500 }
    );
  }
}
