import { injectable } from 'inversify';
import { NextRequest, NextResponse } from 'next/server';
import { BaseController } from '../base/base-controller';
import { RegisterConnectionHandler } from '../../application/realtime/handlers/register-connection-handler';
import { JoinRoomHandler } from '../../application/realtime/handlers/join-room-handler';
import { LeaveRoomHandler } from '../../application/realtime/handlers/leave-room-handler';
import { GetRoomParticipantsHandler } from '../../application/realtime/handlers/get-room-participants-handler';
import { GetActiveRoomsHandler } from '../../application/realtime/handlers/get-active-rooms-handler';
import { RegisterConnectionCommand } from '../../application/realtime/commands/register-connection-command';
import { JoinRoomCommand } from '../../application/realtime/commands/join-room-command';
import { LeaveRoomCommand } from '../../application/realtime/commands/leave-room-command';
import { GetRoomParticipantsQuery } from '../../application/realtime/queries/get-room-participants-query';
import { GetActiveRoomsQuery } from '../../application/realtime/queries/get-active-rooms-query';

/**
 * Realtime Controller
 * Handles HTTP requests for realtime features
 */
@injectable()
export class RealtimeController extends BaseController {
  constructor(
    private readonly registerConnectionHandler: RegisterConnectionHandler,
    private readonly joinRoomHandler: JoinRoomHandler,
    private readonly leaveRoomHandler: LeaveRoomHandler,
    private readonly getRoomParticipantsHandler: GetRoomParticipantsHandler,
    private readonly getActiveRoomsHandler: GetActiveRoomsHandler
  ) {
    super();
  }

  /**
   * POST /api/realtime/connections
   * Register a new socket connection
   */
  async registerConnection(request: NextRequest): Promise<NextResponse> {
    return this.execute(request, async () => {
      const body = await this.parseBody<{
        socketId: string;
        userId: string;
        userName: string;
        userEmail: string;
        userAvatar?: string;
        organizationId: string;
      }>(request);

      const command = new RegisterConnectionCommand(
        body.socketId,
        body.userId,
        body.userName,
        body.userEmail,
        body.userAvatar ?? '',
        body.organizationId
      );

      return await this.registerConnectionHandler.handle(command);
    });
  }

  /**
   * POST /api/realtime/rooms/join
   * Join a collaboration room
   */
  async joinRoom(request: NextRequest): Promise<NextResponse> {
    return this.execute(request, async () => {
      const body = await this.parseBody<{
        socketId: string;
        type: any;
        resourceId: string;
        userId?: string;
      }>(request);

      const command = new JoinRoomCommand(
        body.socketId,
        body.type,
        body.resourceId,
        body.userId
      );

      return await this.joinRoomHandler.handle(command);
    });
  }

  /**
   * POST /api/realtime/rooms/leave
   * Leave a collaboration room
   */
  async leaveRoom(request: NextRequest): Promise<NextResponse> {
    return this.execute(request, async () => {
      const body = await this.parseBody<{
        socketId: string;
        userId?: string;
      }>(request);

      const command = new LeaveRoomCommand(
        body.socketId,
        body.userId
      );

      return await this.leaveRoomHandler.handle(command);
    });
  }

  /**
   * GET /api/realtime/rooms
   * Get active rooms
   */
  async getActiveRooms(request: NextRequest): Promise<NextResponse> {
    return this.execute(request, async () => {
      const { searchParams } = new URL(request.url);
      const type = searchParams.get('type');

      const query = new GetActiveRoomsQuery(
        type ? type as any : undefined,
        searchParams.get('userId') || undefined
      );

      return await this.getActiveRoomsHandler.handle(query);
    });
  }

  /**
   * GET /api/realtime/rooms/:roomId/participants
   * Get room participants
   */
  async getRoomParticipants(request: NextRequest, roomId: string): Promise<NextResponse> {
    return this.execute(request, async () => {
      const { searchParams } = new URL(request.url);

      const query = new GetRoomParticipantsQuery(
        roomId,
        searchParams.get('userId') || undefined
      );

      return await this.getRoomParticipantsHandler.handle(query);
    });
  }
}
