"use client";

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
  timestamp?: number;
  vibrate?: number[];
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface PushNotificationOptions {
  userId?: string;
  organizationId?: string;
  targetUsers?: string[];
  targetRoles?: string[];
  schedule?: Date;
  ttl?: number;
  urgency?: "very-low" | "low" | "normal" | "high";
  topic?: string;
}

export class PushNotificationService {
  private vapidPublicKey: string;
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;

  constructor(vapidPublicKey: string) {
    this.vapidPublicKey = vapidPublicKey;
  }

  // Initialize the push service
  async initialize(): Promise<boolean> {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("Push messaging is not supported");
      return false;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register("/sw.js");
      console.log("Service Worker registered:", this.registration);

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      return true;
    } catch (error) {
      console.error("Service Worker registration failed:", error);
      return false;
    }
  }

  // Check if push notifications are supported
  isSupported(): boolean {
    return (
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window
    );
  }

  // Get current permission status
  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error("Push notifications are not supported");
    }

    const permission = await Notification.requestPermission();
    console.log("Notification permission:", permission);
    return permission;
  }

  // Subscribe to push notifications
  async subscribe(): Promise<PushSubscriptionData | null> {
    if (!this.registration) {
      throw new Error("Service Worker not registered");
    }

    if (Notification.permission !== "granted") {
      const permission = await this.requestPermission();
      if (permission !== "granted") {
        throw new Error("Notification permission denied");
      }
    }

    try {
      // Check for existing subscription
      this.subscription = await this.registration.pushManager.getSubscription();

      if (!this.subscription) {
        // Create new subscription
        this.subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey),
        });
      }

      const subscriptionData = this.subscriptionToData(this.subscription);

      // Send subscription to server
      await this.sendSubscriptionToServer(subscriptionData);

      return subscriptionData;
    } catch (error) {
      console.error("Failed to subscribe to push notifications:", error);
      throw error;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe(): Promise<boolean> {
    if (!this.subscription) {
      return true;
    }

    try {
      const success = await this.subscription.unsubscribe();

      if (success) {
        // Remove subscription from server
        await this.removeSubscriptionFromServer();
        this.subscription = null;
      }

      return success;
    } catch (error) {
      console.error("Failed to unsubscribe from push notifications:", error);
      return false;
    }
  }

  // Get current subscription
  async getSubscription(): Promise<PushSubscriptionData | null> {
    if (!this.registration) {
      return null;
    }

    try {
      this.subscription = await this.registration.pushManager.getSubscription();
      return this.subscription
        ? this.subscriptionToData(this.subscription)
        : null;
    } catch (error) {
      console.error("Failed to get subscription:", error);
      return null;
    }
  }

  // Send a test notification
  async sendTestNotification(): Promise<void> {
    if (!this.subscription) {
      throw new Error("No active subscription");
    }

    const payload: NotificationPayload = {
      title: "Test Notification",
      body: "This is a test push notification",
      icon: "/icons/icon-72x72.png",
      badge: "/icons/icon-72x72.png",
      tag: "test-notification",
      data: {
        type: "test",
        timestamp: Date.now(),
      },
      actions: [
        {
          action: "view",
          title: "View",
          icon: "/icons/icon-72x72.png",
        },
        {
          action: "dismiss",
          title: "Dismiss",
        },
      ],
    };

    await this.sendNotification(payload);
  }

  // Send notification to server for delivery
  async sendNotification(
    payload: NotificationPayload,
    options?: PushNotificationOptions,
  ): Promise<void> {
    try {
      const response = await fetch("/api/mobile/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payload,
          options,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send notification: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Failed to send notification:", error);
      throw error;
    }
  }

  // Show local notification (for testing)
  async showLocalNotification(payload: NotificationPayload): Promise<void> {
    if (!this.registration) {
      throw new Error("Service Worker not registered");
    }

    if (Notification.permission !== "granted") {
      throw new Error("Notification permission not granted");
    }

    await this.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon,
      badge: payload.badge,
      tag: payload.tag,
      data: payload.data,
      requireInteraction: payload.requireInteraction,
      silent: payload.silent,
      timestamp: payload.timestamp,
      vibrate: payload.vibrate,
    } as NotificationOptions);
  }

  // Handle notification click events
  setupNotificationHandlers(): void {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data && event.data.type === "NOTIFICATION_CLICK") {
        this.handleNotificationClick(
          event.data.notification,
          event.data.action,
        );
      }
    });
  }

  // Handle notification click
  private handleNotificationClick(notification: any, action?: string): void {
    const data = notification.data || {};

    switch (action) {
      case "view":
        if (data.url) {
          window.open(data.url, "_blank");
        }
        break;
      case "dismiss":
        // Just close the notification
        break;
      default:
        // Default click action
        if (data.url) {
          window.location.href = data.url;
        } else if (data.route) {
          window.location.href = data.route;
        }
        break;
    }

    // Track notification interaction
    this.trackNotificationInteraction(notification, action);
  }

  // Track notification interactions
  private async trackNotificationInteraction(
    notification: any,
    action?: string,
  ): Promise<void> {
    try {
      await fetch("/api/mobile/push/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationId: notification.data?.id,
          action: action || "click",
          timestamp: Date.now(),
        }),
      });
    } catch (error) {
      console.error("Failed to track notification interaction:", error);
    }
  }

  // Convert subscription to data format
  private subscriptionToData(
    subscription: PushSubscription,
  ): PushSubscriptionData {
    const key = subscription.getKey("p256dh");
    const auth = subscription.getKey("auth");

    return {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: key ? this.arrayBufferToBase64(key) : "",
        auth: auth ? this.arrayBufferToBase64(auth) : "",
      },
    };
  }

  // Send subscription to server
  private async sendSubscriptionToServer(
    subscription: PushSubscriptionData,
  ): Promise<void> {
    try {
      const response = await fetch("/api/mobile/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) {
        throw new Error(`Failed to save subscription: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Failed to send subscription to server:", error);
      throw error;
    }
  }

  // Remove subscription from server
  private async removeSubscriptionFromServer(): Promise<void> {
    try {
      const response = await fetch("/api/mobile/push/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to remove subscription: ${response.statusText}`,
        );
      }
    } catch (error) {
      console.error("Failed to remove subscription from server:", error);
      throw error;
    }
  }

  // Utility functions
  private urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(new ArrayBuffer(rawData.length));

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

