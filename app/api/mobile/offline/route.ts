/**
 * Offline Actions API Routes
 * Migrated to Clean Architecture
 */

import { NextRequest } from 'next/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { TYPES } from '@/shared/infrastructure/di/types';

const getController = () => {
  return DIContainer.get<any>(TYPES.MobileApiController);
};

export async function POST(request: NextRequest) {
  return getController().queueOfflineActions(request);
}

export async function GET(request: NextRequest) {
  return getController().getOfflineActions(request);
}

export async function PUT(request: NextRequest) {
  return getController().updateOfflineAction(request);
}

export async function DELETE(request: NextRequest) {
  return getController().deleteOfflineActions(request);
}
