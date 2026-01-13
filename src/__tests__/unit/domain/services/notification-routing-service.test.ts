import { NotificationRoutingService } from '@/shared/domain/notifications/services/notification-routing-service';
import { Notification, NotificationCategory, NotificationPriority } from '@/shared/domain/notifications/entities/notification';
import { NotificationPreferences } from '@/shared/domain/notifications/value-objects/notification-preferences';
import { NotificationChannel, ChannelType } from '@/shared/domain/notifications/value-objects/notification-channel';
import { UniqueId } from '@/shared/domain/value-objects/unique-id';
import { DomainError } from '@/shared/domain/exceptions/domain-error';

describe('NotificationRoutingService', () => {
  let notification: Notification;
  let preferences: NotificationPreferences;
  let userId: UniqueId;
  let organizationId: UniqueId;

  beforeEach(() => {
    userId = UniqueId.generate();
    organizationId = UniqueId.generate();

    // Create default notification
    notification = Notification.create({
      userId,
      organizationId,
      title: 'Test Notification',
      message: 'Test message',
      category: NotificationCategory.REPORT,
      priority: NotificationPriority.MEDIUM,
      channels: [
        NotificationChannel.create({
          type: ChannelType.IN_APP,
          enabled: true,
        }),
        NotificationChannel.create({
          type: ChannelType.EMAIL,
          enabled: true,
        }),
      ],
    });

    // Create default preferences
    preferences = NotificationPreferences.create({
      globalEnabled: true,
      categories: {
        [NotificationCategory.REPORT]: {
          enabled: true,
          channels: [ChannelType.IN_APP, ChannelType.EMAIL],
        },
        [NotificationCategory.SYSTEM]: {
          enabled: true,
          channels: [ChannelType.IN_APP],
        },
      },
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00',
        timezone: 'UTC',
      },
    });
  });

  describe('routeNotification', () => {
    it('should deliver notification when all conditions are met', () => {
      const decision = NotificationRoutingService.routeNotification(notification, preferences);

      expect(decision.shouldDeliver).toBe(true);
      expect(decision.channels).toHaveLength(2);
      expect(decision.channels.map(c => c.type)).toContain(ChannelType.IN_APP);
      expect(decision.channels.map(c => c.type)).toContain(ChannelType.EMAIL);
      expect(decision.reason).toBeUndefined();
    });

    it('should not deliver when global notifications are disabled', () => {
      const disabledPreferences = NotificationPreferences.create({
        ...preferences.toJSON(),
        globalEnabled: false,
      });

      const decision = NotificationRoutingService.routeNotification(notification, disabledPreferences);

      expect(decision.shouldDeliver).toBe(false);
      expect(decision.channels).toHaveLength(0);
      expect(decision.reason).toBe('Global notifications disabled');
    });

    it('should not deliver when category is disabled', () => {
      const categoryDisabledPreferences = NotificationPreferences.create({
        ...preferences.toJSON(),
        categories: {
          ...preferences.toJSON().categories,
          [NotificationCategory.REPORT]: {
            enabled: false,
            channels: [ChannelType.IN_APP],
          },
        },
      });

      const decision = NotificationRoutingService.routeNotification(notification, categoryDisabledPreferences);

      expect(decision.shouldDeliver).toBe(false);
      expect(decision.channels).toHaveLength(0);
      expect(decision.reason).toBe(`Category ${NotificationCategory.REPORT} disabled`);
    });

    it('should not deliver expired notifications', () => {
      const expiredNotification = Notification.create({
        userId,
        organizationId,
        title: 'Expired Notification',
        message: 'Test message',
        category: NotificationCategory.REPORT,
        priority: NotificationPriority.MEDIUM,
        channels: [NotificationChannel.create({ type: ChannelType.IN_APP, enabled: true })],
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
      });

      const decision = NotificationRoutingService.routeNotification(expiredNotification, preferences);

      expect(decision.shouldDeliver).toBe(false);
      expect(decision.channels).toHaveLength(0);
      expect(decision.reason).toBe('Notification expired');
    });

    it('should not deliver scheduled notifications immediately', () => {
      const scheduledNotification = Notification.create({
        userId,
        organizationId,
        title: 'Scheduled Notification',
        message: 'Test message',
        category: NotificationCategory.REPORT,
        priority: NotificationPriority.MEDIUM,
        channels: [NotificationChannel.create({ type: ChannelType.IN_APP, enabled: true })],
        scheduledAt: new Date(Date.now() + 3600000), // Scheduled 1 hour from now
      });

      const decision = NotificationRoutingService.routeNotification(scheduledNotification, preferences);

      expect(decision.shouldDeliver).toBe(false);
      expect(decision.channels).toHaveLength(0);
      expect(decision.reason).toBe('Notification scheduled for future');
      expect(decision.delayUntil).toEqual(scheduledNotification.scheduledAt);
    });

    it('should filter channels based on user preferences', () => {
      const emailOnlyPreferences = NotificationPreferences.create({
        ...preferences.toJSON(),
        categories: {
          ...preferences.toJSON().categories,
          [NotificationCategory.REPORT]: {
            enabled: true,
            channels: [ChannelType.EMAIL], // Only email enabled
          },
        },
      });

      const decision = NotificationRoutingService.routeNotification(notification, emailOnlyPreferences);

      expect(decision.shouldDeliver).toBe(true);
      expect(decision.channels).toHaveLength(1);
      expect(decision.channels[0].type).toBe(ChannelType.EMAIL);
    });

    it('should handle quiet hours for non-urgent notifications', () => {
      const quietHoursPreferences = NotificationPreferences.create({
        ...preferences.toJSON(),
        quietHours: {
          enabled: true,
          startTime: '22:00',
          endTime: '08:00',
          timezone: 'UTC',
        },
      });

      // Mock current time to be in quiet hours (e.g., 2 AM)
      const originalDate = Date;
      const mockDate = new Date('2024-01-01T02:00:00Z');
      global.Date = jest.fn(() => mockDate) as any;
      global.Date.now = jest.fn(() => mockDate.getTime());

      const decision = NotificationRoutingService.routeNotification(notification, quietHoursPreferences);

      expect(decision.shouldDeliver).toBe(false);
      expect(decision.reason).toContain('quiet hours');

      // Restore original Date
      global.Date = originalDate;
    });

    it('should deliver urgent notifications during quiet hours via in-app only', () => {
      const urgentNotification = Notification.create({
        userId,
        organizationId,
        title: 'Urgent Notification',
        message: 'Urgent message',
        category: NotificationCategory.SYSTEM,
        priority: NotificationPriority.URGENT,
        channels: [
          NotificationChannel.create({ type: ChannelType.IN_APP, enabled: true }),
          NotificationChannel.create({ type: ChannelType.EMAIL, enabled: true }),
        ],
      });

      const quietHoursPreferences = NotificationPreferences.create({
        ...preferences.toJSON(),
        categories: {
          ...preferences.toJSON().categories,
          [NotificationCategory.SYSTEM]: {
            enabled: true,
            channels: [ChannelType.IN_APP, ChannelType.EMAIL],
          },
        },
        quietHours: {
          enabled: true,
          startTime: '22:00',
          endTime: '08:00',
          timezone: 'UTC',
        },
      });

      // Mock current time to be in quiet hours
      const originalDate = Date;
      const mockDate = new Date('2024-01-01T02:00:00Z');
      global.Date = jest.fn(() => mockDate) as any;
      global.Date.now = jest.fn(() => mockDate.getTime());

      const decision = NotificationRoutingService.routeNotification(urgentNotification, quietHoursPreferences);

      expect(decision.shouldDeliver).toBe(true);
      expect(decision.channels).toHaveLength(1);
      expect(decision.channels[0].type).toBe(ChannelType.IN_APP);

      // Restore original Date
      global.Date = originalDate;
    });

    it('should handle notifications with no matching channels', () => {
      const smsOnlyNotification = Notification.create({
        userId,
        organizationId,
        title: 'SMS Notification',
        message: 'Test message',
        category: NotificationCategory.REPORT,
        priority: NotificationPriority.MEDIUM,
        channels: [NotificationChannel.create({ type: ChannelType.SMS, enabled: true })],
      });

      // Preferences don't include SMS for reports
      const decision = NotificationRoutingService.routeNotification(smsOnlyNotification, preferences);

      expect(decision.shouldDeliver).toBe(false);
      expect(decision.channels).toHaveLength(0);
      expect(decision.reason).toContain('No matching channels');
    });
  });

  describe('validateRoutingConfiguration', () => {
    it('should validate valid configuration without throwing', () => {
      expect(() => {
        NotificationRoutingService.validateRoutingConfiguration(notification, preferences);
      }).not.toThrow();
    });

    it('should throw error for null notification', () => {
      expect(() => {
        NotificationRoutingService.validateRoutingConfiguration(null as any, preferences);
      }).toThrow(DomainError);
      expect(() => {
        NotificationRoutingService.validateRoutingConfiguration(null as any, preferences);
      }).toThrow('Notification cannot be null');
    });

    it('should throw error for null preferences', () => {
      expect(() => {
        NotificationRoutingService.validateRoutingConfiguration(notification, null as any);
      }).toThrow(DomainError);
      expect(() => {
        NotificationRoutingService.validateRoutingConfiguration(notification, null as any);
      }).toThrow('Preferences cannot be null');
    });

    it('should throw error for notification with no channels', () => {
      const noChannelsNotification = Notification.create({
        userId,
        organizationId,
        title: 'No Channels Notification',
        message: 'Test message',
        category: NotificationCategory.REPORT,
        priority: NotificationPriority.MEDIUM,
        channels: [],
      });

      expect(() => {
        NotificationRoutingService.validateRoutingConfiguration(noChannelsNotification, preferences);
      }).toThrow(DomainError);
      expect(() => {
        NotificationRoutingService.validateRoutingConfiguration(noChannelsNotification, preferences);
      }).toThrow('Notification must have at least one channel');
    });

    it('should throw error when no valid channels for category', () => {
      const webhookOnlyNotification = Notification.create({
        userId,
        organizationId,
        title: 'Webhook Notification',
        message: 'Test message',
        category: NotificationCategory.REPORT,
        priority: NotificationPriority.MEDIUM,
        channels: [NotificationChannel.create({ type: ChannelType.WEBHOOK, enabled: true })],
      });

      // Preferences don't include webhook for reports
      expect(() => {
        NotificationRoutingService.validateRoutingConfiguration(webhookOnlyNotification, preferences);
      }).toThrow(DomainError);
      expect(() => {
        NotificationRoutingService.validateRoutingConfiguration(webhookOnlyNotification, preferences);
      }).toThrow(`No valid channels for category ${NotificationCategory.REPORT} based on user preferences`);
    });
  });

  describe('edge cases', () => {
    it('should handle notification with disabled channels', () => {
      const disabledChannelNotification = Notification.create({
        userId,
        organizationId,
        title: 'Disabled Channel Notification',
        message: 'Test message',
        category: NotificationCategory.REPORT,
        priority: NotificationPriority.MEDIUM,
        channels: [
          NotificationChannel.create({ type: ChannelType.IN_APP, enabled: false }),
          NotificationChannel.create({ type: ChannelType.EMAIL, enabled: true }),
        ],
      });

      const decision = NotificationRoutingService.routeNotification(disabledChannelNotification, preferences);

      expect(decision.shouldDeliver).toBe(true);
      expect(decision.channels).toHaveLength(1);
      expect(decision.channels[0].type).toBe(ChannelType.EMAIL);
    });

    it('should handle multiple categories in preferences', () => {
      const systemNotification = Notification.create({
        userId,
        organizationId,
        title: 'System Notification',
        message: 'System message',
        category: NotificationCategory.SYSTEM,
        priority: NotificationPriority.HIGH,
        channels: [
          NotificationChannel.create({ type: ChannelType.IN_APP, enabled: true }),
          NotificationChannel.create({ type: ChannelType.EMAIL, enabled: true }),
        ],
      });

      const decision = NotificationRoutingService.routeNotification(systemNotification, preferences);

      expect(decision.shouldDeliver).toBe(true);
      expect(decision.channels).toHaveLength(1); // Only IN_APP is enabled for SYSTEM category
      expect(decision.channels[0].type).toBe(ChannelType.IN_APP);
    });

    it('should handle notification with metadata', () => {
      const metadataNotification = Notification.create({
        userId,
        organizationId,
        title: 'Metadata Notification',
        message: 'Test message',
        category: NotificationCategory.REPORT,
        priority: NotificationPriority.MEDIUM,
        channels: [NotificationChannel.create({ type: ChannelType.IN_APP, enabled: true })],
        metadata: { reportId: 'report-123', type: 'completion' },
      });

      const decision = NotificationRoutingService.routeNotification(metadataNotification, preferences);

      expect(decision.shouldDeliver).toBe(true);
      expect(decision.channels).toHaveLength(1);
    });

    it('should handle boundary time conditions', () => {
      const boundaryNotification = Notification.create({
        userId,
        organizationId,
        title: 'Boundary Notification',
        message: 'Test message',
        category: NotificationCategory.REPORT,
        priority: NotificationPriority.MEDIUM,
        channels: [NotificationChannel.create({ type: ChannelType.IN_APP, enabled: true })],
        expiresAt: new Date(Date.now() + 1000), // Expires in 1 second
      });

      const decision = NotificationRoutingService.routeNotification(boundaryNotification, preferences);

      expect(decision.shouldDeliver).toBe(true);
      expect(decision.channels).toHaveLength(1);
    });
  });
});