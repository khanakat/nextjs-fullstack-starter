import { injectable } from 'inversify';
import { Notification, NotificationCategory, NotificationPriority } from '../entities/notification';
import { NotificationPreferences } from '../value-objects/notification-preferences';
import { NotificationChannel, ChannelType } from '../value-objects/notification-channel';
import { ValidationError } from '../../exceptions/validation-error';

export interface NotificationRoutingDecision {
  shouldDeliver: boolean;
  channels: NotificationChannel[];
  reason?: string;
  delayUntil?: Date;
}

@injectable()
export class NotificationRoutingService {
  /**
   * Determine how a notification should be routed based on user preferences
   */
  public static routeNotification(
    notification: Notification,
    preferences: NotificationPreferences
  ): NotificationRoutingDecision {
    // Check if global notifications are disabled
    if (!preferences.globalEnabled) {
      return {
        shouldDeliver: false,
        channels: [],
        reason: 'Global notifications disabled'
      };
    }

    // Check if category is enabled
    if (!preferences.isCategoryEnabled(notification.category)) {
      return {
        shouldDeliver: false,
        channels: [],
        reason: `Category ${notification.category} disabled`
      };
    }

    // Check if notification is expired
    if (notification.isExpired()) {
      return {
        shouldDeliver: false,
        channels: [],
        reason: 'Notification expired'
      };
    }

    // Check if notification is scheduled for future
    if (notification.isScheduled()) {
      return {
        shouldDeliver: false,
        channels: [],
        reason: 'Notification scheduled for future',
        delayUntil: notification.scheduledAt
      };
    }

    // Check quiet hours
    const currentTime = new Date();
    if (preferences.isInQuietHours(currentTime)) {
      // During quiet hours, only deliver urgent notifications via in-app
      if (notification.priority === NotificationPriority.URGENT) {
        // Urgent notifications should only be delivered via IN_APP during quiet hours,
        // regardless of user preferences (filter strictly to IN_APP)
        const inAppChannels = notification.channels.filter(
          channel => channel.type === ChannelType.IN_APP && channel.isEnabled()
        );

        return {
          shouldDeliver: inAppChannels.length > 0,
          channels: inAppChannels,
          reason: 'Urgent notification during quiet hours - in-app only'
        };
      }

      return {
        shouldDeliver: false,
        channels: [],
        reason: 'quiet hours active',
        delayUntil: this.calculateQuietHoursEnd(currentTime, preferences)
      };
    }

    // Get preferred channels for this category
    const preferredChannelTypes = preferences.getChannelsForCategory(notification.category);
    
    // Filter notification channels based on user preferences
    const allowedChannels = notification.channels.filter(channel =>
      preferredChannelTypes.includes(channel.type) && channel.isEnabled()
    );

    if (allowedChannels.length === 0) {
      return {
        shouldDeliver: false,
        channels: [],
        reason: 'No matching channels for category'
      };
    }

    return {
      shouldDeliver: true,
      channels: allowedChannels
    };
  }

  /**
   * Determine delivery priority based on notification and user context
   */
  public static determineDeliveryPriority(
    notification: Notification,
    preferences: NotificationPreferences
  ): 'immediate' | 'batched' | 'scheduled' {
    // Urgent notifications are always immediate
    if (notification.priority === NotificationPriority.URGENT) {
      return 'immediate';
    }

    // High priority notifications during business hours
    if (notification.priority === NotificationPriority.HIGH && !preferences.isInQuietHours(new Date())) {
      return 'immediate';
    }

    // Security notifications are always immediate
    if (notification.category === NotificationCategory.SECURITY) {
      return 'immediate';
    }

    // System notifications during quiet hours can be batched
    if (notification.category === NotificationCategory.SYSTEM && preferences.isInQuietHours(new Date())) {
      return 'batched';
    }

    // Marketing notifications are usually batched
    if (notification.category === NotificationCategory.MARKETING) {
      return 'batched';
    }

    // Default to immediate for other cases
    return 'immediate';
  }

  /**
   * Check if notification should be included in email digest
   */
  public static shouldIncludeInDigest(
    notification: Notification,
    preferences: NotificationPreferences
  ): boolean {
    const emailDigest = preferences.emailDigest;
    
    if (!emailDigest || !emailDigest.enabled || emailDigest.frequency === 'never') {
      return false;
    }

    // Don't include urgent notifications in digest (they should be sent immediately)
    if (notification.priority === NotificationPriority.URGENT) {
      return false;
    }

    // Don't include security notifications in digest
    if (notification.category === NotificationCategory.SECURITY) {
      return false;
    }

    // Include if the category is enabled for email
    const categoryChannels = preferences.getChannelsForCategory(notification.category);
    return categoryChannels.includes(ChannelType.EMAIL);
  }

  /**
   * Calculate when quiet hours end
   */
  private static calculateQuietHoursEnd(
    currentTime: Date,
    preferences: NotificationPreferences
  ): Date | undefined {
    const quietHours = preferences.quietHours;
    if (!quietHours) return undefined;

    const endTime = new Date(currentTime);
    const [endHour, endMinute] = quietHours.end.split(':').map(Number);
    
    endTime.setHours(endHour, endMinute, 0, 0);
    
    // If end time is before current time, it means quiet hours end tomorrow
    if (endTime <= currentTime) {
      endTime.setDate(endTime.getDate() + 1);
    }

    return endTime;
  }

  /**
   * Public validation entrypoint for tests and callers
   */
  public static validateRoutingConfiguration(
    notification: Notification,
    preferences: NotificationPreferences
  ): void {
    this.validateInput(notification, preferences);
  }

  /**
   * Validate notification routing configuration
   */
  private static validateInput(
    notification: Notification,
    preferences: NotificationPreferences
  ): void {
    if (!notification) {
      throw new ValidationError('notification', 'Notification cannot be null');
    }

    if (!preferences) {
      throw new ValidationError('preferences', 'Preferences cannot be null');
    }

    if (notification.channels.length === 0) {
      throw new ValidationError('channels', 'Notification must have at least one channel');
    }

    // Validate that at least one channel is supported by user preferences
    const preferredChannelTypes = preferences.getChannelsForCategory(notification.category);
    const hasValidChannel = notification.channels.some(channel =>
      preferredChannelTypes.includes(channel.type)
    );

    if (!hasValidChannel) {
      throw new ValidationError(
        'channels',
        `No valid channels for category ${notification.category} based on user preferences`
      );
    }
  }
}