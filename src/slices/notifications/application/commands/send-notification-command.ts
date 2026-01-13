import { Command } from '../../../../shared/application/base/command';
import { NotificationCategory, NotificationPriority } from '../../../../shared/domain/notifications/entities/notification';
import { ChannelType } from '../../../../shared/domain/notifications/value-objects/notification-channel';

export class SendNotificationCommand extends Command {
  constructor(
    public readonly userId: string,
    public readonly organizationId: string,
    public readonly title: string,
    public readonly message: string,
    public readonly category: NotificationCategory,
    public readonly priority: NotificationPriority = NotificationPriority.MEDIUM,
    public readonly channels: ChannelType[] = [ChannelType.IN_APP],
    public readonly metadata?: Record<string, any>,
    public readonly scheduledAt?: Date,
    public readonly expiresAt?: Date,
    public readonly actionUrl?: string,
    public readonly actionText?: string
  ) {
    super();
  }

  static create(params: {
    userId: string;
    organizationId: string;
    title: string;
    message: string;
    category: NotificationCategory;
    priority?: NotificationPriority;
    channels?: ChannelType[];
    metadata?: Record<string, any>;
    scheduledAt?: Date;
    expiresAt?: Date;
    actionUrl?: string;
    actionText?: string;
  }): SendNotificationCommand {
    return new SendNotificationCommand(
      params.userId,
      params.organizationId,
      params.title,
      params.message,
      params.category,
      params.priority,
      params.channels,
      params.metadata,
      params.scheduledAt,
      params.expiresAt,
      params.actionUrl,
      params.actionText
    );
  }
}