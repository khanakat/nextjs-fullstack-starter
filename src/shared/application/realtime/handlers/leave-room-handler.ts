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
export class LeaveRoomHandler extends CommandHandler<LeaveRoomCommand, void> {
  constructor(
    private readonly realtimeService: RealtimeService
  ) {
    super();
  }

  async handle(command: LeaveRoomCommand): Promise<Result<void>> {
    try {
      // @ts-ignore - validate() exists on Command base class
      command.validate();

      const socketId = SocketId.create(command.socketId);
      await this.realtimeService.leaveRoom(socketId);

      return Result.success(undefined);
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
