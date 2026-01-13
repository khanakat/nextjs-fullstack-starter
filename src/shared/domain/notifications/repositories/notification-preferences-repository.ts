import { NotificationPreferences } from '../value-objects/notification-preferences';

export interface INotificationPreferencesRepository {
  /**
   * Save notification preferences
   */
  save(preferences: NotificationPreferences): Promise<void>;

  /**
   * Find preferences by user ID
   */
  findByUserId(userId: string): Promise<NotificationPreferences | null>;

  /**
   * Delete preferences by user ID
   */
  deleteByUserId(userId: string): Promise<void>;

  /**
   * Check if preferences exist for user
   */
  exists(userId: string): Promise<boolean>;

  /**
   * Get all users with email digest enabled
   */
  findUsersWithEmailDigestEnabled(): Promise<NotificationPreferences[]>;

  /**
   * Get users with specific digest frequency
   */
  findUsersByDigestFrequency(frequency: 'daily' | 'weekly'): Promise<NotificationPreferences[]>;
}