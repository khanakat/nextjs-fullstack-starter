import { ValueObject } from '../../../../shared/domain/base/value-object';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';

/**
 * Integration Template ID Value Object
 */
export class IntegrationTemplateId extends ValueObject<string> {
  private static readonly LENGTH = 36; // CUID length

  private constructor(value: string) {
    super(value);
  }

  /**
   * Create a new Integration Template ID
   */
  static create(): IntegrationTemplateId {
    const id = UniqueId.create();
    return new IntegrationTemplateId(id.value);
  }

  /**
   * Create Integration Template ID from existing value
   */
  static fromValue(value: string): IntegrationTemplateId {
    return new IntegrationTemplateId(value);
  }

  /**
   * Validate integration template ID format
   */
  protected validate(value: string): void {
    if (!value || value.trim() === '') {
      throw new Error('Integration template ID cannot be empty');
    }
    if (value.length > IntegrationTemplateId.LENGTH) {
      throw new Error(`Integration template ID cannot exceed ${IntegrationTemplateId.LENGTH} characters`);
    }
  }
}
