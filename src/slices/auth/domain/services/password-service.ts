import { PasswordHash } from '../value-objects/password-hash';

/**
 * Password Service Interface
 * Contract for password operations
 */
export interface IPasswordService {
  /**
   * Hash a plain text password
   */
  hash(password: string): Promise<PasswordHash>;

  /**
   * Verify a plain text password against a hash
   */
  verify(password: string, hash: PasswordHash): Promise<boolean>;

  /**
   * Validate password strength
   */
  validateStrength(password: string): {
    isValid: boolean;
    score: number;
    errors: string[];
  };

  /**
   * Generate a random password
   */
  generate(length?: number, options?: {
    includeUppercase?: boolean;
    includeLowercase?: boolean;
    includeNumbers?: boolean;
    includeSymbols?: boolean;
  }): string;
}
