import { Command } from '../../../../shared/application/base/command';

/**
 * Verify Email Command Props
 */
export interface VerifyEmailCommandProps {
  userId: string;
  token: string;
}

/**
 * Verify Email Command
 * Command to verify user email
 */
export class VerifyEmailCommand extends Command {
  constructor(public readonly props: VerifyEmailCommandProps) {
    super();
  }

  public validate(): void {
    super.validate();

    if (!this.props.userId) {
      throw new Error('User ID is required');
    }

    if (!this.props.token || this.props.token.length < 10) {
      throw new Error('Token is required');
    }
  }
}
