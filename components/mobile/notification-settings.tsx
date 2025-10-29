"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, Settings, Clock, Smartphone } from "lucide-react";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { useNotificationPreferences } from "@/hooks/use-notifications";
import { TouchOptimizedButton } from "./touch-optimized-button";
import { Switch } from "@/components/ui/switch";

interface NotificationSettingsProps {
  className?: string;
}

export function NotificationSettings({ className }: NotificationSettingsProps) {
  const {
    isSupported,
    permission,
    subscription,
    isLoading,
    error,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
  } = usePushNotifications();

  const isSubscribed = !!subscription;

  const { preferences, updatePreferences } = useNotificationPreferences();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleToggleNotifications = async () => {
    try {
      if (isSubscribed) {
        await unsubscribe();
      } else {
        if (permission !== "granted") {
          await requestPermission();
        }
        await subscribe();
      }
    } catch (error) {
      console.error("Failed to toggle notifications:", error);
    }
  };

  const handleTestNotification = async () => {
    try {
      await sendTestNotification(
        "This is a test notification from your mobile app!",
      );
    } catch (error) {
      console.error("Failed to send test notification:", error);
    }
  };

  const handlePreferenceChange = async (key: string, value: any) => {
    if (!preferences) return;

    try {
      await updatePreferences({ [key]: value });
    } catch (error) {
      console.error("Failed to update preference:", error);
    }
  };

  const handleQuietHoursChange = async (field: string, value: any) => {
    if (!preferences) return;

    try {
      await updatePreferences({
        quietHours: {
          ...preferences.quietHours,
          [field]: value,
        },
      });
    } catch (error) {
      console.error("Failed to update quiet hours:", error);
    }
  };

  if (!isSupported) {
    return (
      <div className={`p-6 bg-gray-50 rounded-lg ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <BellOff className="w-6 h-6 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-600">
            Notifications Not Supported
          </h3>
        </div>
        <p className="text-gray-500">
          Push notifications are not supported on this device or browser.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Toggle */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {isSubscribed ? (
              <Bell className="w-6 h-6 text-blue-600" />
            ) : (
              <BellOff className="w-6 h-6 text-gray-400" />
            )}
            <div>
              <h3 className="text-lg font-semibold">Push Notifications</h3>
              <p className="text-sm text-gray-500">
                {permission === "granted"
                  ? isSubscribed
                    ? "Notifications are enabled"
                    : "Ready to enable notifications"
                  : permission === "denied"
                    ? "Notifications are blocked"
                    : "Permission not requested"}
              </p>
            </div>
          </div>

          <Switch
            checked={isSubscribed}
            onCheckedChange={handleToggleNotifications}
            disabled={isLoading || permission === "denied"}
          />
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <p className="text-sm text-red-600">{error}</p>
          </motion.div>
        )}

        {permission === "denied" && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-700">
              Notifications are blocked. Please enable them in your browser
              settings.
            </p>
          </div>
        )}

        {isSubscribed && (
          <div className="flex gap-3">
            <TouchOptimizedButton
              variant="outline"
              size="sm"
              onClick={handleTestNotification}
              disabled={isLoading}
            >
              <Bell className="w-4 h-4 mr-2" />
              Test Notification
            </TouchOptimizedButton>

            <TouchOptimizedButton
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Advanced Settings
            </TouchOptimizedButton>
          </div>
        )}
      </div>

      {/* Advanced Settings */}
      <AnimatePresence>
        {showAdvanced && isSubscribed && preferences && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            {/* Notification Types */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Types
              </h4>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">System Notifications</p>
                    <p className="text-sm text-gray-500">
                      Important system notifications
                    </p>
                  </div>
                  <Switch
                    checked={preferences.categories.system}
                    onCheckedChange={(checked) =>
                      handlePreferenceChange("categories", {
                        ...preferences.categories,
                        system: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Security Alerts</p>
                    <p className="text-sm text-gray-500">
                      Security-related notifications
                    </p>
                  </div>
                  <Switch
                    checked={preferences.categories.security}
                    onCheckedChange={(checked) =>
                      handlePreferenceChange("categories", {
                        ...preferences.categories,
                        security: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Updates</p>
                    <p className="text-sm text-gray-500">
                      Product updates and new features
                    </p>
                  </div>
                  <Switch
                    checked={preferences.categories.updates}
                    onCheckedChange={(checked) =>
                      handlePreferenceChange("categories", {
                        ...preferences.categories,
                        updates: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Marketing</p>
                    <p className="text-sm text-gray-500">
                      Product updates and tips
                    </p>
                  </div>
                  <Switch
                    checked={preferences.categories.marketing}
                    onCheckedChange={(checked) =>
                      handlePreferenceChange("categories", {
                        ...preferences.categories,
                        marketing: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Billing</p>
                    <p className="text-sm text-gray-500">
                      Billing and payment notifications
                    </p>
                  </div>
                  <Switch
                    checked={preferences.categories.billing}
                    onCheckedChange={(checked) =>
                      handlePreferenceChange("categories", {
                        ...preferences.categories,
                        billing: checked,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Quiet Hours */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Quiet Hours
              </h4>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Enable Quiet Hours</p>
                    <p className="text-sm text-gray-500">
                      Silence notifications during specified hours
                    </p>
                  </div>
                  <Switch
                    checked={preferences.quietHours.enabled}
                    onCheckedChange={(checked) =>
                      handleQuietHoursChange("enabled", checked)
                    }
                  />
                </div>

                {preferences.quietHours.enabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 pl-4 border-l-2 border-gray-200"
                  >
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Start Time</label>
                      <input
                        type="time"
                        value={preferences.quietHours.start}
                        onChange={(e) =>
                          handleQuietHoursChange("start", e.target.value)
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">End Time</label>
                      <input
                        type="time"
                        value={preferences.quietHours.end}
                        onChange={(e) =>
                          handleQuietHoursChange("end", e.target.value)
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Device Settings */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Device Settings
              </h4>

              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Permission Status:</span>
                  <span
                    className={`font-medium ${
                      permission === "granted"
                        ? "text-green-600"
                        : permission === "denied"
                          ? "text-red-600"
                          : "text-yellow-600"
                    }`}
                  >
                    {permission.charAt(0).toUpperCase() + permission.slice(1)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Subscription Status:</span>
                  <span
                    className={`font-medium ${isSubscribed ? "text-green-600" : "text-gray-600"}`}
                  >
                    {isSubscribed ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="pt-3 border-t">
                  <p className="text-xs text-gray-500">
                    To modify system-level notification settings (sound,
                    vibration, etc.), please use your device&apos;s notification
                    settings.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Compact notification toggle for headers/status bars
export function NotificationToggle({ className }: { className?: string }) {
  const { subscription, isLoading, subscribe, unsubscribe } =
    usePushNotifications();
  const isSubscribed = !!subscription;

  const handleToggle = async () => {
    try {
      if (isSubscribed) {
        await unsubscribe();
      } else {
        await subscribe();
      }
    } catch (error) {
      console.error("Failed to toggle notifications:", error);
    }
  };

  return (
    <TouchOptimizedButton
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={isLoading}
      className={`p-2 ${className}`}
    >
      {isSubscribed ? (
        <Bell className="w-5 h-5 text-blue-600" />
      ) : (
        <BellOff className="w-5 h-5 text-gray-400" />
      )}
    </TouchOptimizedButton>
  );
}

// Notification permission prompt
export function NotificationPermissionPrompt({
  onDismiss,
  className,
}: {
  onDismiss?: () => void;
  className?: string;
}) {
  const { permission, requestPermission, subscribe } = usePushNotifications();
  const [isRequesting, setIsRequesting] = useState(false);

  const handleEnable = async () => {
    try {
      setIsRequesting(true);
      await requestPermission();
      await subscribe();
      onDismiss?.();
    } catch (error) {
      console.error("Failed to enable notifications:", error);
    } finally {
      setIsRequesting(false);
    }
  };

  if (permission === "granted") {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <Bell className="w-6 h-6 text-blue-600 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-blue-900 mb-1">
            Stay Updated with Notifications
          </h4>
          <p className="text-sm text-blue-700 mb-3">
            Get notified about task assignments, workflow updates, and important
            alerts.
          </p>
          <div className="flex gap-2">
            <TouchOptimizedButton
              variant="default"
              size="sm"
              onClick={handleEnable}
              disabled={isRequesting}
            >
              {isRequesting ? "Enabling..." : "Enable Notifications"}
            </TouchOptimizedButton>
            <TouchOptimizedButton variant="ghost" size="sm" onClick={onDismiss}>
              Maybe Later
            </TouchOptimizedButton>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
