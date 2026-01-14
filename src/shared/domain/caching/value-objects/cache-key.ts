import { ValueObject } from '../../base/value-object';
import { ValidationError } from '../../exceptions/validation-error';

/**
 * Cache Key Value Object
 * Represents a unique cache key identifier
 */
export class CacheKey extends ValueObject<string> {
  constructor(value: string) {
    super(value);
  }

  protected validate(value: string): void {
    if (!value || typeof value !== 'string') {
      throw new ValidationError('cacheKey', 'Cache key must be a non-empty string');
    }
    if (value.length < 1 || value.length > 250) {
      throw new ValidationError('cacheKey', 'Cache key must be between 1 and 250 characters');
    }
    // Validate Redis key format (no spaces, no control characters)
    if (/[\s\x00-\x1F\x7F]/.test(value)) {
      throw new ValidationError('cacheKey', 'Cache key cannot contain spaces or control characters');
    }
  }

  public static create(value: string): CacheKey {
    return new CacheKey(value);
  }

  public static fromValue(value: string): CacheKey {
    return new CacheKey(value);
  }

  public getValue(): string {
    return this._value;
  }

  /**
   * Create a namespaced cache key
   */
  public withPrefix(prefix: string): CacheKey {
    return new CacheKey(`${prefix}:${this._value}`);
  }

  /**
   * Create a namespaced cache key with multiple segments
   */
  public withPrefixes(...prefixes: string[]): CacheKey {
    const fullPrefix = prefixes.join(':');
    return new CacheKey(`${fullPrefix}:${this._value}`);
  }

  public toString(): string {
    return this._value;
  }
}
