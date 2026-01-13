import { ValueObject } from '../../../../shared/domain/base/value-object';
import { ValidationError } from '../../../../shared/domain/exceptions/validation-error';

/**
 * Auth Session ID Value Object
 * Represents a unique session identifier
 */
export class AuthSessionId extends ValueObject<string> {
  private static readonly SESSION_ID_LENGTH = 32;

  constructor(value: string) {
    super(value);
  }

  protected validate(value: string): void {
    if (!value || typeof value !== 'string') {
      throw new ValidationError('sessionId', 'Session ID is required');
    }

    if (value.length !== AuthSessionId.SESSION_ID_LENGTH) {
      throw new ValidationError(
        'sessionId',
        `Session ID must be exactly ${AuthSessionId.SESSION_ID_LENGTH} characters`
      );
    }

    // Validate hex format (for UUID-like session IDs)
    const hexRegex = /^[0-9a-fA-F]+$/;
    if (!hexRegex.test(value)) {
      throw new ValidationError(
        'sessionId',
        'Session ID must be a valid hex string'
      );
    }
  }

  /**
   * Generate a new session ID
   */
  static generate(): AuthSessionId {
    const sessionId = Array.from({ length: AuthSessionId.SESSION_ID_LENGTH })
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join('');

    return new AuthSessionId(sessionId);
  }

  /**
   * Create AuthSessionId from string
   */
  static fromString(sessionId: string): AuthSessionId {
    return new AuthSessionId(sessionId);
  }

  /**
   * Check if two session IDs are equal
   */
  equals(other: AuthSessionId): boolean {
    return super.equals(other);
  }

  /**
   * Get session ID as string
   */
  toString(): string {
    return this._value;
  }
}
