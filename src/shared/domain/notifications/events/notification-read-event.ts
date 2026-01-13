import { DomainEvent } from '../../base/domain-event';
import { UniqueId } from '../../value-objects/unique-id';

export class NotificationReadEvent extends DomainEvent {
  public readonly notificationId: UniqueId;
  public readonly userId: UniqueId;
  public readonly organizationId?: UniqueId;
  public readonly readAt: Date;

  constructor(
    notificationId: UniqueId,
    userId: UniqueId,
    organizationId: UniqueId | undefined,
    readAt: Date
  ) {
    super(readAt);
    this.notificationId = notificationId;
    this.userId = userId;
    this.organizationId = organizationId;
    this.readAt = readAt;
  }

  getEventName(): string {
    return 'NotificationRead';
  }
}