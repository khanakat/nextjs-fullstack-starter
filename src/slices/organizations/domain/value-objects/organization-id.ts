import { ValueObject } from '../../../../shared/domain/base/value-object';
import { ValidationError } from '../../../../shared/domain/exceptions/validation-error';

/**
 * Organization ID Value Object
 * Represents a unique organization identifier
 */
export class OrganizationId extends ValueObject<string> {
  private static readonly ID_LENGTH = 25;
  private static readonly ID_REGEX = /^[a-z0-9](-[a-z0-9]_)?$/i;

  constructor(value: string) {
    super(value);
  }

  protected validate(value: string): void {
    if (!value || typeof value !== 'string') {
      throw new ValidationError('organizationId', 'Organization ID is required');
    }

    if (value.length !== OrganizationId.ID_LENGTH) {
      throw new ValidationError(
        'organizationId',
        `Organization ID must be exactly ${OrganizationId.ID_LENGTH} characters`
      );
    }

    if (!OrganizationId.ID_REGEX.test(value)) {
      throw new ValidationError(
        'organizationId',
        'Organization ID must contain only lowercase letters, numbers, and hyphens'
      );
    }
  }

  /**
   * Generate a new organization ID
   */
  static generate(): OrganizationId {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < OrganizationId.ID_LENGTH; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return new OrganizationId(result);
  }

  /**
   * Create OrganizationId from string
   */
  static fromString(id: string): OrganizationId {
    return new OrganizationId(id);
  }

  /**
   * Check if two IDs are equal
   */
  equals(other: OrganizationId): boolean {
    return super.equals(other);
  }

  /**
   * Get ID as string
   */
  toString(): string {
    return this._value;
  }
}
