import { injectable } from 'inversify';
import { CommandHandler } from '../../base/command-handler';
import { LeaveRoomCommand } from '../commands/leave-room-command';
import { RealtimeService } from '../../../domain/realtime/services/realtime-service';
import { SocketId } from '../../../domain/realtime/value-objects/socket-id';
import { Result } from '../../base/result';

/**
 * Leave Room Handler
 * Handles leaving a collaboration room
 */
@injectable()
export class LeaveRoomHandler implements CommandHandler<LeaveRoomCommand, void> {
  constructor(
    private readonly realtimeService: RealtimeService
  ) {}

  async handle(command: LeaveRoomCommand): Promise<Result<void>> {
    try {
      command.validate();

      const socketId = SocketId.create(command.socketId);
      await this.realtimeService.leaveRoom(socketId);

      return Result.success(undefined);
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
