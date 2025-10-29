"use client";

import { useState, useEffect, useCallback } from "react";
import { useConditionalUser } from "@/components/conditional-clerk";

interface NotificationOptions {
  title: string;
  body?: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  data?: any;
}

/**
 * Hook for managing push notifications
 */
export function usePushNotifications() {
  const { user } = useConditionalUser();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = () => {
      const supported =
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

      setIsSupported(supported);

      if (supported) {
        setPermission(Notification.permission);
      }
    };

    checkSupport();
  }, []);

  // Get existing subscription
  useEffect(() => {
    const getExistingSubscription = async () => {
      if (!isSupported || !user) return;

      try {
        const registration = await navigator.serviceWorker.ready;
        const existingSubscription =
          await registration.pushManager.getSubscription();
        setSubscription(existingSubscription);
      } catch (err) {
        console.error("Error getting existing subscription:", err);
      }
    };

    getExistingSubscription();
  }, [isSupported, user]);

  /**
   * Request notification permission
   */
  const requestPermission =
    useCallback(async (): Promise<NotificationPermission> => {
      if (!isSupported) {
        throw new Error("Push notifications are not supported");
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await Notification.requestPermission();
        setPermission(result);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to request permission";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }, [isSupported]);

  /**
   * Subscribe to push notifications
   */
  const subscribe = useCallback(async (): Promise<PushSubscription> => {
    if (!isSupported) {
      throw new Error("Push notifications are not supported");
    }

    if (permission !== "granted") {
      throw new Error("Notification permission not granted");
    }

    if (!user) {
      throw new Error("User not authenticated");
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get VAPID public key from server
      const vapidResponse = await fetch("/api/mobile/push/vapid");
      if (!vapidResponse.ok) {
        throw new Error("Failed to get VAPID key");
      }

      const { publicKey } = await vapidResponse.json();

      // Subscribe to push manager
      const registration = await navigator.serviceWorker.ready;
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });

      // Send subscription to server
      const subscribeResponse = await fetch("/api/mobile/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscription: pushSubscription.toJSON(),
          deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
          },
        }),
      });

      if (!subscribeResponse.ok) {
        throw new Error("Failed to save subscription to server");
      }

      setSubscription(pushSubscription);
      return pushSubscription;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to subscribe";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, permission, user]);

  /**
   * Unsubscribe from push notifications
   */
  const unsubscribe = useCallback(async (): Promise<void> => {
    if (!subscription) {
      throw new Error("No active subscription");
    }

    setIsLoading(true);
    setError(null);

    try {
      // Unsubscribe from push manager
      await subscription.unsubscribe();

      // Notify server
      await fetch("/api/mobile/push/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
        }),
      });

      setSubscription(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to unsubscribe";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [subscription]);

  /**
   * Send a test notification
   */
  const sendTestNotification = useCallback(
    async (message: string): Promise<void> => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/mobile/push/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            targetUserId: user.id,
            notification: {
              title: "Test Notification",
              body: message,
              icon: "/icons/icon-192x192.png",
              badge: "/icons/badge-72x72.png",
              tag: "test",
              requireInteraction: false,
              actions: [
                {
                  action: "view",
                  title: "View",
                  icon: "/icons/view.png",
                },
                {
                  action: "dismiss",
                  title: "Dismiss",
                },
              ],
            },
            options: {
              urgency: "normal",
              TTL: 3600,
            },
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to send test notification");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to send notification";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [user],
  );

  /**
   * Show a local notification (doesn't require server)
   */
  const showLocalNotification = useCallback(
    async (
      title: string,
      body?: string,
      options?: Partial<NotificationOptions>,
    ): Promise<void> => {
      if (!isSupported) {
        throw new Error("Notifications are not supported");
      }

      if (permission !== "granted") {
        throw new Error("Notification permission not granted");
      }

      try {
        const notification = new Notification(title, {
          body,
          icon: "/icons/icon-192x192.png",
          badge: "/icons/badge-72x72.png",
          tag: "local",
          requireInteraction: false,
          ...options,
        });

        // Auto-close after 5 seconds
        setTimeout(() => {
          notification.close();
        }, 5000);

        // Handle click events
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to show notification";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [isSupported, permission],
  );

  /**
   * Update notification preferences
   */
  const updatePreferences = useCallback(
    async (preferences: {
      enabled?: boolean;
      quietHoursStart?: string;
      quietHoursEnd?: string;
      categories?: string[];
    }): Promise<void> => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/mobile/push/preferences", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(preferences),
        });

        if (!response.ok) {
          throw new Error("Failed to update preferences");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update preferences";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [user],
  );

  return {
    isSupported,
    permission,
    subscription,
    isLoading,
    error,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
    showLocalNotification,
    updatePreferences,
  };
}

/**
 * Convert VAPID key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
