import { Command } from '../../base/command';

/**
 * Register Connection Command
 * Command to register a new socket connection
 */
export class RegisterConnectionCommand extends Command {
  constructor(
    public readonly socketId: string,
    public readonly userId: string,
    public readonly userName: string,
    public readonly userEmail: string,
    public readonly userAvatar?: string,
    public readonly organizationId: string
  ) {
    super(userId);
  }

  public validate(): void {
    if (!this.socketId) {
      throw new Error('Socket ID is required');
    }
    if (!this.userId) {
      throw new Error('User ID is required');
    }
    if (!this.userName) {
      throw new Error('User name is required');
    }
    if (!this.userEmail) {
      throw new Error('User email is required');
    }
    if (!this.organizationId) {
      throw new Error('Organization ID is required');
    }
  }
}
