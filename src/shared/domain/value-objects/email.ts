import { ValueObject } from '../base/value-object';
import { ValidationError } from '../exceptions/validation-error';

interface EmailProps {
  value: string;
}

/**
 * Email Value Object
 * Ensures email format validation
 */
export class Email extends ValueObject<EmailProps> {
  private static readonly EMAIL_REGEX = /^(?:[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+|"[^"]*")@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  constructor(value: string) {
    if (!value || typeof value !== 'string') {
      throw new ValidationError('email', 'Invalid email format');
    }
    
    // Only lowercase the domain part, keep local part case-sensitive
    const trimmed = value.trim();
    const [localPart, domain] = trimmed.split('@');
    const normalizedValue = domain ? `${localPart}@${domain.toLowerCase()}` : trimmed;
    super({ value: normalizedValue });
  }

  protected validate(props: EmailProps): void {
    if (!Email.isValid(props.value)) {
      throw new ValidationError('email', 'Invalid email format');
    }
  }

  static isValid(email: string): boolean {
    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      return false;
    }
    
    // Check for basic structure
    if (!email.includes('@') || email.split('@').length !== 2) {
      return false;
    }
    
    const [localPart, domain] = email.split('@');
    
    // Check for empty parts
    if (!localPart || !domain) {
      return false;
    }
    
    // Check for spaces
    if (email.includes(' ')) {
      return false;
    }
    
    // Check for consecutive dots
    if (email.includes('..')) {
      return false;
    }
    
    // Check domain has at least one dot (except for localhost-style domains)
    if (!domain.includes('.') && domain !== 'localhost') {
      return false;
    }
    
    return this.EMAIL_REGEX.test(email);
  }

  get value(): EmailProps {
    return this._value;
  }

  get email(): string {
    return this._value.value;
  }

  getValue(): EmailProps {
    return this._value;
  }

  get domain(): string {
    return this._value.value.split('@')[1];
  }

  get localPart(): string {
    return this._value.value.split('@')[0];
  }

  // Backward-compatible getters expected by some tests
  public getDomain(): string {
    return this.domain;
  }

  public getLocalPart(): string {
    return this.localPart;
  }

  toString(): string {
    return this._value.value;
  }

  static create(value: string): Email {
    return new Email(value);
  }
}