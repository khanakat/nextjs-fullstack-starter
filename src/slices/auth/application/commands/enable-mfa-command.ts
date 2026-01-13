import { Command } from '../../../../shared/application/base/command';

/**
 * Enable MFA Command Props
 */
export interface EnableMfaCommandProps {
  userId: string;
  type: 'TOTP' | 'SMS';
  phoneNumber?: string;
}

/**
 * Enable MFA Command
 * Command to enable multi-factor authentication
 */
export class EnableMfaCommand extends Command {
  constructor(public readonly props: EnableMfaCommandProps) {
    super();
  }

  public validate(): void {
    super.validate();

    if (!this.props.userId) {
      throw new Error('User ID is required');
    }

    if (!this.props.type || !['TOTP', 'SMS'].includes(this.props.type)) {
      throw new Error('MFA type must be TOTP or SMS');
    }

    if (this.props.type === 'SMS' && !this.props.phoneNumber) {
      throw new Error('Phone number is required for SMS MFA');
    }
  }
}
