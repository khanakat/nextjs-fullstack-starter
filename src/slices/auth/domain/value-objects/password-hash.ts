import { ValueObject } from '../../../../shared/domain/base/value-object';
import { ValidationError } from '../../../../shared/domain/exceptions/validation-error';

/**
 * Password Hash Value Object
 * Represents a hashed password
 */
export class PasswordHash extends ValueObject<string> {
  private static readonly MIN_HASH_LENGTH = 60; // bcrypt hash length

  constructor(value: string) {
    super(value);
  }

  protected validate(value: string): void {
    if (!value || typeof value !== 'string') {
      throw new ValidationError('passwordHash', 'Password hash is required');
    }

    if (value.length < PasswordHash.MIN_HASH_LENGTH) {
      throw new ValidationError(
        'passwordHash',
        `Password hash must be at least ${PasswordHash.MIN_HASH_LENGTH} characters`
      );
    }
  }

  /**
   * Check if password hash matches a plain text password
   * This is a placeholder - actual comparison should be done by a PasswordService
   */
  matches(plainPassword: string): boolean {
    // This should be implemented by PasswordService
    // This is just a placeholder for type safety
    throw new Error('Password comparison must be done by PasswordService');
  }

  /**
   * Check if this is a bcrypt hash
   */
  isBcryptHash(): boolean {
    return this._value.startsWith('$2a$') || this._value.startsWith('$2b$');
  }

  /**
   * Check if this is an argon2 hash
   */
  isArgon2Hash(): boolean {
    return this._value.startsWith('$argon2');
  }

  /**
   * Create PasswordHash from string
   */
  static fromString(hash: string): PasswordHash {
    return new PasswordHash(hash);
  }

  /**
   * Check if two password hashes are equal
   */
  equals(other: PasswordHash): boolean {
    return super.equals(other);
  }

  /**
   * Get hash as string
   */
  toString(): string {
    return this._value;
  }
}