// Notification templates
export const notificationTemplates = {
  welcome: (userName: string): NotificationPayload => ({
    title: "Welcome to the Platform!",
    body: `Hi ${userName}, welcome to our platform. Get started by exploring your dashboard.`,
    icon: "/icons/icon-72x72.png",
    badge: "/icons/icon-72x72.png",
    tag: "welcome",
    data: {
      type: "welcome",
      route: "/dashboard",
    },
    actions: [
      {
        action: "view",
        title: "View Dashboard",
      },
    ],
  }),

  taskAssigned: (
    taskTitle: string,
    assignedBy: string,
  ): NotificationPayload => ({
    title: "New Task Assigned",
    body: `${assignedBy} assigned you a new task: ${taskTitle}`,
    icon: "/icons/icon-72x72.png",
    badge: "/icons/icon-72x72.png",
    tag: "task-assigned",
    data: {
      type: "task_assigned",
      route: "/tasks",
    },
    actions: [
      {
        action: "view",
        title: "View Task",
      },
      {
        action: "dismiss",
        title: "Dismiss",
      },
    ],
    requireInteraction: true,
  }),

  workflowCompleted: (workflowName: string): NotificationPayload => ({
    title: "Workflow Completed",
    body: `The workflow "${workflowName}" has completed successfully.`,
    icon: "/icons/icon-72x72.png",
    badge: "/icons/icon-72x72.png",
    tag: "workflow-completed",
    data: {
      type: "workflow_completed",
      route: "/workflows",
    },
    actions: [
      {
        action: "view",
        title: "View Results",
      },
    ],
  }),

  systemAlert: (
    message: string,
    severity: "info" | "warning" | "error",
  ): NotificationPayload => ({
    title:
      severity === "error"
        ? "System Error"
        : severity === "warning"
          ? "System Warning"
          : "System Info",
    body: message,
    icon: "/icons/icon-72x72.png",
    badge: "/icons/icon-72x72.png",
    tag: `system-${severity}`,
    data: {
      type: "system_alert",
      severity,
      route: "/system",
    },
    requireInteraction: severity === "error",
    vibrate: severity === "error" ? [200, 100, 200] : undefined,
  }),

  reminder: (
    title: string,
    message: string,
    dueDate?: Date,
  ): NotificationPayload => ({
    title: `Reminder: ${title}`,
    body: message + (dueDate ? ` (Due: ${dueDate.toLocaleDateString()})` : ""),
    icon: "/icons/icon-72x72.png",
    badge: "/icons/icon-72x72.png",
    tag: "reminder",
    data: {
      type: "reminder",
      dueDate: dueDate?.toISOString(),
      route: "/tasks",
    },
    actions: [
      {
        action: "view",
        title: "View",
      },
      {
        action: "snooze",
        title: "Snooze",
      },
    ],
  }),
};

// Default push service instance (will be initialized with VAPID key)
let pushService: PushNotificationService | null = null;

export function initializePushService(
  vapidPublicKey: string,
): PushNotificationService {
  pushService = new PushNotificationService(vapidPublicKey);
  return pushService;
}

export function getPushService(): PushNotificationService | null {
  return pushService;
}
