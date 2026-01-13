import { DomainEvent } from '../../base/domain-event';
import { UniqueId } from '../../value-objects/unique-id';
import { NotificationCategory, NotificationPriority } from '../entities/notification';
import { NotificationChannel } from '../value-objects/notification-channel';

export class NotificationCreatedEvent extends DomainEvent {
  public readonly notificationId: UniqueId;
  public readonly userId: UniqueId;
  public readonly organizationId?: UniqueId;
  public readonly title: string;
  public readonly message: string;
  public readonly category: NotificationCategory;
  public readonly priority: NotificationPriority;
  public readonly channels: NotificationChannel[];
  public readonly scheduledAt?: Date;

  constructor(
    notificationId: UniqueId,
    userId: UniqueId,
    organizationId: UniqueId | undefined,
    title: string,
    message: string,
    category: NotificationCategory,
    priority: NotificationPriority,
    channels: NotificationChannel[],
    scheduledAt: Date | undefined,
    occurredOn: Date
  ) {
    super(occurredOn);
    this.notificationId = notificationId;
    this.userId = userId;
    this.organizationId = organizationId;
    this.title = title;
    this.message = message;
    this.category = category;
    this.priority = priority;
    this.channels = channels;
    this.scheduledAt = scheduledAt;
  }

  getEventName(): string {
    return 'NotificationCreated';
  }
}