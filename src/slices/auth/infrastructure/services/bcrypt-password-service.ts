import { injectable } from 'inversify';
import { IPasswordService } from '../../domain/services/password-service';
import { PasswordHash } from '../../domain/value-objects/password-hash';
import * as bcrypt from 'bcryptjs';

/**
 * Bcrypt Password Service
 * 
 * Implementation of IPasswordService using bcrypt for password hashing
 * and verification. Bcrypt is a secure password hashing algorithm
 * that includes a salt and is resistant to rainbow table attacks.
 * 
 * @see https://en.wikipedia.org/wiki/Bcrypt
 */
@injectable()
export class BcryptPasswordService implements IPasswordService {
  private readonly SALT_ROUNDS = 10;

  /**
   * Hash a plain text password
   * 
   * Uses bcrypt with 10 salt rounds for secure password hashing.
   * Higher salt rounds provide better security but are slower.
   */
  async hash(password: string): Promise<PasswordHash> {
    const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);
    return new PasswordHash(hashedPassword);
  }

  /**
   * Verify a plain text password against a hash
   * 
   * Uses bcrypt's compare function which is constant-time
   * to prevent timing attacks.
   */
  async verify(password: string, hash: PasswordHash): Promise<boolean> {
    return await bcrypt.compare(password, hash.toString());
  }

  /**
   * Validate password strength
   * 
   * Returns a score from 0-100 based on password strength,
   * along with specific validation errors.
   */
  validateStrength(password: string): {
    isValid: boolean;
    score: number;
    errors: string[];
  } {
    const errors: string[] = [];
    let score = 0;

    // Minimum length check
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    } else {
      score += 20;
    }

    // Maximum length check
    if (password.length > 128) {
      errors.push('Password must be less than 128 characters');
    }

    // Check for lowercase letters
    if (/[a-z]/.test(password)) {
      score += 10;
    } else {
      errors.push('Password must contain at least one lowercase letter');
    }

    // Check for uppercase letters
    if (/[A-Z]/.test(password)) {
      score += 10;
    } else {
      errors.push('Password must contain at least one uppercase letter');
    }

    // Check for numbers
    if (/[0-9]/.test(password)) {
      score += 10;
    } else {
      errors.push('Password must contain at least one number');
    }

    // Check for special characters
    if (/[^a-zA-Z0-9]/.test(password)) {
      score += 20;
    } else {
      errors.push('Password must contain at least one special character');
    }

    // Bonus for longer passwords
    if (password.length >= 12) {
      score += 10;
    }
    if (password.length >= 16) {
      score += 10;
    }

    // Check for common patterns (basic check)
    if (/^[a-zA-Z]+$/.test(password)) {
      errors.push('Password should not be only letters');
      score -= 20;
    }
    if (/^[0-9]+$/.test(password)) {
      errors.push('Password should not be only numbers');
      score -= 20;
    }

    // Check for sequential characters (basic check)
    if (/(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(password)) {
      errors.push('Password should not contain sequential characters');
      score -= 10;
    }

    // Check for repeated characters
    if (/(.)\1{2,}/.test(password)) {
      errors.push('Password should not contain repeated characters');
      score -= 10;
    }

    // Normalize score to 0-100 range
    score = Math.max(0, Math.min(100, score));

    return {
      isValid: errors.length === 0,
      score,
      errors,
    };
  }

  /**
   * Generate a random password
   * 
   * Generates a secure random password with the specified options.
   * Default options include uppercase, lowercase, and numbers.
   */
  generate(
    length: number = 16,
    options: {
      includeUppercase?: boolean;
      includeLowercase?: boolean;
      includeNumbers?: boolean;
      includeSymbols?: boolean;
    } = {}
  ): string {
    const {
      includeUppercase = true,
      includeLowercase = true,
      includeNumbers = true,
      includeSymbols = true,
    } = options;

    let chars = '';
    if (includeUppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) chars += '0123456789';
    if (includeSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (chars === '') {
      throw new Error('At least one character type must be included');
    }

    let password = '';
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);

    for (let i = 0; i < length; i++) {
      password += chars[array[i] % chars.length];
    }

    return password;
  }
}
