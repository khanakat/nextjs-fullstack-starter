/**
 * Real-time Notifications System
 * Provides centralized notification management with multiple delivery channels:
 * - In-app notifications (toast, badge, modal)
 * - Real-time updates via Server-Sent Events (SSE)
 * - WebSocket support for live features
 * - Email notifications (integration with existing email system)
 * - Push notifications (browser API)
 */

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error" | "system";
  priority: "low" | "medium" | "high" | "urgent";

  // Metadata
  data?: Record<string, any>;
  actionUrl?: string;
  actionLabel?: string;

  // State
  read: boolean;
  createdAt: Date;
  readAt?: Date;

  // Delivery channels
  channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
    sms?: boolean;
  };

  // Scheduling
  deliverAt?: Date;
  expiresAt?: Date;
  // Delivery status lifecycle
  status?: "scheduled" | "delivered" | "read";
}

export interface NotificationPreferences {
  userId: string;
  channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  categories: {
    security: boolean;
    updates: boolean;
    marketing: boolean;
    system: boolean;
    billing: boolean;
  };
  frequency: "immediate" | "hourly" | "daily" | "weekly";
  quietHours: {
    enabled: boolean;
    start: string; // "22:00"
    end: string; // "08:00"
    timezone: string;
  };
}

export interface RealtimeEvent {
  id: string;
  type: string;
  userId?: string; // null for broadcast events
  data: any;
  timestamp: Date;
  channels?: string[]; // specific channels to send to
}

/**
 * In-memory storage for development
 * In production, use Redis or similar for scalability
 */
class NotificationStore {
  private notifications: Map<string, Notification> = new Map();
  private preferences: Map<string, NotificationPreferences> = new Map();
  private subscribers: Map<string, Set<(event: RealtimeEvent) => void>> =
    new Map();

  // Notification CRUD operations
  async createNotification(
    notification: Omit<Notification, "id" | "createdAt">,
  ): Promise<Notification> {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      status: notification.deliverAt ? "scheduled" : notification.read ? "read" : "delivered",
    };

    this.notifications.set(newNotification.id, newNotification);

    // Send real-time event
    this.broadcastEvent({
      id: `event_${Date.now()}`,
      type: "notification:created",
      userId: newNotification.userId,
      data: newNotification,
      timestamp: new Date(),
    });

