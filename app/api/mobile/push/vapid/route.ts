/**
 * VAPID Key API Routes
 * Migrated to Clean Architecture
 */

import { NextRequest } from 'next/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { TYPES } from '@/shared/infrastructure/di/types';

// Prevent prerendering - this route requires runtime dependencies
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const controller = DIContainer.get<any>(TYPES.MobileApiController);
    return controller.getVapidKey(request);
  } catch (error) {
    return Response.json(
      { error: 'Failed to get VAPID key' },
      { status: 500 }
    );
  }
}
