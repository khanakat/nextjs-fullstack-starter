/**
 * Mobile Device API Routes
 * Migrated to Clean Architecture
 */

import { NextRequest } from 'next/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { TYPES } from '@/shared/infrastructure/di/types';
import { auth } from '@clerk/nextjs/server';

const getController = () => {
  return DIContainer.get<any>(TYPES.MobileApiController);
};

export async function POST(request: NextRequest) {
  return getController().registerDevice(request);
}

export async function GET(request: NextRequest) {
  return getController().getDevices(request);
}

export async function PUT(request: NextRequest) {
  return getController().updateDevice(request);
}

export async function DELETE(request: NextRequest) {
  return getController().deleteDevice(request);
}
