import { ValueObject } from '../../../../shared/domain/base/value-object';
import { ValidationError } from '../../../../shared/domain/exceptions/validation-error';

/**
 * Email Value Object
 * Represents a valid email address
 */
export class Email extends ValueObject<string> {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  constructor(value: string) {
    super(value.toLowerCase().trim());
  }

  protected validate(value: string): void {
    if (!value || typeof value !== 'string') {
      throw new ValidationError('email', 'Email is required');
    }

    if (value.length > 255) {
      throw new ValidationError('email', 'Email must be less than 255 characters');
    }

    if (!Email.EMAIL_REGEX.test(value)) {
      throw new ValidationError('email', 'Invalid email format');
    }
  }

  /**
   * Get the email local part (before @)
   */
  getLocalPart(): string {
    return this._value.split('@')[0];
  }

  /**
   * Get the email domain (after @)
   */
  getDomain(): string {
    return this._value.split('@')[1];
  }

  /**
   * Check if email is from a specific domain
   */
  isFromDomain(domain: string): boolean {
    return this.getDomain().toLowerCase() === domain.toLowerCase();
  }

  /**
   * Check if email is from a corporate domain
   */
  isCorporate(): boolean {
    const publicDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
    return !publicDomains.includes(this.getDomain().toLowerCase());
  }

  /**
   * Obfuscate email for display (e.g., j***@example.com)
   */
  obfuscate(): string {
    const [local, domain] = this._value.split('@');
    if (local.length <= 2) {
      return `${local[0]}***@${domain}`;
    }
    return `${local[0]}${'*'.repeat(local.length - 2)}@${domain}`;
  }

  /**
   * Create Email from string
   */
  static fromString(email: string): Email {
    return new Email(email);
  }

  /**
   * Check if two emails are equal
   */
  equals(other: Email): boolean {
    return super.equals(other);
  }

  /**
   * Get email as string
   */
  toString(): string {
    return this._value;
  }
}
