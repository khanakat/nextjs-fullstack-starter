import { injectable } from 'inversify';
import { CommandHandler } from '../../base/command-handler';
import { JoinRoomCommand } from '../commands/join-room-command';
import { RealtimeService } from '../../../domain/realtime/services/realtime-service';
import { SocketId } from '../../../domain/realtime/value-objects/socket-id';
import { Result } from '../../base/result';
import { CollaborationRoomDto } from '../dtos/collaboration-room-dto';

/**
 * Join Room Handler
 * Handles joining a collaboration room
 */
@injectable()
export class JoinRoomHandler implements CommandHandler<JoinRoomCommand, CollaborationRoomDto> {
  constructor(
    private readonly realtimeService: RealtimeService
  ) {}

  async handle(command: JoinRoomCommand): Promise<Result<CollaborationRoomDto>> {
    try {
      command.validate();

      const socketId = SocketId.create(command.socketId);
      const result = await this.realtimeService.joinRoom(socketId, command.type, command.resourceId);

      if (!result.success) {
        return Result.failure(new Error(result.error || 'Failed to join room'));
      }

      const room = result.room;
      if (!room) {
        return Result.failure(new Error('Room not found'));
      }

      const dto = new CollaborationRoomDto(
        room.roomId.value,
        room.createdAt,
        room.roomId.value,
        room.type.type,
        room.resourceId,
        room.getParticipants().map(p => ({
          userId: p.userId,
          userName: p.userName,
          userEmail: p.userEmail,
          userAvatar: p.userAvatar,
          socketId: p.socketId,
          joinedAt: p.joinedAt,
        })),
        room.lastActivityAt,
        room.metadata
      );

      return Result.success(dto);
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
