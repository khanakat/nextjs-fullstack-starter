import { NextRequest, NextResponse } from 'next/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { UsersController } from '@/slices/user-management/presentation/api/users-controller';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * User by ID API Routes
 * Handles HTTP requests for individual user operations
 */

// GET /api/users/[id] - Get user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const controller = DIContainer.get<UsersController>(TYPES.UsersController);
    return await controller.getUser(request, { params });
  } catch (error) {
    console.error('Error in GET /api/users/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Update user profile
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const controller = DIContainer.get<UsersController>(TYPES.UsersController);
    return await controller.updateUser(request, { params });
  } catch (error) {
    console.error('Error in PUT /api/users/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}