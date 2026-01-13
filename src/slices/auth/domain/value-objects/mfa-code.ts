import { ValueObject } from '../../../../shared/domain/base/value-object';
import { ValidationError } from '../../../../shared/domain/exceptions/validation-error';

/**
 * MFA Code Value Object
 * Represents a Multi-Factor Authentication code
 */
export class MfaCode extends ValueObject<string> {
  private static readonly MFA_CODE_LENGTH = 6;

  constructor(value: string) {
    super(value);
  }

  protected validate(value: string): void {
    if (!value || typeof value !== 'string') {
      throw new ValidationError('mfaCode', 'MFA code is required');
    }

    if (value.length !== MfaCode.MFA_CODE_LENGTH) {
      throw new ValidationError(
        'mfaCode',
        `MFA code must be exactly ${MfaCode.MFA_CODE_LENGTH} digits`
      );
    }

    // Validate numeric format
    const numericRegex = /^[0-9]+$/;
    if (!numericRegex.test(value)) {
      throw new ValidationError('mfaCode', 'MFA code must be numeric');
    }
  }

  /**
   * Check if MFA code has expired
   * MFA codes typically expire after 5-10 minutes
   */
  isExpired(createdAt: Date, expiryMinutes: number = 10): boolean {
    const now = new Date();
    const expiryTime = new Date(createdAt.getTime() + expiryMinutes * 60 * 1000);
    return now > expiryTime;
  }

  /**
   * Get time remaining before expiry
   */
  getTimeRemaining(createdAt: Date, expiryMinutes: number = 10): number {
    const now = new Date();
    const expiryTime = new Date(createdAt.getTime() + expiryMinutes * 60 * 1000);
    const remaining = expiryTime.getTime() - now.getTime();
    return Math.max(0, Math.floor(remaining / 1000));
  }

  /**
   * Generate a new MFA code
   */
  static generate(): MfaCode {
    const code = Array.from({ length: MfaCode.MFA_CODE_LENGTH })
      .map(() => Math.floor(Math.random() * 10))
      .join('');

    return new MfaCode(code);
  }

  /**
   * Create MfaCode from string
   */
  static fromString(code: string): MfaCode {
    return new MfaCode(code);
  }

  /**
   * Check if two MFA codes are equal
   */
  equals(other: MfaCode): boolean {
    return super.equals(other);
  }

  /**
   * Get MFA code as string
   */
  toString(): string {
    return this._value;
  }
}
