import { Command } from '../../base/command';

/**
 * Leave Room Command
 * Command to leave a collaboration room
 */
export class LeaveRoomCommand extends Command {
  constructor(
    public readonly socketId: string,
    userId?: string
  ) {
    super(userId);
  }

  public validate(): void {
    if (!this.socketId) {
      throw new Error('Socket ID is required');
    }
  }
}
