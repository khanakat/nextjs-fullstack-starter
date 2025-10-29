"use client";

import { offlineDB, OfflineAction } from "./indexeddb";
import { logger } from "@/lib/logger";

export interface SyncOptions {
  maxRetries?: number;
  retryDelay?: number;
  batchSize?: number;
  onProgress?: (progress: {
    completed: number;
    total: number;
    current?: OfflineAction;
  }) => void;
  onError?: (error: Error, action?: OfflineAction) => void;
  onSuccess?: (action: OfflineAction, response?: any) => void;
}

export interface SyncResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: Array<{ action: OfflineAction; error: string }>;
}

class SyncService {
  private isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
  private isSyncing = false;
  private retryTimeouts = new Map<string, NodeJS.Timeout>();

  constructor() {
    if (typeof window !== "undefined") {
      // Listen for online/offline events
      window.addEventListener("online", this.handleOnline.bind(this));
      window.addEventListener("offline", this.handleOffline.bind(this));

      // Start periodic sync when online
      if (this.isOnline) {
        this.startPeriodicSync();
      }
    }
  }

  private handleOnline() {
    logger.info("Network connection restored", "SyncService");
    this.isOnline = true;
    this.startPeriodicSync();
    this.syncPendingActions();
  }

  private handleOffline() {
    logger.info("Network connection lost", "SyncService");
    this.isOnline = false;
    this.stopPeriodicSync();
  }

  private periodicSyncInterval?: NodeJS.Timeout;

