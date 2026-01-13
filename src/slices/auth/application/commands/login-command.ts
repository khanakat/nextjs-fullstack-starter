import { Command } from '../../../../shared/application/base/command';
import { Email } from '../../domain/value-objects/email';

/**
 * Login Command Props
 */
export interface LoginCommandProps {
  email: Email;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Login Command
 * Command to login with email and password
 */
export class LoginCommand extends Command {
  constructor(public readonly props: LoginCommandProps) {
    super();
  }

  public validate(): void {
    super.validate();

    if (!this.props.email) {
      throw new Error('Email is required');
    }

    if (!this.props.password || this.props.password.length < 1) {
      throw new Error('Password is required');
    }
  }
}
