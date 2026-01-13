import { Notification } from '../entities/notification';
import { NotificationId } from '../value-objects/notification-id';

/**
 * Notification Repository Interface
 * Defines the contract for notification persistence operations
 */
export interface INotificationRepository {
  /**
   * Create a new notification
   */
  create(notification: Notification): Promise<Notification>;

  /**
   * Find notification by ID
   */
  findById(id: NotificationId): Promise<Notification | null>;

  /**
   * Find notifications by user ID
   */
  findByUserId(userId: string, options?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
    type?: string;
    status?: string;
  }): Promise<Notification[]>;

  /**
   * Update notification
   */
  update(notification: Notification): Promise<Notification>;

  /**
   * Delete notification
   */
  delete(id: NotificationId): Promise<boolean>;

  /**
   * Get unread count for user
   */
  getUnreadCount(userId: string): Promise<number>;

  /**
   * Mark all notifications as read for user
   */
  markAllAsRead(userId: string): Promise<number>;

  /**
   * Mark notifications as read for user
   */
  markAsRead(userId: string, notificationIds: NotificationId[]): Promise<number>;

  /**
   * Delete old notifications
   */
  deleteOldNotifications(olderThanDays: number): Promise<number>;
}
