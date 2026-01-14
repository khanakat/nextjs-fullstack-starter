/**
 * Mobile Sync API Routes
 * Migrated to Clean Architecture
 */

import { NextRequest } from 'next/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { TYPES } from '@/shared/infrastructure/di/types';

const getController = () => {
  return DIContainer.get<any>(TYPES.MobileApiController);
};

export async function POST(request: NextRequest) {
  return getController().syncData(request);
}

export async function GET(request: NextRequest) {
  return getController().getServerUpdates(request);
}
