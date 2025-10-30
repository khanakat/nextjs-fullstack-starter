"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useConditionalUser } from "@/components/conditional-clerk";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type {
  Notification,
  NotificationPreferences,
  RealtimeEvent,
} from "@/lib/notifications";

// Demo data for when user is not authenticated
const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: "demo-1",
    userId: "demo-user",
    title: "Welcome to the Demo!",
    message: "This is a demo notification to show how the system works.",
    type: "info",
    priority: "medium",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    channels: {
      inApp: true,
      email: false,
      push: false,
      sms: false,
    },
  },
  {
    id: "demo-2",
    userId: "demo-user",
    title: "System Update",
    message: "A new feature has been added to your dashboard.",
    type: "success",
    priority: "low",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    readAt: new Date(Date.now() - 1000 * 60 * 30), // Read 30 minutes ago
    channels: {
      inApp: true,
      email: true,
      push: false,
      sms: false,
    },
  },
];

const DEMO_PREFERENCES: NotificationPreferences = {
  userId: "demo-user",
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
  quietHours: {
    enabled: true,
    start: "22:00",
    end: "08:00",
    timezone: "UTC",
  },
  frequency: "immediate",
};

/**
 * Hook for managing user notifications
 */
export function useNotifications() {
  const { user } = useConditionalUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] =
    useState<NotificationPreferences | null>(null);
  const [error, setError] = useState<string | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch notifications from API with retry logic
  const fetchNotifications = useCallback(
    async (
      options: {
        limit?: number;
        offset?: number;
        unread?: boolean;
      } = {},
      skipErrorHandling = false,
    ) => {
      // Demo mode - return demo data immediately
      if (!user) {
        setNotifications(DEMO_NOTIFICATIONS);
        setUnreadCount(DEMO_NOTIFICATIONS.filter(n => !n.read).length);
        setPreferences(DEMO_PREFERENCES);
        setLoading(false);
        setError(null);
        retryCountRef.current = 0;
        return;
      }

      try {
        setLoading(true);
        if (!skipErrorHandling) {
          setError(null);
        }

        const params = new URLSearchParams();
        if (options.limit) params.append("limit", options.limit.toString());
        if (options.offset) params.append("offset", options.offset.toString());
        if (options.unread) params.append("unread", "true");

        const response = await fetch(`/api/notifications?${params}`, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error?.message || "Failed to fetch notifications");
        }

        setNotifications(data.data.notifications || []);
        setUnreadCount(data.data.unreadCount || 0);
        setPreferences(data.data.preferences || null);
        setError(null);
        retryCountRef.current = 0; // Reset retry count on success

        logger.info("Notifications fetched successfully", "notifications", {
          count: data.data.notifications?.length || 0,
          unreadCount: data.data.unreadCount || 0,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        
        logger.error("Error fetching notifications", "notifications", err);

        if (!skipErrorHandling) {
          // Implement exponential backoff retry
          if (retryCountRef.current < maxRetries) {
            retryCountRef.current++;
            const retryDelay = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 10000); // Max 10 seconds
            
            logger.info(`Retrying notification fetch in ${retryDelay}ms (attempt ${retryCountRef.current}/${maxRetries})`, "notifications");
            
            if (retryTimeoutRef.current) {
              clearTimeout(retryTimeoutRef.current);
            }
            
            retryTimeoutRef.current = setTimeout(() => {
              fetchNotifications(options, true); // Skip error handling on retry to prevent infinite loops
            }, retryDelay);
            
            return; // Don't set error state during retry
          }

          // Max retries reached, set error state
          setError(errorMessage);
          retryCountRef.current = 0; // Reset for next attempt
        }
      } finally {
        setLoading(false);
      }
    },
    [user, maxRetries],
  );

  // Mark notification as read
  const markAsRead = useCallback(
    async (notificationId: string) => {
      // Demo mode - update local state only
      if (!user) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId 
              ? { ...n, read: true, readAt: new Date() }
              : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        return;
      }

      try {
        const response = await fetch(`/api/notifications/${notificationId}/read`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error?.message || "Failed to mark notification as read");
        }

        // Update local state
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId
              ? { ...n, read: true, readAt: new Date() }
              : n,
          ),
        );
        setUnreadCount(prev => Math.max(0, prev - 1));

        logger.info("Notification marked as read", "notifications", {
          notificationId,
        });
      } catch (err) {
        logger.error("Error marking notification as read", "notifications", err);
        toast.error("Failed to mark notification as read");
      }
    },
    [user],
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    // Demo mode - update local state only
    if (!user) {
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true, readAt: new Date() }))
      );
      setUnreadCount(0);
      return;
    }

    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || "Failed to mark all notifications as read");
      }

      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true, readAt: new Date() })),
      );
      setUnreadCount(0);

      logger.info("All notifications marked as read", "notifications");
    } catch (err) {
      logger.error("Error marking all notifications as read", "notifications", err);
      toast.error("Failed to mark all notifications as read");
    }
  }, [user]);

  // Delete notification
  const deleteNotification = useCallback(
    async (notificationId: string) => {
      // Demo mode - update local state only
      if (!user) {
        setNotifications(prev => {
          const notification = prev.find(n => n.id === notificationId);
          const filtered = prev.filter(n => n.id !== notificationId);
          
          // Update unread count if deleted notification was unread
          if (notification && !notification.read) {
            setUnreadCount(prevCount => Math.max(0, prevCount - 1));
          }
          
          return filtered;
        });
        return;
      }

      try {
        const response = await fetch(`/api/notifications/${notificationId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error?.message || "Failed to delete notification");
        }

        // Update local state
        setNotifications(prev => {
          const notification = prev.find(n => n.id === notificationId);
          const filtered = prev.filter(n => n.id !== notificationId);
          
          // Update unread count if deleted notification was unread
          if (notification && !notification.read) {
            setUnreadCount(prevCount => Math.max(0, prevCount - 1));
          }
          
          return filtered;
        });

        logger.info("Notification deleted", "notifications", {
          notificationId,
        });
      } catch (err) {
        logger.error("Error deleting notification", "notifications", err);
        toast.error("Failed to delete notification");
      }
    },
    [user],
  );

  // Refresh notifications
  const refresh = useCallback(() => {
    retryCountRef.current = 0; // Reset retry count
    fetchNotifications();
  }, [fetchNotifications]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
    
    // Cleanup retry timeout on unmount
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    preferences,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
    fetchNotifications,
  };
}

/**
 * Hook for real-time notification updates via Server-Sent Events
 */
export function useRealtimeNotifications() {
  const { user } = useConditionalUser();
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Event handlers
  const [onNotificationCreated, setOnNotificationCreated] = useState<
    ((notification: Notification) => void) | null
  >(null);
  const [onNotificationUpdated, setOnNotificationUpdated] = useState<
    ((notification: Notification) => void) | null
  >(null);
  const [onNotificationDeleted, setOnNotificationDeleted] = useState<
    ((notificationId: string) => void) | null
  >(null);

  // Connect to SSE stream with retry logic
  const connect = useCallback(() => {
    // Don't connect if already connected or if no user (demo mode doesn't need real-time)
    if (eventSourceRef.current || !user) {
      return;
    }

    try {
      setError(null);
      
      const eventSource = new EventSource("/api/notifications/stream");
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
        logger.info("Connected to notification stream", "notifications");
      };

      eventSource.onmessage = (event) => {
        try {
          const data: RealtimeEvent = JSON.parse(event.data);

          switch (data.type) {
            case "connection":
              logger.info("SSE connection confirmed", "notifications", data);
              break;

            case "heartbeat":
              // Silent heartbeat
              break;

            case "notification:created":
              if (onNotificationCreated && data.data) {
                onNotificationCreated(data.data as Notification);
              }
              break;

            case "notification:updated":
              if (onNotificationUpdated && data.data) {
                onNotificationUpdated(data.data as Notification);
              }
              break;

            case "notification:deleted":
              if (onNotificationDeleted && data.data?.id) {
                onNotificationDeleted(data.data.id);
              }
              break;

            case "error":
              logger.error("SSE error event received", "notifications", data);
              setError(data.message || "Stream error");
              break;

            default:
              logger.warn("Unknown SSE event type", "notifications", data);
          }
        } catch (err) {
          logger.error("Error parsing SSE message", "notifications", err);
        }
      };

      eventSource.onerror = (event) => {
        logger.error("SSE connection error", "notifications", event);
        setConnected(false);
        
        // Implement exponential backoff for reconnection
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current - 1), 30000); // Max 30 seconds
          
          setError(`Connection lost. Reconnecting in ${Math.ceil(delay / 1000)}s... (${reconnectAttempts.current}/${maxReconnectAttempts})`);
          
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          reconnectTimeoutRef.current = setTimeout(() => {
            disconnect();
            connect();
          }, delay);
        } else {
          setError("Connection failed. Please refresh the page.");
        }
      };
    } catch (err) {
      logger.error("Error creating SSE connection", "notifications", err);
      setError("Failed to establish real-time connection");
    }
  }, [user, onNotificationCreated, onNotificationUpdated, onNotificationDeleted, maxReconnectAttempts]);

  // Disconnect from SSE stream
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setConnected(false);
    setError(null);
    reconnectAttempts.current = 0;
  }, []);

  // Manual reconnect
  const reconnect = useCallback(() => {
    reconnectAttempts.current = 0;
    disconnect();
    connect();
  }, [disconnect, connect]);

  // Auto-connect on mount and user change
  useEffect(() => {
    if (user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [user, connect, disconnect]);

  return {
    connected,
    error,
    connect,
    disconnect,
    reconnect,
    onNotificationCreated: setOnNotificationCreated,
    onNotificationUpdated: setOnNotificationUpdated,
    onNotificationDeleted: setOnNotificationDeleted,
  };
}

/**
 * Hook for managing notification preferences
 */
export function useNotificationPreferences() {
  const { user } = useConditionalUser();
  const [preferences, setPreferences] =
    useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // Fetch preferences with retry logic
  const fetchPreferences = useCallback(async (skipErrorHandling = false) => {
    // Demo mode - return demo preferences
    if (!user) {
      setPreferences(DEMO_PREFERENCES);
      setLoading(false);
      setError(null);
      retryCountRef.current = 0;
      return;
    }

    try {
      setLoading(true);
      if (!skipErrorHandling) {
        setError(null);
      }

      const response = await fetch("/api/notifications/preferences", {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || "Failed to fetch preferences");
      }

      setPreferences(data.data.preferences);
      setError(null);
      retryCountRef.current = 0;

      logger.info("Notification preferences fetched successfully", "notifications");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      
      logger.error("Error fetching notification preferences", "notifications", err);

      if (!skipErrorHandling) {
        // Implement retry logic
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          const retryDelay = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 10000);
          
          setTimeout(() => {
            fetchPreferences(true);
          }, retryDelay);
          
          return;
        }

        setError(errorMessage);
        retryCountRef.current = 0;
      }
    } finally {
      setLoading(false);
    }
  }, [user, maxRetries]);

  // Update preferences
  const updatePreferences = useCallback(
    async (updates: Partial<NotificationPreferences>) => {
      // Demo mode - update local state only
      if (!user) {
        setPreferences(prev => prev ? { ...prev, ...updates } : null);
        toast.success("Preferences updated (demo mode)");
        return;
      }

      try {
        const response = await fetch("/api/notifications/preferences", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error?.message || "Failed to update preferences");
        }

        setPreferences(data.data.preferences);
        toast.success("Preferences updated successfully");

        logger.info("Notification preferences updated", "notifications", {
          updates: Object.keys(updates),
        });
      } catch (err) {
        logger.error("Error updating notification preferences", "notifications", err);
        toast.error("Failed to update preferences");
      }
    },
    [user],
  );

  // Refresh preferences
  const refresh = useCallback(() => {
    retryCountRef.current = 0;
    fetchPreferences();
  }, [fetchPreferences]);

  // Initial fetch
  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    preferences,
    loading,
    error,
    updatePreferences,
    refresh,
  };
}
