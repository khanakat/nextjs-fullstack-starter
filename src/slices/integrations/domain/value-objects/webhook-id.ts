import { ValueObject } from '../../../../shared/domain/base/value-object';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';

/**
 * Webhook ID Value Object
 */
export class WebhookId extends ValueObject<string> {
  private static readonly LENGTH = 36; // CUID length

  private constructor(value: string) {
    super(value);
  }

  /**
   * Create a new Webhook ID
   */
  static create(): WebhookId {
    const id = UniqueId.create();
    return new WebhookId(id.value);
  }

  /**
   * Create Webhook ID from existing value
   */
  static fromValue(value: string): WebhookId {
    return new WebhookId(value);
  }

  /**
   * Validate webhook ID format
   */
  protected validate(value: string): void {
    if (!value || value.trim() === '') {
      throw new Error('Webhook ID cannot be empty');
    }
    if (value.length > WebhookId.LENGTH) {
      throw new Error(`Webhook ID cannot exceed ${WebhookId.LENGTH} characters`);
    }
  }
}
