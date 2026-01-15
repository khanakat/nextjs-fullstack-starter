import { Command } from '../../base/command';
import { RoomType } from '@/shared/domain/realtime/value-objects/room-type';

/**
 * Join Room Command
 * Command to join a collaboration room
 */
export class JoinRoomCommand extends Command {
  constructor(
    public readonly socketId: string,
    public readonly type: RoomType,
    public readonly resourceId: string,
    userId?: string
  ) {
    super(userId);
  }

  public validate(): void {
    if (!this.socketId) {
      throw new Error('Socket ID is required');
    }
    if (!this.type) {
      throw new Error('Room type is required');
    }
    if (!this.resourceId) {
      throw new Error('Resource ID is required');
    }
  }
}
