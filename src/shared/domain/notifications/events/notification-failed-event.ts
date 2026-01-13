import { DomainEvent } from '../../base/domain-event';
import { UniqueId } from '../../value-objects/unique-id';

export class NotificationFailedEvent extends DomainEvent {
  constructor(
    public readonly notificationId: UniqueId,
    public readonly userId: UniqueId,
    public readonly organizationId: UniqueId | undefined,
    public readonly error: string,
    public readonly failedAt: Date = new Date()
  ) {
    super('NotificationFailed', notificationId.id);
  }

  public toJSON(): Record<string, any> {
    return {
      ...super.getEventData(),
      notificationId: this.notificationId.id,
      userId: this.userId.id,
      organizationId: this.organizationId?.id,
      error: this.error,
      failedAt: this.failedAt.toISOString(),
    };
  }

  getEventName(): string {
    return 'NotificationFailed';
  }
}