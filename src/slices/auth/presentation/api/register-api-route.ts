import { NextRequest, NextResponse } from 'next/server';
import { RegisterUserCommand } from '../../application/commands/register-user-command';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * Register User API Route
 * 
 * Next.js API route for user registration.
 * Handles POST /api/auth/register requests.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const command = new RegisterUserCommand({
      email: body.email,
      password: body.password,
      name: body.name,
      username: body.username,
    });

    // TODO: Execute use case through DI container
    // For now, return a mock response
    return NextResponse.json({
      success: true,
      user: {
        id: 'mock-user-id',
        email: body.email,
        name: body.name,
        username: body.username,
      },
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
