import { NextRequest, NextResponse } from 'next/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { UsersController } from '@/slices/user-management/presentation/api/users-controller';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * Users API Routes
 * Handles HTTP requests for user management using clean architecture
 */

// GET /api/users - Get users with pagination and filtering
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const controller = DIContainer.get<UsersController>(TYPES.UsersController);
    return await controller.getUsers(request);
  } catch (error) {
    console.error('Error in GET /api/users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const controller = DIContainer.get<UsersController>(TYPES.UsersController);
    return await controller.createUser(request);
  } catch (error) {
    console.error('Error in POST /api/users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}