import { Command } from '../../../../shared/application/base/command';
import { Email } from '../../domain/value-objects/email';

/**
 * Request Password Reset Command Props
 */
export interface RequestPasswordResetCommandProps {
  email: Email;
}

/**
 * Request Password Reset Command
 * Command to request password reset
 */
export class RequestPasswordResetCommand extends Command {
  constructor(public readonly props: RequestPasswordResetCommandProps) {
    super();
  }

  public validate(): void {
    super.validate();

    if (!this.props.email) {
      throw new Error('Email is required');
    }
  }
}
