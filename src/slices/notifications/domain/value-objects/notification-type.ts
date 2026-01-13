import { ValueObject } from '../../../../shared/domain/base/value-object';

export type NotificationTypeValue = 'info' | 'success' | 'warning' | 'error' | 'system' | 'task' | 'workflow' | 'reminder' | 'marketing';

export class NotificationType extends ValueObject<NotificationTypeValue> {
  private constructor(value: NotificationTypeValue) {
    super(value);
  }

  /**
   * Create a new Notification Type
   */
  static create(value: NotificationTypeValue): NotificationType {
    return new NotificationType(value);
  }

  /**
   * Validate notification type
   */
  protected validate(value: NotificationTypeValue): void {
    const validTypes: NotificationTypeValue[] = ['info', 'success', 'warning', 'error', 'system', 'task', 'workflow', 'reminder', 'marketing'];
    if (!validTypes.includes(value)) {
      throw new Error(`Invalid notification type: ${value}`);
    }
  }
}
