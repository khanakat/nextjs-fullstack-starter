import { Command } from '../../../../shared/application/base/command';

/**
 * Disable MFA Command Props
 */
export interface DisableMfaCommandProps {
  userId: string;
  deviceId: string;
}

/**
 * Disable MFA Command
 * Command to disable multi-factor authentication
 */
export class DisableMfaCommand extends Command {
  constructor(public readonly props: DisableMfaCommandProps) {
    super();
  }

  public validate(): void {
    super.validate();

    if (!this.props.userId) {
      throw new Error('User ID is required');
    }

    if (!this.props.deviceId) {
      throw new Error('Device ID is required');
    }
  }
}
