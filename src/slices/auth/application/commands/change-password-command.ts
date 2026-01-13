import { Command } from '../../../../shared/application/base/command';

/**
 * Change Password Command Props
 */
export interface ChangePasswordCommandProps {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

/**
 * Change Password Command
 * Command to change user password
 */
export class ChangePasswordCommand extends Command {
  constructor(public readonly props: ChangePasswordCommandProps) {
    super();
  }

  public validate(): void {
    super.validate();

    if (!this.props.userId) {
      throw new Error('User ID is required');
    }

    if (!this.props.currentPassword || this.props.currentPassword.length < 1) {
      throw new Error('Current password is required');
    }

    if (!this.props.newPassword || this.props.newPassword.length < 8) {
      throw new Error('New password is required and must be at least 8 characters');
    }
  }
}
