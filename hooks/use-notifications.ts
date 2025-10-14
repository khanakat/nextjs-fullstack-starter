"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import type { Notification, NotificationPreferences, RealtimeEvent } from '@/lib/notifications';

/**
 * Hook for managing user notifications
 */
export function useNotifications() {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async (options: {
    limit?: number;
    offset?: number;
    unread?: boolean;
  } = {}) => {
    if (!user) return;

    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (options.limit) params.set('limit', options.limit.toString());
      if (options.offset) params.set('offset', options.offset.toString());
      if (options.unread) params.set('unread', 'true');

      const response = await fetch(`/api/notifications?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
      setPreferences(data.preferences);

    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      // Optimistically update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, read: true, readAt: new Date() }
            : n
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));

    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'markAllAsRead' }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true, readAt: new Date() }))
      );
      setUnreadCount(0);

      toast.success('All notifications marked as read');

    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }

      // Remove from local state
      const deletedNotification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  }, [notifications]);

  // Create notification (for testing/demo)
  const createNotification = useCallback(async (notification: {
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error' | 'system';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  }) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notification),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to create notification');
      }

      // Refresh notifications to get the new one
      fetchNotifications();

    } catch (error) {
      console.error('Error creating notification:', error);
      toast.error('Failed to create notification');
    }
  }, [fetchNotifications]);

  // Load notifications on mount
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    preferences,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
  };
}

/**
 * Hook for real-time notification updates via SSE
 */
export function useRealtimeNotifications() {
  const { user } = useUser();
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const { fetchNotifications } = useNotifications();

  const connect = useCallback(() => {
    if (!user || eventSourceRef.current) return;

    try {
      const eventSource = new EventSource('/api/notifications/stream');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setConnected(true);
        console.log('Connected to notification stream');
      };

      eventSource.onmessage = (event) => {
        try {
          const data: RealtimeEvent = JSON.parse(event.data);
          setLastEvent(data);

          // Handle different event types
          switch (data.type) {
            case 'notification:created':
              // Show toast notification
              if (data.data) {
                const notification = data.data as Notification;
                toast(notification.title, {
                  description: notification.message,
                  action: notification.actionUrl ? {
                    label: notification.actionLabel || 'View',
                    onClick: () => window.location.href = notification.actionUrl!,
                  } : undefined,
                });
              }
              // Refresh notifications list
              fetchNotifications();
              break;

            case 'notification:read':
            case 'notification:deleted':
            case 'notifications:all_read':
              // Refresh notifications list for state sync
              fetchNotifications();
              break;

            case 'connection':
              console.log('SSE connection confirmed');
              break;

            case 'heartbeat':
              // Keep-alive, no action needed
              break;

            default:
              console.log('Unknown SSE event type:', data.type);
          }

        } catch (error) {
          console.error('Error parsing SSE data:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        setConnected(false);
        
        // Reconnect after 5 seconds
        setTimeout(() => {
          if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
            connect();
          }
        }, 5000);
      };

    } catch (error) {
      console.error('Error connecting to SSE:', error);
    }
  }, [user, fetchNotifications]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setConnected(false);
      console.log('Disconnected from notification stream');
    }
  }, []);

  // Auto-connect when user is available
  useEffect(() => {
    if (user) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [user, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connected,
    lastEvent,
    connect,
    disconnect,
  };
}

/**
 * Hook for managing notification preferences
 */
export function useNotificationPreferences() {
  const { user } = useUser();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Fetch preferences
  const fetchPreferences = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const response = await fetch('/api/notifications/preferences', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch preferences');
      }

      const data = await response.json();
      setPreferences(data.preferences);

    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast.error('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Update preferences
  const updatePreferences = useCallback(async (
    updates: Partial<NotificationPreferences>
  ) => {
    try {
      setUpdating(true);
      
      const response = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }

      const data = await response.json();
      setPreferences(data.preferences);
      toast.success('Preferences updated successfully');

    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences');
    } finally {
      setUpdating(false);
    }
  }, []);

  // Load preferences on mount
  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user, fetchPreferences]);

  return {
    preferences,
    loading,
    updating,
    updatePreferences,
    fetchPreferences,
  };
}