  private startPeriodicSync() {
    if (this.periodicSyncInterval) return;

    // Sync every 30 seconds when online
    this.periodicSyncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.syncPendingActions({ maxRetries: 1 });
      }
    }, 30000);
  }

  private stopPeriodicSync() {
    if (this.periodicSyncInterval) {
      clearInterval(this.periodicSyncInterval);
      this.periodicSyncInterval = undefined;
    }
  }

  // Queue an action for offline execution
  async queueAction(
    type: string,
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
    data?: any,
    options?: {
      headers?: Record<string, string>;
      maxRetries?: number;
      userId?: string;
      organizationId?: string;
    },
  ): Promise<string> {
    const actionId = await offlineDB.addOfflineAction({
      type,
      endpoint,
      method,
      data,
      headers: options?.headers,
      maxRetries: options?.maxRetries || 3,
      userId: options?.userId,
      organizationId: options?.organizationId,
    });

    // Try to sync immediately if online
    if (this.isOnline) {
      this.syncPendingActions({ maxRetries: 1 });
    }

    return actionId;
  }

  // Execute a single action
  private async executeAction(action: OfflineAction): Promise<any> {
    const { endpoint, method, data, headers } = action;

    const fetchOptions: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    };

    if (data && method !== "GET") {
      fetchOptions.body = JSON.stringify(data);
    }

    const response = await fetch(endpoint, fetchOptions);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json().catch(() => null); // Handle empty responses
  }

  // Sync all pending actions
  async syncPendingActions(options: SyncOptions = {}): Promise<SyncResult> {
    if (!this.isOnline) {
      throw new Error("Cannot sync while offline");
    }

    if (this.isSyncing) {
      logger.info("Sync already in progress", "SyncService");
      return { success: false, processed: 0, failed: 0, errors: [] };
    }

    this.isSyncing = true;
    const result: SyncResult = {
      success: true,
      processed: 0,
      failed: 0,
      errors: [],
    };

    try {
      // Get all pending actions
      const pendingActions = await offlineDB.getOfflineActions({
        synced: false,
      });

      if (pendingActions.length === 0) {
        return result;
      }

      logger.info(
        `Starting sync of ${pendingActions.length} pending actions`,
        "SyncService",
      );

      const batchSize = options.batchSize || 5;
      const maxRetries = options.maxRetries || 3;

      // Process actions in batches
      for (let i = 0; i < pendingActions.length; i += batchSize) {
        const batch = pendingActions.slice(i, i + batchSize);

        await Promise.allSettled(
          batch.map(async (action) => {
            try {
              options.onProgress?.({
                completed: result.processed,
                total: pendingActions.length,
                current: action,
              });

              // Skip if already exceeded max retries
              if (action.retryCount >= (action.maxRetries || maxRetries)) {
                await offlineDB.updateOfflineAction(action.id, {
                  error: "Max retries exceeded",
                });
                result.failed++;
                result.errors.push({
                  action,
                  error: "Max retries exceeded",
                });
                return;
              }

              // Execute the action
              const response = await this.executeAction(action);

              // Mark as synced
              await offlineDB.updateOfflineAction(action.id, {
                synced: true,
                error: undefined,
              });

              result.processed++;
              options.onSuccess?.(action, response);
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : "Unknown error";

              // Update retry count and error
              await offlineDB.updateOfflineAction(action.id, {
                retryCount: action.retryCount + 1,
                error: errorMessage,
              });

              result.failed++;
              result.errors.push({ action, error: errorMessage });
              options.onError?.(
                error instanceof Error ? error : new Error(errorMessage),
                action,
              );

              // Schedule retry if not exceeded max retries
              if (action.retryCount + 1 < (action.maxRetries || maxRetries)) {
                this.scheduleRetry(action, options.retryDelay || 5000);
              }
            }
          }),
        );

        // Small delay between batches to prevent overwhelming the server
        if (i + batchSize < pendingActions.length) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      // Clean up successfully synced actions periodically
      if (result.processed > 0) {
        setTimeout(() => {
          offlineDB.clearSyncedActions();
        }, 60000); // Clean up after 1 minute
      }
    } catch (error) {
      result.success = false;
      logger.error("Sync failed", "SyncService", error);
    } finally {
      this.isSyncing = false;
    }

    logger.info(
      `Sync completed: ${result.processed} processed, ${result.failed} failed`,
      "SyncService",
    );
    return result;
  }

  // Schedule a retry for a failed action
  private scheduleRetry(action: OfflineAction, delay: number) {
    // Clear existing timeout if any
    const existingTimeout = this.retryTimeouts.get(action.id);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Schedule new retry
    const timeout = setTimeout(() => {
      this.retryAction(action.id);
      this.retryTimeouts.delete(action.id);
    }, delay);

    this.retryTimeouts.set(action.id, timeout);
  }

  // Retry a specific action
  private async retryAction(actionId: string) {
    if (!this.isOnline) return;

    const actions = await offlineDB.getOfflineActions();
    const action = actions.find((a) => a.id === actionId);

    if (!action || action.synced) return;

    try {
      await this.executeAction(action);

      await offlineDB.updateOfflineAction(action.id, {
        synced: true,
        error: undefined,
      });

      logger.info(`Retry successful for action ${actionId}`, "SyncService");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      await offlineDB.updateOfflineAction(actionId, {
        retryCount: action.retryCount + 1,
        error: errorMessage,
      });

      logger.error(`Retry failed for action ${actionId}`, "SyncService", error);
    }
  }

  // Get sync status
  async getSyncStatus(): Promise<{
    isOnline: boolean;
    isSyncing: boolean;
    pendingActions: number;
    lastSyncTime?: Date;
  }> {
    const pendingActions = await offlineDB.getOfflineActions({ synced: false });
    const syncMetadata = await offlineDB.getSyncMetadata("global");

    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingActions: pendingActions.length,
      lastSyncTime: syncMetadata?.lastSyncTime
        ? new Date(syncMetadata.lastSyncTime)
        : undefined,
    };
  }

  // Force sync (manual trigger)
  async forcSync(options: SyncOptions = {}): Promise<SyncResult> {
    if (!this.isOnline) {
      throw new Error("Cannot sync while offline");
    }

    return this.syncPendingActions({
      ...options,
      maxRetries: options.maxRetries || 1, // Lower retries for manual sync
    });
  }

  // Clear all pending actions (use with caution)
  async clearPendingActions(): Promise<void> {
    await offlineDB.getOfflineActions({ synced: false }).then((actions) => {
      return Promise.all(
        actions.map((action) => offlineDB.deleteOfflineAction(action.id)),
      );
    });
  }

  // Get pending actions for debugging
  async getPendingActions(): Promise<OfflineAction[]> {
    return offlineDB.getOfflineActions({ synced: false });
  }

  // Cleanup
  destroy() {
    this.stopPeriodicSync();

    // Clear all retry timeouts with null check
    if (this.retryTimeouts) {
      this.retryTimeouts.forEach((timeout) => {
        if (timeout) {
          clearTimeout(timeout);
        }
      });
      this.retryTimeouts.clear();
    }

    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.handleOnline.bind(this));
      window.removeEventListener("offline", this.handleOffline.bind(this));
    }
  }
}

// Singleton instance
export const syncService = new SyncService();

// Utility functions for common operations
export const queueApiCall = async (
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  data?: any,
  options?: {
    headers?: Record<string, string>;
    userId?: string;
    organizationId?: string;
  },
): Promise<string> => {
  return syncService.queueAction("api_call", endpoint, method, data, options);
};

export const queueFormSubmission = async (
  formType: string,
  endpoint: string,
  formData: any,
  options?: {
    userId?: string;
    organizationId?: string;
  },
): Promise<string> => {
  return syncService.queueAction(
    `form_${formType}`,
    endpoint,
    "POST",
    formData,
    options,
  );
};

export const queueFileUpload = async (
  endpoint: string,
  fileData: any,
  options?: {
    userId?: string;
    organizationId?: string;
  },
): Promise<string> => {
  return syncService.queueAction("file_upload", endpoint, "POST", fileData, {
    ...options,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
