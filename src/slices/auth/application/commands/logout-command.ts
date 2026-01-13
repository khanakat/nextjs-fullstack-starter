import { Command } from '../../../../shared/application/base/command';

/**
 * Logout Command Props
 */
export interface LogoutCommandProps {
  userId: string;
  sessionId: string;
}

/**
 * Logout Command
 * Command to logout user
 */
export class LogoutCommand extends Command {
  constructor(public readonly props: LogoutCommandProps) {
    super();
  }

  public validate(): void {
    super.validate();

    if (!this.props.userId) {
      throw new Error('User ID is required');
    }

    if (!this.props.sessionId) {
      throw new Error('Session ID is required');
    }
  }
}
