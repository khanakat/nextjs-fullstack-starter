import { ValueObject } from '../../base/value-object';
import { ValidationError } from '../../exceptions/validation-error';

/**
 * Cache TTL Value Object
 * Represents time-to-live for cache entries in seconds
 */
export class CacheTTL extends ValueObject<number> {
  private static readonly MIN_TTL = 0; // 0 means no expiration
  private static readonly MAX_TTL = 31536000; // 1 year in seconds

  constructor(value: number) {
    super(value);
  }

  protected validate(value: number): void {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new ValidationError('cacheTTL', 'Cache TTL must be a valid number');
    }
    if (value < CacheTTL.MIN_TTL) {
      throw new ValidationError('cacheTTL', `Cache TTL must be at least ${CacheTTL.MIN_TTL} seconds`);
    }
    if (value > CacheTTL.MAX_TTL) {
      throw new ValidationError('cacheTTL', `Cache TTL must not exceed ${CacheTTL.MAX_TTL} seconds (1 year)`);
    }
  }

  public static create(value: number): CacheTTL {
    return new CacheTTL(value);
  }

  public static fromValue(value: number): CacheTTL {
    return new CacheTTL(value);
  }

  public static fromMinutes(minutes: number): CacheTTL {
    return new CacheTTL(minutes * 60);
  }

  public static fromHours(hours: number): CacheTTL {
    return new CacheTTL(hours * 3600);
  }

  public static fromDays(days: number): CacheTTL {
    return new CacheTTL(days * 86400);
  }

  public static fromSeconds(seconds: number): CacheTTL {
    return new CacheTTL(seconds);
  }

  public getValue(): number {
    return this._value;
  }

  /**
   * Get TTL in seconds
   */
  public toSeconds(): number {
    return this._value;
  }

  /**
   * Get TTL in milliseconds
   */
  public toMilliseconds(): number {
    return this._value * 1000;
  }

  /**
   * Check if TTL is set (non-zero)
   */
  public isSet(): boolean {
    return this._value > 0;
  }

  /**
   * Check if TTL is zero (no expiration)
   */
  public isNoExpiration(): boolean {
    return this._value === 0;
  }

  /**
   * Get TTL as a Date (current time + TTL)
   */
  public toExpirationDate(): Date {
    return new Date(Date.now() + this.toMilliseconds());
  }

  /**
   * Common TTL presets
   */
  public static readonly ONE_MINUTE = CacheTTL.fromMinutes(1);
  public static readonly FIVE_MINUTES = CacheTTL.fromMinutes(5);
  public static readonly FIFTEEN_MINUTES = CacheTTL.fromMinutes(15);
  public static readonly THIRTY_MINUTES = CacheTTL.fromMinutes(30);
  public static readonly ONE_HOUR = CacheTTL.fromHours(1);
  public static readonly SIX_HOURS = CacheTTL.fromHours(6);
  public static readonly TWELVE_HOURS = CacheTTL.fromHours(12);
  public static readonly ONE_DAY = CacheTTL.fromDays(1);
  public static readonly ONE_WEEK = CacheTTL.fromDays(7);
  public static readonly ONE_MONTH = CacheTTL.fromDays(30);
  public static readonly NO_EXPIRATION = new CacheTTL(0);

  public toString(): string {
    if (this.isNoExpiration()) {
      return 'No expiration';
    }
    const hours = Math.floor(this._value / 3600);
    const minutes = Math.floor((this._value % 3600) / 60);
    const seconds = this._value % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }
}
