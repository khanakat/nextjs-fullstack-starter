import { NextRequest, NextResponse } from 'next/server';
import { injectable } from 'inversify';
import { RealtimeController } from '../realtime-controller';

/**
 * Realtime API Route
 * Handles HTTP requests for realtime features
 */
@injectable()
export class RealtimeApiRoute {
  constructor(
    private readonly realtimeController: RealtimeController
  ) {}

  /**
   * GET /api/realtime/rooms
   * Get active rooms
   */
  async getActiveRooms(request: NextRequest): Promise<NextResponse> {
    return await this.realtimeController.getActiveRooms(request);
  }

  /**
   * POST /api/realtime/connections
   * Register a new socket connection
   */
  async registerConnection(request: NextRequest): Promise<NextResponse> {
    return await this.realtimeController.registerConnection(request);
  }

  /**
   * POST /api/realtime/rooms/join
   * Join a collaboration room
   */
  async joinRoom(request: NextRequest): Promise<NextResponse> {
    return await this.realtimeController.joinRoom(request);
  }

  /**
   * POST /api/realtime/rooms/leave
   * Leave a collaboration room
   */
  async leaveRoom(request: NextRequest): Promise<NextResponse> {
    return await this.realtimeController.leaveRoom(request);
  }

  /**
   * GET /api/realtime/rooms/:roomId/participants
   * Get room participants
   */
  async getRoomParticipants(request: NextRequest, roomId: string): Promise<NextResponse> {
    return await this.realtimeController.getRoomParticipants(request, roomId);
  }
}

/**
 * Next.js API route handler for /api/realtime/rooms
 */
export async function GET(request: NextRequest) {
  const apiRoute = new RealtimeApiRoute(
    {} as any // realtimeController - would be injected by DI container
  );

  return await apiRoute.getActiveRooms(request);
}

/**
 * Next.js API route handler for POST requests
 */
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  const apiRoute = new RealtimeApiRoute(
    {} as any // realtimeController - would be injected by DI container
  );

  if (action === 'join') {
    return await apiRoute.joinRoom(request);
  }

  if (action === 'leave') {
    return await apiRoute.leaveRoom(request);
  }

  // Default action: register connection
  return await apiRoute.registerConnection(request);
}
