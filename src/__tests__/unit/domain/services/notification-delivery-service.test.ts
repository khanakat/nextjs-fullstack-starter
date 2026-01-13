import { NotificationDeliveryService } from 'src/shared/domain/notifications/services/notification-delivery-service';
import { DomainServiceFactory } from '../../../factories/domain-service-factory';
import { NotificationFactory } from '../../../factories/notification-factory';
import { ValueObjectFactory } from '../../../factories/value-object-factory';
import { ChannelType } from 'src/shared/domain/notifications/value-objects/notification-channel';

describe('NotificationDeliveryService', () => {
  let deliveryService: NotificationDeliveryService;
  let mockEmailService: any;
  let mockPushService: any;
  let mockSmsService: any;
  let mockInAppService: any;

  beforeEach(() => {
    mockEmailService = {
      send: jest.fn().mockResolvedValue({ success: true, messageId: 'email-123' }),
      validateAddress: jest.fn().mockReturnValue(true),
    };

    mockPushService = {
      send: jest.fn().mockResolvedValue({ success: true, messageId: 'push-123' }),
      registerDevice: jest.fn().mockResolvedValue(true),
    };

    mockSmsService = {
      send: jest.fn().mockResolvedValue({ success: true, messageId: 'sms-123' }),
      validatePhoneNumber: jest.fn().mockReturnValue(true),
    };

    mockInAppService = {
      send: jest.fn().mockResolvedValue({ success: true, messageId: 'inapp-123' }),
      markAsRead: jest.fn().mockResolvedValue(true),
    };

    deliveryService = DomainServiceFactory.createNotificationDeliveryService({
      emailService: mockEmailService,
      pushService: mockPushService,
      smsService: mockSmsService,
      inAppService: mockInAppService,
    });
  });

  describe('Single Channel Delivery', () => {
    it('should deliver notification via email channel', async () => {
      const notification = NotificationFactory.create();
      const channel = ValueObjectFactory.createNotificationChannel(ChannelType.EMAIL);

      const result = await deliveryService.deliverToChannel(notification, channel);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('email-123');
      expect(mockEmailService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: notification.getRecipientId(),
          subject: notification.getTitle(),
          body: notification.getMessage(),
        })
      );
    });

    it('should deliver notification via push channel', async () => {
      const notification = NotificationFactory.create();
      const channel = ValueObjectFactory.createNotificationChannel(ChannelType.PUSH);

      const result = await deliveryService.deliverToChannel(notification, channel);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('push-123');
      expect(mockPushService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: notification.getRecipientId(),
          title: notification.getTitle(),
          body: notification.getMessage(),
        })
      );
    });

    it('should deliver notification via SMS channel', async () => {
      const notification = NotificationFactory.create();
      const channel = ValueObjectFactory.createNotificationChannel(ChannelType.SMS);

      const result = await deliveryService.deliverToChannel(notification, channel);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('sms-123');
      expect(mockSmsService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: notification.getRecipientId(),
          message: `${notification.getTitle()}: ${notification.getMessage()}`,
        })
      );
    });

    it('should deliver notification via in-app channel', async () => {
      const notification = NotificationFactory.create();
      const channel = ValueObjectFactory.createNotificationChannel(ChannelType.IN_APP);

      const result = await deliveryService.deliverToChannel(notification, channel);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('inapp-123');
      expect(mockInAppService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: notification.getRecipientId(),
          notification: notification,
        })
      );
    });
  });

  describe('Multi-Channel Delivery', () => {
    it('should deliver notification to multiple channels', async () => {
      const notification = NotificationFactory.create();
      const channels = ValueObjectFactory.createEnabledChannels();

      const results = await deliveryService.deliverToChannels(notification, channels);

      expect(results).toHaveLength(channels.length);
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.messageId).toBeDefined();
      });

      expect(mockEmailService.send).toHaveBeenCalled();
      expect(mockPushService.send).toHaveBeenCalled();
      expect(mockInAppService.send).toHaveBeenCalled();
    });

    it('should handle partial failures in multi-channel delivery', async () => {
      mockEmailService.send.mockRejectedValue(new Error('Email service unavailable'));
      
      const notification = NotificationFactory.create();
      const channels = [
        ValueObjectFactory.createNotificationChannel(ChannelType.EMAIL),
        ValueObjectFactory.createNotificationChannel(ChannelType.PUSH),
      ];

      const results = await deliveryService.deliverToChannels(notification, channels);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBeDefined();
      expect(results[1].success).toBe(true);
    });

    it('should skip disabled channels', async () => {
      const notification = NotificationFactory.create();
      const channels = [
        ValueObjectFactory.createNotificationChannel(ChannelType.EMAIL, true),
        ValueObjectFactory.createNotificationChannel(ChannelType.PUSH, false),
      ];

      const results = await deliveryService.deliverToChannels(notification, channels);

      expect(results).toHaveLength(1);
      expect(mockEmailService.send).toHaveBeenCalled();
      expect(mockPushService.send).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle email service failures', async () => {
      mockEmailService.send.mockRejectedValue(new Error('Email service unavailable'));
      
      const notification = NotificationFactory.create();
      const channel = ValueObjectFactory.createNotificationChannel(ChannelType.EMAIL);

      const result = await deliveryService.deliverToChannel(notification, channel);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email service unavailable');
      expect(result.messageId).toBeUndefined();
    });

    it('should handle push service failures', async () => {
      mockPushService.send.mockRejectedValue(new Error('Push service unavailable'));
      
      const notification = NotificationFactory.create();
      const channel = ValueObjectFactory.createNotificationChannel(ChannelType.PUSH);

      const result = await deliveryService.deliverToChannel(notification, channel);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Push service unavailable');
    });

    it('should handle invalid channel types', async () => {
      const notification = NotificationFactory.create();
      const invalidChannel = { 
        getType: () => 'INVALID' as ChannelType,
        isEnabled: () => true 
      } as any;

      const result = await deliveryService.deliverToChannel(notification, invalidChannel);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported channel type');
    });

    it('should handle network timeouts', async () => {
      mockEmailService.send.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );
      
      const notification = NotificationFactory.create();
      const channel = ValueObjectFactory.createNotificationChannel(ChannelType.EMAIL);

      const result = await deliveryService.deliverToChannel(notification, channel);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Request timeout');
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed deliveries', async () => {
      mockEmailService.send
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({ success: true, messageId: 'email-retry-123' });
      
      const notification = NotificationFactory.create();
      const channel = ValueObjectFactory.createNotificationChannel(ChannelType.EMAIL);

      const result = await deliveryService.deliverToChannelWithRetry(notification, channel, 2);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('email-retry-123');
      expect(mockEmailService.send).toHaveBeenCalledTimes(2);
    });

    it('should fail after maximum retry attempts', async () => {
      mockEmailService.send.mockRejectedValue(new Error('Persistent failure'));
      
      const notification = NotificationFactory.create();
      const channel = ValueObjectFactory.createNotificationChannel(ChannelType.EMAIL);

      const result = await deliveryService.deliverToChannelWithRetry(notification, channel, 3);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Persistent failure');
      expect(mockEmailService.send).toHaveBeenCalledTimes(3);
    });

    it('should use exponential backoff for retries', async () => {
      const startTime = Date.now();
      mockEmailService.send.mockRejectedValue(new Error('Failure'));
      
      const notification = NotificationFactory.create();
      const channel = ValueObjectFactory.createNotificationChannel(ChannelType.EMAIL);

      await deliveryService.deliverToChannelWithRetry(notification, channel, 2);

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should have some delay due to backoff (at least 100ms for first retry)
      expect(duration).toBeGreaterThan(100);
    });
  });

  describe('Delivery Status Tracking', () => {
    it('should track successful deliveries', async () => {
      const notification = NotificationFactory.create();
      const channel = ValueObjectFactory.createNotificationChannel(ChannelType.EMAIL);

      const result = await deliveryService.deliverToChannel(notification, channel);

      expect(result.deliveredAt).toBeDefined();
      expect(result.deliveredAt).toBeInstanceOf(Date);
      expect(result.attempts).toBe(1);
    });

    it('should track failed deliveries', async () => {
      mockEmailService.send.mockRejectedValue(new Error('Delivery failed'));
      
      const notification = NotificationFactory.create();
      const channel = ValueObjectFactory.createNotificationChannel(ChannelType.EMAIL);

      const result = await deliveryService.deliverToChannel(notification, channel);

      expect(result.failedAt).toBeDefined();
      expect(result.failedAt).toBeInstanceOf(Date);
      expect(result.attempts).toBe(1);
    });

    it('should track retry attempts', async () => {
      mockEmailService.send
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValueOnce({ success: true, messageId: 'email-final-123' });
      
      const notification = NotificationFactory.create();
      const channel = ValueObjectFactory.createNotificationChannel(ChannelType.EMAIL);

      const result = await deliveryService.deliverToChannelWithRetry(notification, channel, 3);

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(3);
    });
  });

  describe('Performance', () => {
    it('should handle concurrent deliveries', async () => {
      const notifications = NotificationFactory.createMany(10);
      const channel = ValueObjectFactory.createNotificationChannel(ChannelType.EMAIL);

      const promises = notifications.map(notification => 
        deliveryService.deliverToChannel(notification, channel)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
      expect(mockEmailService.send).toHaveBeenCalledTimes(10);
    });

    it('should handle bulk delivery efficiently', async () => {
      const notifications = NotificationFactory.createMany(100);
      const channels = ValueObjectFactory.createEnabledChannels();

      const startTime = Date.now();
      const results = await deliveryService.deliverBulk(notifications, channels);
      const endTime = Date.now();

      expect(results).toHaveLength(notifications.length);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});