    return newNotification;
  }

  async getNotificationById(notificationId: string): Promise<Notification | null> {
    return this.notifications.get(notificationId) || null;
  }

  async getUserNotifications(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
      type?: Notification["type"];
      status?: "scheduled" | "delivered" | "read";
    } = {},
  ): Promise<Notification[]> {
    const { limit = 50, offset = 0, unreadOnly = false, type, status } = options;

    const userNotifications = Array.from(this.notifications.values())
      .filter((n) => n.userId === userId)
      .filter((n) => !unreadOnly || !n.read)
      .filter((n) => !type || n.type === type)
      .filter((n) => !status || n.status === status)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);

    return userNotifications;
  }

  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const notification = this.notifications.get(notificationId);

    if (!notification || notification.userId !== userId) {
      return false;
    }

    notification.read = true;
    notification.readAt = new Date();
    notification.status = "read";

    // Broadcast update
    this.broadcastEvent({
      id: `event_${Date.now()}`,
      type: "notification:read",
      userId,
      data: { notificationId },
      timestamp: new Date(),
    });

    return true;
  }

  async markManyAsRead(notificationIds: string[], userId: string): Promise<number> {
    let updated = 0;
    for (const id of notificationIds) {
      const n = this.notifications.get(id);
      if (n && n.userId === userId && !n.read) {
        n.read = true;
        n.readAt = new Date();
        n.status = "read";
        updated++;
      }
    }
    if (updated > 0) {
      this.broadcastEvent({
        id: `event_${Date.now()}`,
        type: "notifications:bulk_read",
        userId,
        data: { updated, notificationIds },
        timestamp: new Date(),
      });
    }
    return updated;
  }

  async markAllAsRead(userId: string): Promise<number> {
    let count = 0;

    for (const notification of this.notifications.values()) {
      if (notification.userId === userId && !notification.read) {
        notification.read = true;
        notification.readAt = new Date();
        count++;
      }
    }

    if (count > 0) {
      this.broadcastEvent({
        id: `event_${Date.now()}`,
        type: "notifications:all_read",
        userId,
        data: { count },
        timestamp: new Date(),
      });
    }

    return count;
  }

  async deleteNotification(
    notificationId: string,
    userId: string,
  ): Promise<boolean> {
    const notification = this.notifications.get(notificationId);

    if (!notification || notification.userId !== userId) {
      return false;
    }

    this.notifications.delete(notificationId);

    this.broadcastEvent({
      id: `event_${Date.now()}`,
      type: "notification:deleted",
      userId,
      data: { notificationId },
      timestamp: new Date(),
    });

    return true;
  }

  // Preferences management
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    const existing = this.preferences.get(userId);

    if (existing) {
      return existing;
    }

    // Default preferences
    const defaultPrefs: NotificationPreferences = {
      userId,
      channels: {
        inApp: true,
        email: true,
        push: false,
        sms: false,
      },
      categories: {
        security: true,
        updates: true,
        marketing: false,
        system: true,
        billing: true,
      },
      frequency: "immediate",
      quietHours: {
        enabled: false,
        start: "22:00",
        end: "08:00",
        timezone: "UTC",
      },
    };

    this.preferences.set(userId, defaultPrefs);
    return defaultPrefs;
  }

  async updateUserPreferences(
    userId: string,
    updates: Partial<NotificationPreferences>,
  ): Promise<NotificationPreferences> {
    const current = await this.getUserPreferences(userId);
    const updated = { ...current, ...updates };

    this.preferences.set(userId, updated);

    this.broadcastEvent({
      id: `event_${Date.now()}`,
      type: "preferences:updated",
      userId,
      data: updated,
      timestamp: new Date(),
    });

    return updated;
  }

  // Real-time event system
  subscribe(
    userId: string,
    callback: (event: RealtimeEvent) => void,
  ): () => void {
    if (!this.subscribers.has(userId)) {
      this.subscribers.set(userId, new Set());
    }

    this.subscribers.get(userId)!.add(callback);

    // Return unsubscribe function
    return () => {
      const userSubscribers = this.subscribers.get(userId);
      if (userSubscribers) {
        userSubscribers.delete(callback);
        if (userSubscribers.size === 0) {
          this.subscribers.delete(userId);
        }
      }
    };
  }

  private broadcastEvent(event: RealtimeEvent): void {
    // Send to specific user
    if (event.userId) {
      const userSubscribers = this.subscribers.get(event.userId);
      if (userSubscribers) {
        userSubscribers.forEach((callback) => {
          try {
            callback(event);
          } catch (error) {
            console.error("Error broadcasting event to subscriber:", error);
          }
        });
      }
    } else {
      // Broadcast to all subscribers
      this.subscribers.forEach((userSubscribers) => {
        userSubscribers.forEach((callback) => {
          try {
            callback(event);
          } catch (error) {
            console.error("Error broadcasting event to subscriber:", error);
          }
        });
      });
    }
  }

  // Utility methods
  async getUnreadCount(userId: string): Promise<number> {
    return Array.from(this.notifications.values()).filter(
      (n) => n.userId === userId && !n.read,
    ).length;
  }

  async getTotalCount(userId: string, status?: "scheduled" | "delivered" | "read"): Promise<number> {
    return Array.from(this.notifications.values()).filter(
      (n) => n.userId === userId && (!status || n.status === status),
    ).length;
  }

  async cleanup(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    let deletedCount = 0;

    for (const [id, notification] of this.notifications.entries()) {
      if (notification.createdAt < cutoffDate && notification.read) {
        this.notifications.delete(id);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Test-only helper: reset in-memory store between tests
   */
  resetForTests(): void {
    this.notifications.clear();
    this.preferences.clear();
    this.subscribers.clear();
  }
}

// Singleton instance
const notificationStore = new NotificationStore();

/**
 * Notification Service - High-level API
 */
export class NotificationService {
  /**
   * Send a notification to a user
   */
  static async notify(
    userId: string,
    notification: Omit<Notification, "id" | "userId" | "createdAt" | "read">,
  ): Promise<Notification> {
    const preferences = await notificationStore.getUserPreferences(userId);

    // Check if user wants this type of notification
    const categoryEnabled = this.isCategoryEnabled(
      notification.type,
      preferences,
    );
    if (!categoryEnabled) {
      // Still create the notification but mark as read
      return notificationStore.createNotification({
        ...notification,
        userId,
        read: true,
      });
    }

    // Check quiet hours
    if (this.isQuietHours(preferences)) {
      // Delay delivery
      const deliverAt = this.getNextDeliveryTime(preferences);
      return notificationStore.createNotification({
        ...notification,
        userId,
        read: false,
        deliverAt,
      });
    }

    return notificationStore.createNotification({
      ...notification,
      userId,
      read: false,
    });
  }

  /**
   * Send system-wide notification
   */
  static async broadcast(
    notification: Omit<Notification, "id" | "userId" | "createdAt" | "read">,
    userIds?: string[],
  ): Promise<Notification[]> {
    // If no specific users, you'd get all user IDs from your user service
    // For demo purposes, we'll just create notifications for provided users
    if (!userIds || userIds.length === 0) {
      return [];
    }

    const notifications = await Promise.all(
      userIds.map((userId) => this.notify(userId, notification)),
    );

    return notifications;
  }

  /**
   * Quick notification helpers
   */
  static async notifySuccess(
    userId: string,
    title: string,
    message: string,
    actionUrl?: string,
  ) {
    return this.notify(userId, {
      title,
      message,
      type: "success",
      priority: "medium",
      channels: {
        inApp: true,
        email: false,
        push: false,
      },
      actionUrl,
    });
  }

  static async notifyError(
    userId: string,
    title: string,
    message: string,
    data?: any,
  ) {
    return this.notify(userId, {
      title,
      message,
      type: "error",
      priority: "high",
      data,
      channels: {
        inApp: true,
        email: true,
        push: true,
      },
    });
  }

  static async notifySecurityAlert(
    userId: string,
    title: string,
    message: string,
  ) {
    return this.notify(userId, {
      title,
      message,
      type: "warning",
      priority: "urgent",
      channels: {
        inApp: true,
        email: true,
        push: true,
      },
    });
  }

  // Helper methods
  private static isCategoryEnabled(
    type: Notification["type"],
    prefs: NotificationPreferences,
  ): boolean {
    switch (type) {
      case "error":
      case "warning":
        return prefs.categories.security;
      case "system":
        return prefs.categories.system;
      case "info":
        return prefs.categories.updates;
      case "success":
        return true; // Always show success notifications
      default:
        return true;
    }
  }

  private static isQuietHours(prefs: NotificationPreferences): boolean {
    if (!prefs.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM

    return (
      currentTime >= prefs.quietHours.start ||
      currentTime <= prefs.quietHours.end
    );
  }

  private static getNextDeliveryTime(prefs: NotificationPreferences): Date {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [hours, minutes] = prefs.quietHours.end.split(":").map(Number);
    tomorrow.setHours(hours, minutes, 0, 0);

    return tomorrow;
  }
}

// Export the store for direct access if needed
export { notificationStore };
