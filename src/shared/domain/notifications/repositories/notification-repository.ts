import { Notification, NotificationStatus, NotificationCategory, NotificationPriority } from '../entities/notification';
import { UniqueId } from '../../value-objects/unique-id';

export interface NotificationSearchCriteria {
  userId?: UniqueId;
  organizationId?: UniqueId;
  status?: NotificationStatus;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  isRead?: boolean;
  isArchived?: boolean;
  scheduledBefore?: Date;
  scheduledAfter?: Date;
  createdBefore?: Date;
  createdAfter?: Date;
  expiresAfter?: Date;
  hasActionUrl?: boolean;
}

export interface NotificationSearchOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'priority' | 'scheduledAt' | 'readAt';
  sortOrder?: 'asc' | 'desc';
}

export interface NotificationSearchResult {
  notifications: Notification[];
  total: number;
  hasMore: boolean;
}

export interface NotificationStatistics {
  total: number;
  unread: number;
  byCategory: Record<NotificationCategory, number>;
  byPriority: Record<NotificationPriority, number>;
  byStatus: Record<NotificationStatus, number>;
}

export interface INotificationRepository {
  /**
   * Save a notification
   */
  save(notification: Notification): Promise<void>;

  /**
   * Find notification by ID
   */
  findById(id: UniqueId): Promise<Notification | null>;

  /**
   * Find notifications by user ID
   */
  findByUserId(
    userId: UniqueId,
    options?: NotificationSearchOptions
  ): Promise<NotificationSearchResult>;

  /**
   * Search notifications with criteria
   */
  search(
    criteria: NotificationSearchCriteria,
    options?: NotificationSearchOptions
  ): Promise<NotificationSearchResult>;

  /**
   * Find notifications ready for delivery (not scheduled, not expired)
   */
  findReadyForDelivery(
    limit?: number
  ): Promise<Notification[]>;

  /**
   * Find scheduled notifications that should be delivered now
   */
  findScheduledForDelivery(
    currentTime: Date,
    limit?: number
  ): Promise<Notification[]>;

  /**
   * Find expired notifications
   */
  findExpired(
    currentTime: Date,
    limit?: number
  ): Promise<Notification[]>;

  /**
   * Mark notification as read
   */
  markAsRead(id: UniqueId): Promise<void>;

  /**
   * Mark multiple notifications as read
   */
  markMultipleAsRead(ids: UniqueId[]): Promise<void>;

  /**
   * Archive notification
   */
  archive(id: UniqueId): Promise<void>;

  /**
   * Archive multiple notifications
   */
  archiveMultiple(ids: UniqueId[]): Promise<void>;

  /**
   * Delete notification
   */
  delete(id: UniqueId): Promise<void>;

  /**
   * Delete multiple notifications
   */
  deleteMultiple(ids: UniqueId[]): Promise<void>;

  /**
   * Count notifications by criteria
   */
  count(criteria: NotificationSearchCriteria): Promise<number>;

  /**
   * Check if notification exists
   */
  exists(id: UniqueId): Promise<boolean>;

  /**
   * Get notification statistics for user
   */
  getStatistics(userId: UniqueId): Promise<NotificationStatistics>;

  /**
   * Get notification statistics for organization
   */
  getOrganizationStatistics(organizationId: UniqueId): Promise<NotificationStatistics>;

  /**
   * Clean up old archived notifications
   */
  cleanupOldNotifications(olderThan: Date): Promise<number>;

  /**
   * Get unread count for user
   */
  getUnreadCount(userId: UniqueId): Promise<number>;

  /**
   * Get notifications for real-time streaming
   */
  findForStreaming(
    userId: UniqueId,
    lastEventId?: string
  ): Promise<Notification[]>;
}