"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@clerk/nextjs";

interface OfflineAction {
  id: string;
  type: "create" | "update" | "delete";
  entity: string;
  data: any;
  timestamp: number;
  retryCount: number;
  lastError?: string;
  status: "pending" | "syncing" | "synced" | "failed";
}

interface SyncStatus {
  status: "idle" | "syncing" | "synced" | "error";
  lastSyncTime?: number;
  pendingCount: number;
  errorCount: number;
}

/**
 * Hook for managing offline functionality and data synchronization
 */
export function useOffline() {
  const { user } = useUser();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingActions, setPendingActions] = useState<OfflineAction[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus["status"]>("idle");
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout>();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Trigger sync when coming back online
      if (pendingActions.length > 0) {
        triggerSync();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [pendingActions.length]);

  // Load pending actions from localStorage on mount
  useEffect(() => {
    const loadPendingActions = () => {
      try {
        const stored = localStorage.getItem("offline-actions");
        if (stored) {
          const actions = JSON.parse(stored);
          setPendingActions(actions);
        }
      } catch (error) {
        console.error("Failed to load pending actions:", error);
      }
    };

    loadPendingActions();
  }, []);

  // Save pending actions to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem("offline-actions", JSON.stringify(pendingActions));
    } catch (error) {
      console.error("Failed to save pending actions:", error);
    }
  }, [pendingActions]);

  // Auto-sync when online and have pending actions
  useEffect(() => {
    if (isOnline && pendingActions.length > 0 && syncStatus === "idle") {
      // Debounce auto-sync
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      syncTimeoutRef.current = setTimeout(() => {
        triggerSync();
      }, 2000);
    }

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [isOnline, pendingActions.length, syncStatus]);

  /**
   * Queue an action for offline execution
   */
  const queueAction = useCallback(
    (action: {
      type: "create" | "update" | "delete";
      entity: string;
      data: any;
    }): string => {
      const actionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const offlineAction: OfflineAction = {
        id: actionId,
        type: action.type,
        entity: action.entity,
        data: action.data,
        timestamp: Date.now(),
        retryCount: 0,
        status: "pending",
      };

      setPendingActions((prev) => [...prev, offlineAction]);

      // If online, try to sync immediately
      if (isOnline) {
        setTimeout(() => triggerSync(), 100);
      }

      return actionId;
    },
    [isOnline],
  );

  /**
   * Remove an action from the queue
   */
  const removeAction = useCallback((actionId: string) => {
    setPendingActions((prev) =>
      prev.filter((action) => action.id !== actionId),
    );
  }, []);

  /**
   * Update action status
   */
  const updateActionStatus = useCallback(
    (actionId: string, status: OfflineAction["status"], error?: string) => {
      setPendingActions((prev) =>
        prev.map((action) =>
          action.id === actionId
            ? {
                ...action,
                status,
                lastError: error,
                retryCount: error ? action.retryCount + 1 : action.retryCount,
              }
            : action,
        ),
      );
    },
    [],
  );

  /**
   * Trigger synchronization of pending actions
   */
  const triggerSync = useCallback(async (): Promise<void> => {
    if (!isOnline || !user || syncStatus === "syncing") {
      return;
    }

    const actionsToSync = pendingActions.filter(
      (action) =>
        action.status === "pending" ||
        (action.status === "failed" && action.retryCount < 3),
    );

    if (actionsToSync.length === 0) {
      setSyncStatus("synced");
      setLastSyncTime(Date.now());
      return;
    }

    setSyncStatus("syncing");

    try {
      // Send actions to server for synchronization
      const response = await fetch("/api/mobile/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          actions: actionsToSync.map((action) => ({
            id: action.id,
            type: action.type,
            entity: action.entity,
            data: action.data,
            timestamp: action.timestamp,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.statusText}`);
      }

      const result = await response.json();

      // Update action statuses based on server response
      if (result.results) {
        result.results.forEach((syncResult: any) => {
          if (syncResult.success) {
            updateActionStatus(syncResult.id, "synced");
          } else {
            updateActionStatus(syncResult.id, "failed", syncResult.error);
          }
        });
      }

      // Remove successfully synced actions
      setPendingActions((prev) =>
        prev.filter((action) => action.status !== "synced"),
      );

      setSyncStatus("synced");
      setLastSyncTime(Date.now());
    } catch (error) {
      console.error("Sync failed:", error);
      setSyncStatus("error");

      // Mark all syncing actions as failed
      actionsToSync.forEach((action) => {
        updateActionStatus(
          action.id,
          "failed",
          error instanceof Error ? error.message : "Sync failed",
        );
      });
    }
  }, [isOnline, user, syncStatus, pendingActions, updateActionStatus]);

  /**
   * Clear all pending actions (use with caution)
   */
  const clearPendingActions = useCallback(() => {
    setPendingActions([]);
    localStorage.removeItem("offline-actions");
  }, []);

  /**
   * Get cached data from localStorage
   */
  const getCachedData = useCallback((key: string): any => {
    try {
      const cached = localStorage.getItem(`cache-${key}`);
      if (cached) {
        const data = JSON.parse(cached);
        // Check if cache is still valid (24 hours)
        if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
          return data.value;
        } else {
          localStorage.removeItem(`cache-${key}`);
        }
      }
    } catch (error) {
      console.error("Failed to get cached data:", error);
    }
    return null;
  }, []);

  /**
   * Set cached data in localStorage
   */
  const setCachedData = useCallback((key: string, value: any) => {
    try {
      const data = {
        value,
        timestamp: Date.now(),
      };
      localStorage.setItem(`cache-${key}`, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to set cached data:", error);
    }
  }, []);

  /**
   * Clear cache
   */
  const clearCache = useCallback(() => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith("cache-")) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error("Failed to clear cache:", error);
    }
  }, []);

  /**
   * Execute action immediately if online, or queue for later if offline
   */
  const executeOrQueue = useCallback(
    async (
      action: {
        type: "create" | "update" | "delete";
        entity: string;
        data: any;
      },
      onlineHandler: () => Promise<any>,
    ): Promise<any> => {
      if (isOnline) {
        try {
          return await onlineHandler();
        } catch (error) {
          // If online execution fails, queue for later
          queueAction(action);
          throw error;
        }
      } else {
        // Queue for later execution
        const actionId = queueAction(action);
        return { queued: true, actionId };
      }
    },
    [isOnline, queueAction],
  );

  return {
    isOnline,
    syncStatus,
    pendingActions,
    lastSyncTime,
    queueAction,
    removeAction,
    updateActionStatus,
    triggerSync,
    clearPendingActions,
    getCachedData,
    setCachedData,
    clearCache,
    executeOrQueue,
  };
}
