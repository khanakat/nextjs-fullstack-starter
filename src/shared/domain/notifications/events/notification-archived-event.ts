import { DomainEvent } from '../../base/domain-event';
import { UniqueId } from '../../value-objects/unique-id';

export class NotificationArchivedEvent extends DomainEvent {
  public readonly notificationId: UniqueId;
  public readonly userId: UniqueId;
  public readonly organizationId?: UniqueId;
  public readonly archivedAt: Date;

  constructor(
    notificationId: UniqueId,
    userId: UniqueId,
    organizationId: UniqueId | undefined,
    archivedAt: Date
  ) {
    super(archivedAt);
    this.notificationId = notificationId;
    this.userId = userId;
    this.organizationId = organizationId;
    this.archivedAt = archivedAt;
  }

  getEventName(): string {
    return 'NotificationArchived';
  }
}