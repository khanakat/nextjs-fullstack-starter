import { ValueObject } from '../../../../shared/domain/base/value-object';
import { ValidationError } from '../../../../shared/domain/exceptions/validation-error';

/**
 * Token Value Object
 * Represents an authentication token (JWT, refresh token, etc.)
 */
export class Token extends ValueObject<string> {
  private static readonly MIN_TOKEN_LENGTH = 10;
  private static readonly MAX_TOKEN_LENGTH = 10000;

  constructor(value: string) {
    super(value);
  }

  protected validate(value: string): void {
    if (!value || typeof value !== 'string') {
      throw new ValidationError('token', 'Token is required');
    }

    if (value.length < Token.MIN_TOKEN_LENGTH) {
      throw new ValidationError(
        'token',
        `Token must be at least ${Token.MIN_TOKEN_LENGTH} characters`
      );
    }

    if (value.length > Token.MAX_TOKEN_LENGTH) {
      throw new ValidationError(
        'token',
        `Token must be less than ${Token.MAX_TOKEN_LENGTH} characters`
      );
    }
  }

  /**
   * Check if token is expired
   * This requires the token to contain expiration information
   */
  isExpired(): boolean {
    // For JWT tokens, we would decode and check exp claim
    // For other tokens, this might need to be stored separately
    // This is a placeholder implementation
    return false;
  }

  /**
   * Check if this is a JWT token
   */
  isJwt(): boolean {
    // JWT tokens have 3 parts separated by dots
    const parts = this._value.split('.');
    return parts.length === 3;
  }

  /**
   * Get token payload (for JWT tokens)
   */
  getPayload(): Record<string, any> | null {
    if (!this.isJwt()) {
      return null;
    }

    try {
      const parts = this._value.split('.');
      const payload = Buffer.from(parts[1], 'base64').toString();
      return JSON.parse(payload);
    } catch {
      return null;
    }
  }

  /**
   * Get token expiration (for JWT tokens)
   */
  getExpiration(): Date | null {
    const payload = this.getPayload();
    if (!payload || !payload.exp) {
      return null;
    }

    return new Date(payload.exp * 1000);
  }

  /**
   * Get token issuer (for JWT tokens)
   */
  getIssuer(): string | null {
    const payload = this.getPayload();
    return payload?.iss || null;
  }

  /**
   * Get token subject (for JWT tokens)
   */
  getSubject(): string | null {
    const payload = this.getPayload();
    return payload?.sub || null;
  }

  /**
   * Create Token from string
   */
  static fromString(token: string): Token {
    return new Token(token);
  }

  /**
   * Check if two tokens are equal
   */
  equals(other: Token): boolean {
    return super.equals(other);
  }

  /**
   * Get token as string
   */
  toString(): string {
    return this._value;
  }
}
