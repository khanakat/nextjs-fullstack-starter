import { Command } from '../../../../shared/application/base/command';
import { Email } from '../../domain/value-objects/email';

/**
 * Register User Command Props
 */
export interface RegisterUserCommandProps {
  email: Email;
  password: string;
  name?: string;
  username?: string;
}

/**
 * Register User Command
 * Command to register a new user
 */
export class RegisterUserCommand extends Command {
  constructor(public readonly props: RegisterUserCommandProps) {
    super();
  }

  public validate(): void {
    super.validate();

    if (!this.props.email) {
      throw new Error('Email is required');
    }

    if (!this.props.password || this.props.password.length < 8) {
      throw new Error('Password is required and must be at least 8 characters');
    }
  }
}
