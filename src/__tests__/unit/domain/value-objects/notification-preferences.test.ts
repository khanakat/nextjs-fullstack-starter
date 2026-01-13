import { 
  NotificationPreferences, 
  CategoryPreference 
} from '../../../../shared/domain/notifications/value-objects/notification-preferences';
import { NotificationCategory } from '../../../../shared/domain/notifications/entities/notification';
import { ChannelType } from '../../../../shared/domain/notifications/value-objects/notification-channel';
import { DomainError } from '../../../../shared/domain/exceptions/domain-error';

describe('NotificationPreferences Value Object', () => {
  const validUserId = 'user-123';
  const validCategoryPreference: CategoryPreference = {
    category: NotificationCategory.SECURITY,
    enabled: true,
    channels: [ChannelType.EMAIL, ChannelType.IN_APP]
  };

  describe('create', () => {
    it('should create notification preferences with valid data', () => {
      const preferences = NotificationPreferences.create(
        validUserId,
        true,
        [validCategoryPreference],
        [ChannelType.EMAIL, ChannelType.IN_APP],
        {
          start: '22:00',
          end: '08:00',
          timezone: 'UTC'
        },
        {
          enabled: true,
          frequency: 'daily',
          time: '09:00'
        },
        'en',
        'UTC'
      );

      expect(preferences.userId).toBe(validUserId);
      expect(preferences.globalEnabled).toBe(true);
      expect(preferences.categoryPreferences).toHaveLength(6); // All categories should be present
      expect(preferences.defaultChannels).toEqual([ChannelType.EMAIL, ChannelType.IN_APP]);
      expect(preferences.language).toBe('en');
      expect(preferences.timezone).toBe('UTC');
    });

    it('should create preferences with minimal required data', () => {
      const preferences = NotificationPreferences.create(validUserId);

      expect(preferences.userId).toBe(validUserId);
      expect(preferences.globalEnabled).toBe(true);
      expect(preferences.categoryPreferences).toHaveLength(6); // All categories with defaults
      expect(preferences.defaultChannels).toEqual([ChannelType.IN_APP]);
      expect(preferences.language).toBe('en');
      expect(preferences.timezone).toBe('UTC');
    });

    it('should ensure all categories have preferences', () => {
      const preferences = NotificationPreferences.create(
        validUserId,
        true,
        [validCategoryPreference], // Only one category provided
        [ChannelType.EMAIL]
      );

      expect(preferences.categoryPreferences).toHaveLength(6);
      
      const categories = preferences.categoryPreferences.map(p => p.category);
      expect(categories).toContain(NotificationCategory.SECURITY);
      expect(categories).toContain(NotificationCategory.SYSTEM);
      expect(categories).toContain(NotificationCategory.BILLING);
      expect(categories).toContain(NotificationCategory.MARKETING);
      expect(categories).toContain(NotificationCategory.REPORT);
      expect(categories).toContain(NotificationCategory.USER);
    });

    it('should throw error for invalid user ID', () => {
      expect(() => NotificationPreferences.create('')).toThrow(DomainError);
      expect(() => NotificationPreferences.create('   ')).toThrow(DomainError);
    });

    it('should throw error for empty default channels', () => {
      expect(() => NotificationPreferences.create(validUserId, true, [], []))
        .toThrow(DomainError);
    });

    it('should throw error for invalid quiet hours', () => {
      expect(() => NotificationPreferences.create(
        validUserId,
        true,
        [],
        [ChannelType.EMAIL],
        {
          start: '25:00', // Invalid hour
          end: '08:00',
          timezone: 'UTC'
        }
      )).toThrow(DomainError);

      expect(() => NotificationPreferences.create(
        validUserId,
        true,
        [],
        [ChannelType.EMAIL],
        {
          start: '22:00',
          end: '08:00',
          timezone: 'INVALID_TIMEZONE'
        }
      )).toThrow(DomainError);
    });

    it('should throw error for invalid email digest', () => {
      expect(() => NotificationPreferences.create(
        validUserId,
        true,
        [],
        [ChannelType.EMAIL],
        undefined,
        {
          enabled: true,
          frequency: 'invalid' as any,
          time: '09:00'
        }
      )).toThrow(DomainError);

      expect(() => NotificationPreferences.create(
        validUserId,
        true,
        [],
        [ChannelType.EMAIL],
        undefined,
        {
          enabled: true,
          frequency: 'daily',
          time: '25:00' // Invalid time
        }
      )).toThrow(DomainError);
    });
  });

  describe('createDefault', () => {
    it('should create default preferences', () => {
      const preferences = NotificationPreferences.createDefault(validUserId);

      expect(preferences.userId).toBe(validUserId);
      expect(preferences.globalEnabled).toBe(true);
      expect(preferences.defaultChannels).toEqual([ChannelType.IN_APP, ChannelType.EMAIL]);
      expect(preferences.emailDigest?.enabled).toBe(true);
      expect(preferences.emailDigest?.frequency).toBe('daily');
      expect(preferences.emailDigest?.time).toBe('09:00');
      expect(preferences.language).toBe('en');
      expect(preferences.timezone).toBe('UTC');
    });
  });

  describe('updateCategoryPreference', () => {
    it('should update existing category preference', () => {
      const preferences = NotificationPreferences.createDefault(validUserId);
      const newChannels = [ChannelType.EMAIL];

      const updated = preferences.updateCategoryPreference(
        NotificationCategory.SECURITY,
        false,
        newChannels
      );

      expect(updated).not.toBe(preferences); // Immutable
      
      const securityPref = updated.categoryPreferences.find(
        p => p.category === NotificationCategory.SECURITY
      );
      expect(securityPref?.enabled).toBe(false);
      expect(securityPref?.channels).toEqual(newChannels);
    });

    it('should throw error when no channels provided', () => {
      const preferences = NotificationPreferences.createDefault(validUserId);

      expect(() => preferences.updateCategoryPreference(
        NotificationCategory.SECURITY,
        true,
        []
      )).toThrow(DomainError);
    });
  });

  describe('global notifications', () => {
    it('should enable global notifications', () => {
      const preferences = NotificationPreferences.create(validUserId, false);
      const updated = preferences.enableGlobalNotifications();

      expect(updated).not.toBe(preferences);
      expect(updated.globalEnabled).toBe(true);
      expect(preferences.globalEnabled).toBe(false); // Original unchanged
    });

    it('should disable global notifications', () => {
      const preferences = NotificationPreferences.create(validUserId, true);
      const updated = preferences.disableGlobalNotifications();

      expect(updated).not.toBe(preferences);
      expect(updated.globalEnabled).toBe(false);
      expect(preferences.globalEnabled).toBe(true); // Original unchanged
    });
  });

  describe('updateQuietHours', () => {
    it('should update quiet hours', () => {
      const preferences = NotificationPreferences.createDefault(validUserId);
      const newQuietHours = {
        start: '23:00',
        end: '07:00',
        timezone: 'America/New_York'
      };

      const updated = preferences.updateQuietHours(newQuietHours);

      expect(updated).not.toBe(preferences);
      expect(updated.quietHours).toEqual(newQuietHours);
    });

    it('should remove quiet hours when undefined', () => {
      const preferences = NotificationPreferences.create(
        validUserId,
        true,
        [],
        [ChannelType.EMAIL],
        {
          start: '22:00',
          end: '08:00',
          timezone: 'UTC'
        }
      );

      const updated = preferences.updateQuietHours(undefined);

      expect(updated.quietHours).toBeUndefined();
    });

    it('should validate quiet hours format', () => {
      const preferences = NotificationPreferences.createDefault(validUserId);

      expect(() => preferences.updateQuietHours({
        start: 'invalid',
        end: '08:00',
        timezone: 'UTC'
      })).toThrow(DomainError);
    });
  });

  describe('updateEmailDigest', () => {
    it('should update email digest settings', () => {
      const preferences = NotificationPreferences.createDefault(validUserId);
      const newDigest = {
        enabled: false,
        frequency: 'weekly' as const,
        time: '18:00'
      };

      const updated = preferences.updateEmailDigest(newDigest);

      expect(updated).not.toBe(preferences);
      expect(updated.emailDigest).toEqual(newDigest);
    });

    it('should validate email digest settings', () => {
      const preferences = NotificationPreferences.createDefault(validUserId);

      expect(() => preferences.updateEmailDigest({
        enabled: true,
        frequency: 'invalid' as any,
        time: '09:00'
      })).toThrow(DomainError);
    });
  });

  describe('updateLanguage', () => {
    it('should update language', () => {
      const preferences = NotificationPreferences.createDefault(validUserId);
      const updated = preferences.updateLanguage('es');

      expect(updated).not.toBe(preferences);
      expect(updated.language).toBe('es');
      expect(preferences.language).toBe('en'); // Original unchanged
    });

    it('should validate language format', () => {
      const preferences = NotificationPreferences.createDefault(validUserId);

      expect(() => preferences.updateLanguage('')).toThrow(DomainError);
      expect(() => preferences.updateLanguage('invalid-lang')).toThrow(DomainError);
    });
  });

  describe('updateTimezone', () => {
    it('should update timezone', () => {
      const preferences = NotificationPreferences.createDefault(validUserId);
      const updated = preferences.updateTimezone('America/New_York');

      expect(updated).not.toBe(preferences);
      expect(updated.timezone).toBe('America/New_York');
      expect(preferences.timezone).toBe('UTC'); // Original unchanged
    });

    it('should validate timezone format', () => {
      const preferences = NotificationPreferences.createDefault(validUserId);

      expect(() => preferences.updateTimezone('')).toThrow(DomainError);
      expect(() => preferences.updateTimezone('Invalid/Timezone')).toThrow(DomainError);
    });
  });

  describe('query methods', () => {
    it('should check if category is enabled', () => {
      const preferences = NotificationPreferences.createDefault(validUserId);
      
      expect(preferences.isCategoryEnabled(NotificationCategory.SECURITY)).toBe(true);
      
      const updated = preferences.updateCategoryPreference(
        NotificationCategory.SECURITY,
        false,
        [ChannelType.EMAIL]
      );
      
      expect(updated.isCategoryEnabled(NotificationCategory.SECURITY)).toBe(false);
    });

    it('should check if channel is enabled for category', () => {
      const preferences = NotificationPreferences.createDefault(validUserId);
      
      expect(preferences.isChannelEnabledForCategory(
        NotificationCategory.SECURITY,
        ChannelType.EMAIL
      )).toBe(true);
      
      const updated = preferences.updateCategoryPreference(
        NotificationCategory.SECURITY,
        true,
        [ChannelType.IN_APP] // Remove EMAIL
      );
      
      expect(updated.isChannelEnabledForCategory(
        NotificationCategory.SECURITY,
        ChannelType.EMAIL
      )).toBe(false);
    });

    it('should check if in quiet hours', () => {
      const preferences = NotificationPreferences.create(
        validUserId,
        true,
        [],
        [ChannelType.EMAIL],
        {
          start: '22:00',
          end: '08:00',
          timezone: 'UTC'
        }
      );

      // Test with a specific time that should be in quiet hours
      const testDate = new Date('2024-01-01T23:30:00Z'); // 23:30 UTC should be in 22:00-08:00 range

      expect(preferences.isInQuietHours(testDate)).toBe(true);
    });

    it('should return false for quiet hours when not configured', () => {
      const preferences = NotificationPreferences.createDefault(validUserId);
      
      expect(preferences.isInQuietHours()).toBe(false);
    });
  });

  describe('getters', () => {
    it('should return immutable copies of arrays and objects', () => {
      const preferences = NotificationPreferences.createDefault(validUserId);
      
      const categoryPrefs = preferences.categoryPreferences;
      const defaultChannels = preferences.defaultChannels;
      const quietHours = preferences.quietHours;
      const emailDigest = preferences.emailDigest;

      // Modify returned arrays/objects
      categoryPrefs.push({
        category: 'INVALID' as any,
        enabled: true,
        channels: []
      });
      defaultChannels.push('INVALID' as any);
      
      if (quietHours) {
        quietHours.start = 'modified';
      }
      
      if (emailDigest) {
        emailDigest.frequency = 'never';
      }

      // Original should be unchanged
      expect(preferences.categoryPreferences).toHaveLength(6);
      expect(preferences.defaultChannels).toHaveLength(2);
      expect(preferences.quietHours).toBeUndefined();
      expect(preferences.emailDigest?.frequency).toBe('daily');
    });
  });

  describe('equality', () => {
    it('should be equal to another preferences with same properties', () => {
      const preferences1 = NotificationPreferences.createDefault(validUserId);
      const preferences2 = NotificationPreferences.createDefault(validUserId);

      expect(preferences1.equals(preferences2)).toBe(true);
    });

    it('should not be equal to preferences with different properties', () => {
      const preferences1 = NotificationPreferences.createDefault(validUserId);
      const preferences2 = preferences1.disableGlobalNotifications();

      expect(preferences1.equals(preferences2)).toBe(false);
    });

    it('should not be equal to preferences with different user ID', () => {
      const preferences1 = NotificationPreferences.createDefault('user1');
      const preferences2 = NotificationPreferences.createDefault('user2');

      expect(preferences1.equals(preferences2)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle all notification categories', () => {
      const preferences = NotificationPreferences.createDefault(validUserId);
      const allCategories = Object.values(NotificationCategory);

      expect(preferences.categoryPreferences).toHaveLength(allCategories.length);
      
      allCategories.forEach(category => {
        const pref = preferences.categoryPreferences.find(p => p.category === category);
        expect(pref).toBeDefined();
        expect(pref?.enabled).toBe(true);
      });
    });

    it('should handle all channel types', () => {
      const allChannels = Object.values(ChannelType);
      const preferences = NotificationPreferences.create(
        validUserId,
        true,
        [],
        allChannels
      );

      expect(preferences.defaultChannels).toEqual(allChannels);
    });

    it('should handle timezone edge cases', () => {
      const preferences = NotificationPreferences.create(
        validUserId,
        true,
        [],
        [ChannelType.EMAIL],
        undefined,
        undefined,
        'en',
        'Pacific/Kiritimati' // UTC+14
      );

      expect(preferences.timezone).toBe('Pacific/Kiritimati');
    });
  });
});