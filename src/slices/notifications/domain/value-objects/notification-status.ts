import { ValueObject } from '../../../../shared/domain/base/value-object';

export type NotificationStatusValue = 'pending' | 'delivered' | 'read' | 'failed';

export class NotificationStatus extends ValueObject<NotificationStatusValue> {
  private constructor(value: NotificationStatusValue) {
    super(value);
  }

  /**
   * Create a new Notification Status
   */
  static create(value: NotificationStatusValue): NotificationStatus {
    return new NotificationStatus(value);
  }

  /**
   * Validate notification status
   */
  protected validate(value: NotificationStatusValue): void {
    const validStatuses: NotificationStatusValue[] = ['pending', 'delivered', 'read', 'failed'];
    if (!validStatuses.includes(value)) {
      throw new Error(`Invalid notification status: ${value}`);
    }
  }
}
