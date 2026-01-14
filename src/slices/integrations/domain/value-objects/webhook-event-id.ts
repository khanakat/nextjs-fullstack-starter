import { ValueObject } from '../../../../shared/domain/base/value-object';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';

/**
 * Webhook Event ID Value Object
 */
export class WebhookEventId extends ValueObject<string> {
  private static readonly LENGTH = 36; // CUID length

  private constructor(value: string) {
    super(value);
  }

  /**
   * Create a new Webhook Event ID
   */
  static create(): WebhookEventId {
    const id = UniqueId.create();
    return new WebhookEventId(id.value);
  }

  /**
   * Create Webhook Event ID from existing value
   */
  static fromValue(value: string): WebhookEventId {
    return new WebhookEventId(value);
  }

  /**
   * Validate webhook event ID format
   */
  protected validate(value: string): void {
    if (!value || value.trim() === '') {
      throw new Error('Webhook event ID cannot be empty');
    }
    if (value.length > WebhookEventId.LENGTH) {
      throw new Error(`Webhook event ID cannot exceed ${WebhookEventId.LENGTH} characters`);
    }
  }
}
