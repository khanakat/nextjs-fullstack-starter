import { Command } from '../../../../shared/application/base/command';
import { MfaCode } from '../../domain/value-objects/mfa-code';

/**
 * Verify MFA Command Props
 */
export interface VerifyMfaCommandProps {
  userId: string;
  code: MfaCode;
}

/**
 * Verify MFA Command
 * Command to verify multi-factor authentication code
 */
export class VerifyMfaCommand extends Command {
  constructor(public readonly props: VerifyMfaCommandProps) {
    super();
  }

  public validate(): void {
    super.validate();

    if (!this.props.userId) {
      throw new Error('User ID is required');
    }

    if (!this.props.code) {
      throw new Error('MFA code is required');
    }
  }
}
