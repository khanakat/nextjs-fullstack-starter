import { Command } from '../../../../shared/application/base/command';

/**
 * Reset Password Command Props
 */
export interface ResetPasswordCommandProps {
  token: string;
  newPassword: string;
}

/**
 * Reset Password Command
 * Command to reset password with token
 */
export class ResetPasswordCommand extends Command {
  constructor(public readonly props: ResetPasswordCommandProps) {
    super();
  }

  public validate(): void {
    super.validate();

    if (!this.props.token || this.props.token.length < 10) {
      throw new Error('Token is required');
    }

    if (!this.props.newPassword || this.props.newPassword.length < 8) {
      throw new Error('New password is required and must be at least 8 characters');
    }
  }
}
