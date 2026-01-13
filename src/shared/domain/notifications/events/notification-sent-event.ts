import { DomainEvent } from '../../base/domain-event';
import { UniqueId } from '../../value-objects/unique-id';
import { NotificationChannel } from '../value-objects/notification-channel';

export class NotificationSentEvent extends DomainEvent {
  constructor(
    public readonly notificationId: UniqueId,
    public readonly userId: UniqueId,
    public readonly organizationId: UniqueId | undefined,
    public readonly channels: NotificationChannel[],
    public readonly sentAt: Date = new Date()
  ) {
    super();
  }

  getEventName(): string {
    return 'NotificationSent';
  }

  public toJSON(): Record<string, any> {
    return {
      ...super.getEventData(),
      notificationId: this.notificationId.id,
      userId: this.userId.id,
      organizationId: this.organizationId?.id,
      channels: this.channels.map(channel => ({
        type: channel.type,
        enabled: channel.enabled,
        config: channel.config
      })),
      sentAt: this.sentAt.toISOString(),
    };
  }
}