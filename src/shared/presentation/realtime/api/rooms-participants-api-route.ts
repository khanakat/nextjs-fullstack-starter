import { NextRequest, NextResponse } from 'next/server';
import { injectable } from 'inversify';
import { RealtimeController } from '../realtime-controller';

/**
 * Rooms Participants API Route
 * Handles HTTP requests for room participants
 */
@injectable()
export class RoomsParticipantsApiRoute {
  constructor(
    private readonly realtimeController: RealtimeController
  ) {}

  /**
   * GET /api/realtime/rooms/:roomId/participants
   * Get room participants
   */
  async getRoomParticipants(request: NextRequest, roomId: string): Promise<NextResponse> {
    return await this.realtimeController.getRoomParticipants(request, roomId);
  }
}

/**
 * Next.js API route handler for /api/realtime/rooms/[roomId]/participants
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  const apiRoute = new RoomsParticipantsApiRoute(
    {} as any // realtimeController - would be injected by DI container
  );

  return await apiRoute.getRoomParticipants(request, params.roomId);
}
