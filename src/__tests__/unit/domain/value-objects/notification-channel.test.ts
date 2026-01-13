import { NotificationChannel, ChannelType } from 'src/shared/domain/notifications/value-objects/notification-channel';
import { ValueObjectFactory } from '../../../factories/value-object-factory';
import { DomainError } from 'src/shared/domain/exceptions/domain-error';

describe('NotificationChannel Value Object', () => {
  describe('Creation', () => {
    it('should create notification channel with type and enabled status', () => {
      const channel = NotificationChannel.create(ChannelType.EMAIL, true);

      expect(channel.type).toBe(ChannelType.EMAIL);
      expect(channel.isEnabled()).toBe(true);
    });

    it('should create notification channel using factory', () => {
      const channel = ValueObjectFactory.createNotificationChannel();

      expect(channel.type).toBeDefined();
      expect(typeof channel.isEnabled()).toBe('boolean');
    });

    it('should create all channel types using factory', () => {
      const channels = ValueObjectFactory.createAllChannelTypes();

      expect(channels.length).toBe(Object.values(ChannelType).length);
      
      const types = channels.map(channel => channel.type);
      const uniqueTypes = new Set(types);
      
      expect(uniqueTypes.size).toBe(Object.values(ChannelType).length);
    });

    it('should create enabled channels using factory', () => {
      const channels = ValueObjectFactory.createEnabledChannels();

      expect(channels.length).toBeGreaterThan(0);
      channels.forEach(channel => {
        expect(channel.isEnabled()).toBe(true);
      });
    });
  });

  describe('Channel Types', () => {
    it('should support all defined channel types', () => {
      const channelTypes = Object.values(ChannelType);

      channelTypes.forEach(type => {
        if (type === ChannelType.WEBHOOK) {
          // WEBHOOK requires URL configuration
          expect(() => NotificationChannel.create(type, true, { url: 'https://example.com' })).not.toThrow();
        } else {
          expect(() => NotificationChannel.create(type, true)).not.toThrow();
        }
      });
    });
  });

  describe('Configuration', () => {
    it('should accept configuration object', () => {
      const config = {
        retryAttempts: 3,
        timeout: 5000,
        priority: 'high',
      };

      const channel = NotificationChannel.create(ChannelType.EMAIL, true, config);

      expect(channel.config).toEqual(config);
      expect(channel.type).toBe(ChannelType.EMAIL);
      expect(channel.isEnabled()).toBe(true);
    });

    it('should handle undefined configuration', () => {
      const channel = NotificationChannel.create(ChannelType.EMAIL, true);

      expect(channel.config).toBeUndefined();
    });

    it('should handle empty configuration object', () => {
      const channel = NotificationChannel.create(ChannelType.EMAIL, true, {});

      expect(channel.config).toEqual({});
    });

    it('should preserve configuration when creating channels', () => {
      const config = {
        template: 'welcome',
        priority: 'high',
        retryAttempts: 3,
      };

      const channel = NotificationChannel.create(ChannelType.EMAIL, true, config);

      expect(channel.config).toEqual(config);
    });

    it('should update configuration immutably', () => {
      const originalConfig = { timeout: 5000 };
      const channel = NotificationChannel.create(ChannelType.EMAIL, true, originalConfig);
      
      const newConfig = { timeout: 10000, retries: 3 };
      const updatedChannel = channel.updateConfig(newConfig);

      expect(channel.config).toEqual(originalConfig);
      expect(updatedChannel.config).toEqual({ ...originalConfig, ...newConfig });
    });
  });

  describe('Static Factory Methods', () => {
    it('should create IN_APP channel using static method', () => {
      const channel = NotificationChannel.inApp();

      expect(channel.type).toBe(ChannelType.IN_APP);
      expect(channel.isEnabled()).toBe(true);
    });

    it('should create EMAIL channel using static method', () => {
      const config = { template: 'welcome', priority: 'high' };
      const channel = NotificationChannel.email(config);

      expect(channel.type).toBe(ChannelType.EMAIL);
      expect(channel.isEnabled()).toBe(true);
      expect(channel.config).toEqual(config);
    });

    it('should create PUSH channel using static method', () => {
      const config = { sound: 'default', badge: 1 };
      const channel = NotificationChannel.push(config);

      expect(channel.type).toBe(ChannelType.PUSH);
      expect(channel.isEnabled()).toBe(true);
      expect(channel.config).toEqual(config);
    });

    it('should create SMS channel using static method', () => {
      const config = { provider: 'twilio' };
      const channel = NotificationChannel.sms(config);

      expect(channel.type).toBe(ChannelType.SMS);
      expect(channel.isEnabled()).toBe(true);
      expect(channel.config).toEqual(config);
    });

    it('should create WEBHOOK channel using static method', () => {
      const config = { url: 'https://example.com/webhook', method: 'POST' };
      const channel = NotificationChannel.webhook(config);

      expect(channel.type).toBe(ChannelType.WEBHOOK);
      expect(channel.isEnabled()).toBe(true);
      expect(channel.config).toEqual({ method: 'POST', ...config });
    });
  });

  describe('Channel State Management', () => {
    it('should enable channel', () => {
      const channel = NotificationChannel.create(ChannelType.EMAIL, false);
      const enabledChannel = channel.enable();

      expect(channel.isEnabled()).toBe(false);
      expect(enabledChannel.isEnabled()).toBe(true);
    });

    it('should disable channel', () => {
      const channel = NotificationChannel.create(ChannelType.EMAIL, true);
      const disabledChannel = channel.disable();

      expect(channel.isEnabled()).toBe(true);
      expect(disabledChannel.isEnabled()).toBe(false);
    });
  });

  describe('Channel Properties', () => {
    it('should identify channels requiring external service', () => {
      const inAppChannel = NotificationChannel.create(ChannelType.IN_APP, true);
      const emailChannel = NotificationChannel.create(ChannelType.EMAIL, true);
      const pushChannel = NotificationChannel.create(ChannelType.PUSH, true);
      const smsChannel = NotificationChannel.create(ChannelType.SMS, true);
      const webhookChannel = NotificationChannel.create(ChannelType.WEBHOOK, true, { url: 'https://example.com' });

      expect(inAppChannel.requiresExternalService()).toBe(false);
      expect(emailChannel.requiresExternalService()).toBe(true);
      expect(pushChannel.requiresExternalService()).toBe(true);
      expect(smsChannel.requiresExternalService()).toBe(true);
      expect(webhookChannel.requiresExternalService()).toBe(true);
    });
  });

  describe('Value Object Equality', () => {
    it('should be equal when all properties are the same', () => {
      const config = { timeout: 5000 };
      const channel1 = NotificationChannel.create(ChannelType.EMAIL, true, config);
      const channel2 = NotificationChannel.create(ChannelType.EMAIL, true, config);

      expect(channel1.equals(channel2)).toBe(true);
    });

    it('should not be equal when type differs', () => {
      const channel1 = NotificationChannel.create(ChannelType.EMAIL, true);
      const channel2 = NotificationChannel.create(ChannelType.PUSH, true);

      expect(channel1.equals(channel2)).toBe(false);
    });

    it('should not be equal when enabled status differs', () => {
      const channel1 = NotificationChannel.create(ChannelType.EMAIL, true);
      const channel2 = NotificationChannel.create(ChannelType.EMAIL, false);

      expect(channel1.equals(channel2)).toBe(false);
    });

    it('should not be equal when configuration differs', () => {
      const config1 = { timeout: 5000 };
      const config2 = { timeout: 10000 };
      const channel1 = NotificationChannel.create(ChannelType.EMAIL, true, config1);
      const channel2 = NotificationChannel.create(ChannelType.EMAIL, true, config2);

      expect(channel1.equals(channel2)).toBe(false);
    });

    it('should not be equal to null or undefined', () => {
      const channel = NotificationChannel.create(ChannelType.EMAIL, true);

      expect(channel.equals(null as any)).toBe(false);
      expect(channel.equals(undefined as any)).toBe(false);
    });
  });

  describe('Immutability', () => {
    it('should not modify original when enabling/disabling', () => {
      const originalChannel = NotificationChannel.create(ChannelType.EMAIL, true);
      const disabledChannel = originalChannel.disable();

      expect(originalChannel.isEnabled()).toBe(true);
      expect(disabledChannel.isEnabled()).toBe(false);
    });

    it('should not modify original when updating configuration', () => {
      const originalConfig = { timeout: 5000 };
      const originalChannel = NotificationChannel.create(ChannelType.EMAIL, true, originalConfig);
      
      const newConfig = { timeout: 10000, retries: 3 };
      const updatedChannel = originalChannel.updateConfig(newConfig);

      expect(originalChannel.config).toEqual(originalConfig);
      expect(updatedChannel.config).toEqual({ ...originalConfig, ...newConfig });
    });
  });

  describe('Validation', () => {
    it('should validate channel type in create method', () => {
      expect(() => NotificationChannel.create('invalid' as any, true))
        .toThrow(DomainError);
    });

    it('should require webhook URL for webhook channels', () => {
      expect(() => NotificationChannel.webhook({ url: '' }))
        .toThrow('Webhook URL is required');
    });

    it('should validate webhook configuration in updateConfig', () => {
      const webhookChannel = NotificationChannel.webhook({ url: 'https://example.com' });
      
      expect(() => webhookChannel.updateConfig({ url: '' }))
        .toThrow(DomainError);
    });
  });

  describe('String Representation', () => {
    it('should have string representation', () => {
      const channel = NotificationChannel.create(ChannelType.EMAIL, true);
      const stringRep = channel.toString();

      expect(typeof stringRep).toBe('string');
      expect(stringRep.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null configuration gracefully', () => {
      const channel = NotificationChannel.create(ChannelType.EMAIL, true, null as any);

      expect(channel.config).toBeUndefined();
    });

    it('should handle deeply nested configuration', () => {
      const config = {
        level1: {
          level2: {
            level3: {
              value: 'deep',
              array: [1, 2, 3],
              nested: { key: 'value' },
            },
          },
        },
      };

      const channel = NotificationChannel.create(ChannelType.EMAIL, true, config);

      expect(channel.config).toEqual(config);
    });
  });
});