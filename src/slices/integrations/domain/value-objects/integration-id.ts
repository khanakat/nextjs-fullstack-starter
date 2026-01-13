import { ValueObject } from '../../../../shared/domain/base/value-object';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';

/**
 * IntegrationId Value Object
 * Represents a unique integration identifier
 */
export class IntegrationId extends ValueObject<string> {
  private static readonly LENGTH = 36; // CUID length

  private constructor(value: string) {
    super(value);
  }

  /**
   * Create a new IntegrationId
   */
  static create(): IntegrationId {
    const id = UniqueId.create();
    return new IntegrationId(id.value);
  }

  /**
   * Create from existing string value
   */
  static fromValue(value: string): IntegrationId {
    return new IntegrationId(value);
  }

  /**
   * Validate integration ID format
   */
  protected validate(value: string): void {
    if (!value || value.trim() === '') {
      throw new Error('Integration ID cannot be empty');
    }
    if (value.length > IntegrationId.LENGTH) {
      throw new Error(`Integration ID cannot exceed ${IntegrationId.LENGTH} characters`);
    }
  }
}
