import { Notification, NotificationStatus, NotificationPriority, NotificationCategory } from 'src/shared/domain/notifications/entities/notification';
import { NotificationChannel, ChannelType } from 'src/shared/domain/notifications/value-objects/notification-channel';
import { UniqueId } from 'src/shared/domain/value-objects/unique-id';
import { createId } from '@paralleldrive/cuid2';

/**
 * Factory for creating Notification test instances
 */
export class NotificationFactory {
  static create(overrides: Partial<{
    id: string;
    title: string;
    message: string;
    category: NotificationCategory;
    priority: NotificationPriority;
    userId: string;
    organizationId: string;
    channels: ChannelType[];
    metadata: Record<string, any>;
    scheduledAt: Date;
    expiresAt: Date;
  }> = {}): Notification {
    const defaultData = {
      title: 'Test Notification',
      message: 'This is a test notification message',
      category: NotificationCategory.SYSTEM,
      priority: NotificationPriority.MEDIUM,
      userId: createId(),
      organizationId: createId(),
      channels: [ChannelType.IN_APP],
      metadata: {},
      scheduledAt: undefined,
      expiresAt: undefined,
      ...overrides,
    };

    const channels = defaultData.channels.map(channelType => 
      NotificationChannel.create(channelType, true)
    );

    const providedId = overrides.id ? UniqueId.create(overrides.id) : undefined;

    return Notification.create(
      new UniqueId(defaultData.userId),
      defaultData.title,
      defaultData.message,
      defaultData.category,
      defaultData.priority,
      channels,
      defaultData.organizationId ? new UniqueId(defaultData.organizationId) : undefined,
      defaultData.metadata,
      undefined, // actionUrl
      undefined, // imageUrl
      defaultData.scheduledAt,
      defaultData.expiresAt,
      providedId
    );
  }

  static createMany(count: number, overrides: Partial<any> = {}): Notification[] {
    return Array.from({ length: count }, (_, index) =>
      this.create({
        id: `test-notification-${index + 1}`,
        title: `Test Notification ${index + 1}`,
        ...overrides,
      })
    );
  }

  static createPending(overrides: Partial<any> = {}): Notification {
    return NotificationFactory.create({
      ...overrides,
    });
  }

  static createSent(overrides: Partial<any> = {}): Notification {
    const notif = NotificationFactory.create({
      ...overrides,
    });
    notif.markAsSent();
    return notif;
  }

  static createRead(overrides: Partial<any> = {}): Notification {
    const notif = NotificationFactory.create({
      ...overrides,
    });
    notif.markAsSent();
    notif.markAsRead();
    return notif;
  }

  static createHighPriority(overrides: Partial<any> = {}): Notification {
    return NotificationFactory.create({
      priority: NotificationPriority.HIGH,
      channels: [ChannelType.IN_APP, ChannelType.EMAIL, ChannelType.PUSH],
      ...overrides,
    });
  }

  static createSystemNotification(overrides: Partial<any> = {}): Notification {
    return NotificationFactory.create({
      category: NotificationCategory.SYSTEM,
      ...overrides,
    });
  }

  static createUserNotification(overrides: Partial<any> = {}): Notification {
    return NotificationFactory.create({
      category: NotificationCategory.USER,
      ...overrides,
    });
  }

  static createScheduled(scheduledAt: Date, overrides: Partial<any> = {}): Notification {
    return NotificationFactory.create({
      scheduledAt,
      ...overrides,
    });
  }
}

// Placeholder test to ensure jest treats this file as a valid suite when matched
describe('NotificationFactory helpers', () => {
  it('exposes create and helpers', () => {
    const notif = NotificationFactory.create();
    expect(notif).toBeDefined();
    expect(typeof NotificationFactory.createMany).toBe('function');
    expect(typeof NotificationFactory.createHighPriority).toBe('function');
  });
});