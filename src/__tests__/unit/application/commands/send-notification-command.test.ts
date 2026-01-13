import { SendNotificationCommand } from '../../../../../slices/notifications/application/commands/send-notification-command';
import { NotificationCategory, NotificationPriority } from '../../../../../shared/domain/notifications/entities/notification';
import { ChannelType } from '../../../../../shared/domain/notifications/value-objects/notification-channel';

describe('SendNotificationCommand', () => {
  const validUserId = 'user-123';
  const validOrganizationId = 'org-123';
  const validTitle = 'Test Notification';
  const validMessage = 'This is a test notification message';
  const validCategory = NotificationCategory.SYSTEM;
  const validPriority = NotificationPriority.HIGH;
  const validChannels = [ChannelType.EMAIL, ChannelType.IN_APP];
  const validMetadata = { source: 'test', version: '1.0' };
  const validScheduledAt = new Date('2024-12-31T10:00:00Z');
  const validExpiresAt = new Date('2024-12-31T23:59:59Z');
  const validActionUrl = 'https://example.com/action';
  const validActionText = 'View Details';

  describe('constructor', () => {
    it('should create command with all parameters', () => {
      const command = new SendNotificationCommand(
        validUserId,
        validOrganizationId,
        validTitle,
        validMessage,
        validCategory,
        validPriority,
        validChannels,
        validMetadata,
        validScheduledAt,
        validExpiresAt,
        validActionUrl,
        validActionText
      );

      expect(command.userId).toBe(validUserId);
      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.title).toBe(validTitle);
      expect(command.message).toBe(validMessage);
      expect(command.category).toBe(validCategory);
      expect(command.priority).toBe(validPriority);
      expect(command.channels).toEqual(validChannels);
      expect(command.metadata).toEqual(validMetadata);
      expect(command.scheduledAt).toBe(validScheduledAt);
      expect(command.expiresAt).toBe(validExpiresAt);
      expect(command.actionUrl).toBe(validActionUrl);
      expect(command.actionText).toBe(validActionText);
    });

    it('should create command with required parameters only', () => {
      const command = new SendNotificationCommand(
        validUserId,
        validOrganizationId,
        validTitle,
        validMessage,
        validCategory
      );

      expect(command.userId).toBe(validUserId);
      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.title).toBe(validTitle);
      expect(command.message).toBe(validMessage);
      expect(command.category).toBe(validCategory);
      expect(command.priority).toBe(NotificationPriority.MEDIUM); // default value
      expect(command.channels).toEqual([ChannelType.IN_APP]); // default value
      expect(command.metadata).toBeUndefined();
      expect(command.scheduledAt).toBeUndefined();
      expect(command.expiresAt).toBeUndefined();
      expect(command.actionUrl).toBeUndefined();
      expect(command.actionText).toBeUndefined();
    });

    it('should create command with custom priority and channels', () => {
      const customChannels = [ChannelType.SMS, ChannelType.PUSH];
      const command = new SendNotificationCommand(
        validUserId,
        validOrganizationId,
        validTitle,
        validMessage,
        validCategory,
        NotificationPriority.LOW,
        customChannels
      );

      expect(command.priority).toBe(NotificationPriority.LOW);
      expect(command.channels).toEqual(customChannels);
    });
  });

  describe('static create method', () => {
    it('should create command with all parameters using static method', () => {
      const command = SendNotificationCommand.create({
        userId: validUserId,
        organizationId: validOrganizationId,
        title: validTitle,
        message: validMessage,
        category: validCategory,
        priority: validPriority,
        channels: validChannels,
        metadata: validMetadata,
        scheduledAt: validScheduledAt,
        expiresAt: validExpiresAt,
        actionUrl: validActionUrl,
        actionText: validActionText,
      });

      expect(command.userId).toBe(validUserId);
      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.title).toBe(validTitle);
      expect(command.message).toBe(validMessage);
      expect(command.category).toBe(validCategory);
      expect(command.priority).toBe(validPriority);
      expect(command.channels).toEqual(validChannels);
      expect(command.metadata).toEqual(validMetadata);
      expect(command.scheduledAt).toBe(validScheduledAt);
      expect(command.expiresAt).toBe(validExpiresAt);
      expect(command.actionUrl).toBe(validActionUrl);
      expect(command.actionText).toBe(validActionText);
    });

    it('should create command with required parameters only using static method', () => {
      const command = SendNotificationCommand.create({
        userId: validUserId,
        organizationId: validOrganizationId,
        title: validTitle,
        message: validMessage,
        category: validCategory,
      });

      expect(command.userId).toBe(validUserId);
      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.title).toBe(validTitle);
      expect(command.message).toBe(validMessage);
      expect(command.category).toBe(validCategory);
      expect(command.priority).toBe(NotificationPriority.MEDIUM);
      expect(command.channels).toEqual([ChannelType.IN_APP]);
      expect(command.metadata).toBeUndefined();
      expect(command.scheduledAt).toBeUndefined();
      expect(command.expiresAt).toBeUndefined();
      expect(command.actionUrl).toBeUndefined();
      expect(command.actionText).toBeUndefined();
    });

    it('should create command with partial parameters using static method', () => {
      const command = SendNotificationCommand.create({
        userId: validUserId,
        organizationId: validOrganizationId,
        title: validTitle,
        message: validMessage,
        category: validCategory,
        priority: NotificationPriority.URGENT,
        channels: [ChannelType.EMAIL],
        actionUrl: validActionUrl,
      });

      expect(command.userId).toBe(validUserId);
      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.title).toBe(validTitle);
      expect(command.message).toBe(validMessage);
      expect(command.category).toBe(validCategory);
      expect(command.priority).toBe(NotificationPriority.URGENT);
      expect(command.channels).toEqual([ChannelType.EMAIL]);
      expect(command.actionUrl).toBe(validActionUrl);
      expect(command.metadata).toBeUndefined();
      expect(command.scheduledAt).toBeUndefined();
      expect(command.expiresAt).toBeUndefined();
      expect(command.actionText).toBeUndefined();
    });
  });

  describe('notification categories', () => {
    it('should handle SYSTEM category', () => {
      const command = new SendNotificationCommand(
        validUserId,
        validOrganizationId,
        validTitle,
        validMessage,
        NotificationCategory.SYSTEM
      );

      expect(command.category).toBe(NotificationCategory.SYSTEM);
    });

    it('should handle REPORT category', () => {
      const command = new SendNotificationCommand(
        validUserId,
        validOrganizationId,
        validTitle,
        validMessage,
        NotificationCategory.REPORT
      );

      expect(command.category).toBe(NotificationCategory.REPORT);
    });

    it('should handle USER category', () => {
      const command = new SendNotificationCommand(
        validUserId,
        validOrganizationId,
        validTitle,
        validMessage,
        NotificationCategory.USER
      );

      expect(command.category).toBe(NotificationCategory.USER);
    });

    it('should handle SECURITY category', () => {
      const command = new SendNotificationCommand(
        validUserId,
        validOrganizationId,
        validTitle,
        validMessage,
        NotificationCategory.SECURITY
      );

      expect(command.category).toBe(NotificationCategory.SECURITY);
    });
  });

  describe('notification priorities', () => {
    it('should handle LOW priority', () => {
      const command = new SendNotificationCommand(
        validUserId,
        validOrganizationId,
        validTitle,
        validMessage,
        validCategory,
        NotificationPriority.LOW
      );

      expect(command.priority).toBe(NotificationPriority.LOW);
    });

    it('should handle MEDIUM priority', () => {
      const command = new SendNotificationCommand(
        validUserId,
        validOrganizationId,
        validTitle,
        validMessage,
        validCategory,
        NotificationPriority.MEDIUM
      );

      expect(command.priority).toBe(NotificationPriority.MEDIUM);
    });

    it('should handle HIGH priority', () => {
      const command = new SendNotificationCommand(
        validUserId,
        validOrganizationId,
        validTitle,
        validMessage,
        validCategory,
        NotificationPriority.HIGH
      );

      expect(command.priority).toBe(NotificationPriority.HIGH);
    });

    it('should handle URGENT priority', () => {
      const command = new SendNotificationCommand(
        validUserId,
        validOrganizationId,
        validTitle,
        validMessage,
        validCategory,
        NotificationPriority.URGENT
      );

      expect(command.priority).toBe(NotificationPriority.URGENT);
    });
  });

  describe('notification channels', () => {
    it('should handle single channel', () => {
      const command = new SendNotificationCommand(
        validUserId,
        validOrganizationId,
        validTitle,
        validMessage,
        validCategory,
        validPriority,
        [ChannelType.EMAIL]
      );

      expect(command.channels).toEqual([ChannelType.EMAIL]);
    });

    it('should handle multiple channels', () => {
      const multipleChannels = [
        ChannelType.EMAIL,
        ChannelType.SMS,
        ChannelType.PUSH,
        ChannelType.IN_APP
      ];
      const command = new SendNotificationCommand(
        validUserId,
        validOrganizationId,
        validTitle,
        validMessage,
        validCategory,
        validPriority,
        multipleChannels
      );

      expect(command.channels).toEqual(multipleChannels);
    });

    it('should handle IN_APP channel', () => {
      const command = new SendNotificationCommand(
        validUserId,
        validOrganizationId,
        validTitle,
        validMessage,
        validCategory,
        validPriority,
        [ChannelType.IN_APP]
      );

      expect(command.channels).toEqual([ChannelType.IN_APP]);
    });

    it('should handle SMS channel', () => {
      const command = new SendNotificationCommand(
        validUserId,
        validOrganizationId,
        validTitle,
        validMessage,
        validCategory,
        validPriority,
        [ChannelType.SMS]
      );

      expect(command.channels).toEqual([ChannelType.SMS]);
    });

    it('should handle PUSH channel', () => {
      const command = new SendNotificationCommand(
        validUserId,
        validOrganizationId,
        validTitle,
        validMessage,
        validCategory,
        validPriority,
        [ChannelType.PUSH]
      );

      expect(command.channels).toEqual([ChannelType.PUSH]);
    });
  });

  describe('metadata handling', () => {
    it('should handle simple metadata', () => {
      const simpleMetadata = { key: 'value' };
      const command = new SendNotificationCommand(
        validUserId,
        validOrganizationId,
        validTitle,
        validMessage,
        validCategory,
        validPriority,
        validChannels,
        simpleMetadata
      );

      expect(command.metadata).toEqual(simpleMetadata);
    });

    it('should handle complex metadata', () => {
      const complexMetadata = {
        source: 'report-system',
        reportId: 'report-456',
        templateId: 'template-789',
        generatedAt: '2024-01-15T10:30:00Z',
        statistics: {
          recordCount: 1500,
          processingTime: 45.2,
          fileSize: '2.5MB',
        },
        tags: ['quarterly', 'financial', 'automated'],
        config: {
          format: 'pdf',
          includeCharts: true,
          colorScheme: 'corporate',
        },
      };
      const command = new SendNotificationCommand(
        validUserId,
        validOrganizationId,
        validTitle,
        validMessage,
        validCategory,
        validPriority,
        validChannels,
        complexMetadata
      );

      expect(command.metadata).toEqual(complexMetadata);
    });

    it('should handle undefined metadata', () => {
      const command = new SendNotificationCommand(
        validUserId,
        validOrganizationId,
        validTitle,
        validMessage,
        validCategory
      );

      expect(command.metadata).toBeUndefined();
    });
  });

  describe('scheduling and expiration', () => {
    it('should handle scheduled notification', () => {
      const futureDate = new Date('2024-12-31T15:00:00Z');
      const command = new SendNotificationCommand(
        validUserId,
        validOrganizationId,
        validTitle,
        validMessage,
        validCategory,
        validPriority,
        validChannels,
        validMetadata,
        futureDate
      );

      expect(command.scheduledAt).toBe(futureDate);
    });

    it('should handle notification with expiration', () => {
      const expirationDate = new Date('2024-12-31T23:59:59Z');
      const command = new SendNotificationCommand(
        validUserId,
        validOrganizationId,
        validTitle,
        validMessage,
        validCategory,
        validPriority,
        validChannels,
        validMetadata,
        undefined,
        expirationDate
      );

      expect(command.expiresAt).toBe(expirationDate);
    });

    it('should handle both scheduling and expiration', () => {
      const scheduleDate = new Date('2024-12-31T10:00:00Z');
      const expirationDate = new Date('2024-12-31T23:59:59Z');
      const command = new SendNotificationCommand(
        validUserId,
        validOrganizationId,
        validTitle,
        validMessage,
        validCategory,
        validPriority,
        validChannels,
        validMetadata,
        scheduleDate,
        expirationDate
      );

      expect(command.scheduledAt).toBe(scheduleDate);
      expect(command.expiresAt).toBe(expirationDate);
    });
  });

  describe('action handling', () => {
    it('should handle action URL only', () => {
      const command = new SendNotificationCommand(
        validUserId,
        validOrganizationId,
        validTitle,
        validMessage,
        validCategory,
        validPriority,
        validChannels,
        validMetadata,
        undefined,
        undefined,
        validActionUrl
      );

      expect(command.actionUrl).toBe(validActionUrl);
      expect(command.actionText).toBeUndefined();
    });

    it('should handle action text only', () => {
      const command = new SendNotificationCommand(
        validUserId,
        validOrganizationId,
        validTitle,
        validMessage,
        validCategory,
        validPriority,
        validChannels,
        validMetadata,
        undefined,
        undefined,
        undefined,
        validActionText
      );

      expect(command.actionUrl).toBeUndefined();
      expect(command.actionText).toBe(validActionText);
    });

    it('should handle both action URL and text', () => {
      const command = new SendNotificationCommand(
        validUserId,
        validOrganizationId,
        validTitle,
        validMessage,
        validCategory,
        validPriority,
        validChannels,
        validMetadata,
        undefined,
        undefined,
        validActionUrl,
        validActionText
      );

      expect(command.actionUrl).toBe(validActionUrl);
      expect(command.actionText).toBe(validActionText);
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in title and message', () => {
      const specialTitle = 'Notification with @#$%^&*()_+ characters';
      const specialMessage = 'Message with émojis 🚀 and ñ characters';
      const command = new SendNotificationCommand(
        validUserId,
        validOrganizationId,
        specialTitle,
        specialMessage,
        validCategory
      );

      expect(command.title).toBe(specialTitle);
      expect(command.message).toBe(specialMessage);
    });

    it('should handle empty arrays for channels', () => {
      const command = new SendNotificationCommand(
        validUserId,
        validOrganizationId,
        validTitle,
        validMessage,
        validCategory,
        validPriority,
        []
      );

      expect(command.channels).toEqual([]);
    });

    it('should handle long messages', () => {
      const longMessage = 'a'.repeat(5000);
      const command = new SendNotificationCommand(
        validUserId,
        validOrganizationId,
        validTitle,
        longMessage,
        validCategory
      );

      expect(command.message).toBe(longMessage);
    });

    it('should handle special characters in IDs', () => {
      const specialUserId = 'user-123-abc_def@domain.com';
      const specialOrgId = 'org-456-xyz_abc@domain.com';
      const command = new SendNotificationCommand(
        specialUserId,
        specialOrgId,
        validTitle,
        validMessage,
        validCategory
      );

      expect(command.userId).toBe(specialUserId);
      expect(command.organizationId).toBe(specialOrgId);
    });
  });
});