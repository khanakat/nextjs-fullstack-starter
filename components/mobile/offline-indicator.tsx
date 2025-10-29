"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  WifiOff,
  Wifi,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOffline } from "@/hooks/use-offline";

interface OfflineIndicatorProps {
  className?: string;
  showDetails?: boolean;
  position?: "top" | "bottom" | "fixed-top" | "fixed-bottom";
  variant?: "minimal" | "detailed" | "banner";
}

/**
 * Offline status indicator with sync information
 */
export function OfflineIndicator({
  className,
  showDetails = false,
  position = "top",
  variant = "minimal",
}: OfflineIndicatorProps) {
  const { isOnline, pendingActions, syncStatus, lastSyncTime, triggerSync } =
    useOffline();

  const [isVisible, setIsVisible] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  // Show indicator when offline or when there are pending actions
  useEffect(() => {
    const shouldShow =
      !isOnline || pendingActions.length > 0 || syncStatus === "syncing";
    setIsVisible(shouldShow);

    // Show banner for important status changes
    if (!isOnline || syncStatus === "error") {
      setShowBanner(true);
      const timer = setTimeout(() => setShowBanner(false), 5000);
      return () => clearTimeout(timer);
    }

    // Return undefined for other cases
    return undefined;
  }, [isOnline, pendingActions.length, syncStatus]);

  const getStatusIcon = () => {
    if (!isOnline) return WifiOff;
    if (syncStatus === "syncing") return RefreshCw;
    if (syncStatus === "error") return AlertTriangle;
    if (pendingActions.length > 0) return Clock;
    return Wifi;
  };

  const getStatusText = () => {
    if (!isOnline) return "Offline";
    if (syncStatus === "syncing") return "Syncing...";
    if (syncStatus === "error") return "Sync Error";
    if (pendingActions.length > 0) return `${pendingActions.length} pending`;
    return "Online";
  };

  const getStatusColor = () => {
    if (!isOnline) return "text-red-600 dark:text-red-400";
    if (syncStatus === "syncing") return "text-blue-600 dark:text-blue-400";
    if (syncStatus === "error") return "text-orange-600 dark:text-orange-400";
    if (pendingActions.length > 0)
      return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
  };

  const getBadgeVariant = () => {
    if (!isOnline) return "destructive";
    if (syncStatus === "error") return "secondary";
    if (pendingActions.length > 0) return "outline";
    return "default";
  };

  const positionClasses = {
    top: "relative",
    bottom: "relative",
    "fixed-top": "fixed top-0 left-0 right-0 z-50",
    "fixed-bottom": "fixed bottom-0 left-0 right-0 z-50",
  };

  if (!isVisible && variant !== "banner") return null;

  const StatusIcon = getStatusIcon();

  // Minimal variant - just an icon/badge
  if (variant === "minimal") {
    return (
      <div className={cn(positionClasses[position], className)}>
        <Badge
          variant={getBadgeVariant()}
          className={cn("flex items-center gap-1 text-xs", getStatusColor())}
        >
          <StatusIcon
            className={cn(
              "w-3 h-3",
              syncStatus === "syncing" && "animate-spin",
            )}
          />
          {showDetails && <span>{getStatusText()}</span>}
        </Badge>
      </div>
    );
  }

  // Banner variant - full width notification
  if (variant === "banner") {
    if (!showBanner && isOnline && syncStatus !== "error") return null;

    return (
      <div
        className={cn(
          "w-full p-3 border-b",
          !isOnline
            ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
            : syncStatus === "error"
              ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
              : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
          positionClasses[position],
          className,
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusIcon
              className={cn(
                "w-4 h-4",
                getStatusColor(),
                syncStatus === "syncing" && "animate-spin",
              )}
            />
            <span className={cn("text-sm font-medium", getStatusColor())}>
              {getStatusText()}
            </span>
            {pendingActions.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {pendingActions.length} actions queued
              </Badge>
            )}
          </div>

          {(syncStatus === "error" || pendingActions.length > 0) &&
            isOnline && (
              <Button
                variant="ghost"
                size="sm"
                onClick={triggerSync}
                disabled={syncStatus === "syncing"}
                className="h-6 px-2 text-xs"
              >
                <RefreshCw
                  className={cn(
                    "w-3 h-3 mr-1",
                    syncStatus === "syncing" && "animate-spin",
                  )}
                />
                Retry
              </Button>
            )}
        </div>

        {syncStatus === "error" && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Sync failed. Please try again.
          </p>
        )}
      </div>
    );
  }

  // Detailed variant - comprehensive status display
  return (
    <div
      className={cn(
        "p-3 bg-white dark:bg-gray-900 border rounded-lg shadow-sm",
        positionClasses[position],
        className,
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <StatusIcon
            className={cn(
              "w-4 h-4",
              getStatusColor(),
              syncStatus === "syncing" && "animate-spin",
            )}
          />
          <span className={cn("font-medium", getStatusColor())}>
            {getStatusText()}
          </span>
        </div>

        <Badge variant={getBadgeVariant()}>
          {isOnline ? "Online" : "Offline"}
        </Badge>
      </div>

      {/* Pending Actions */}
      {pendingActions.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
          <Clock className="w-3 h-3" />
          <span>{pendingActions.length} actions waiting to sync</span>
        </div>
      )}

      {/* Last Sync Time */}
      {lastSyncTime && (
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500 mb-2">
          <CheckCircle className="w-3 h-3" />
          <span>
            Last synced: {new Date(lastSyncTime).toLocaleTimeString()}
          </span>
        </div>
      )}

      {/* Sync Error */}
      {syncStatus === "error" && (
        <div className="text-xs text-red-600 dark:text-red-400 mb-2">
          <AlertTriangle className="w-3 h-3 inline mr-1" />
          Sync failed. Please try again.
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {isOnline && (syncStatus === "error" || pendingActions.length > 0) && (
          <Button
            variant="outline"
            size="sm"
            onClick={triggerSync}
            disabled={syncStatus === "syncing"}
            className="h-7 px-3 text-xs"
          >
            <RefreshCw
              className={cn(
                "w-3 h-3 mr-1",
                syncStatus === "syncing" && "animate-spin",
              )}
            />
            Sync Now
          </Button>
        )}

        {!isOnline && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="h-7 px-3 text-xs"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry Connection
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Simple connection status hook
 */
export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
