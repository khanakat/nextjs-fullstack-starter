// IndexedDB wrapper for offline data storage
export interface OfflineAction {
  id: string;
  type: string;
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  data?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  userId?: string;
  organizationId?: string;
  synced: boolean;
  error?: string;
}

export interface CachedData {
  id: string;
  key: string;
  data: any;
  timestamp: number;
  expiresAt?: number;
  version: number;
}

export interface SyncMetadata {
  id: string;
  lastSyncTime: number;
  syncVersion: number;
  conflictResolution: "client" | "server" | "merge";
}

class OfflineDB {
  private db: IDBDatabase | null = null;
  private dbName = "OfflineAppDB";
  private version = 1;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Offline Actions Store
        if (!db.objectStoreNames.contains("offlineActions")) {
          const actionsStore = db.createObjectStore("offlineActions", {
            keyPath: "id",
          });
          actionsStore.createIndex("timestamp", "timestamp");
          actionsStore.createIndex("synced", "synced");
          actionsStore.createIndex("userId", "userId");
          actionsStore.createIndex("type", "type");
        }

        // Cached Data Store
        if (!db.objectStoreNames.contains("cachedData")) {
          const cacheStore = db.createObjectStore("cachedData", {
            keyPath: "id",
          });
          cacheStore.createIndex("key", "key");
          cacheStore.createIndex("timestamp", "timestamp");
          cacheStore.createIndex("expiresAt", "expiresAt");
        }

        // Sync Metadata Store
        if (!db.objectStoreNames.contains("syncMetadata")) {
          const syncStore = db.createObjectStore("syncMetadata", {
            keyPath: "id",
          });
          syncStore.createIndex("lastSyncTime", "lastSyncTime");
        }

        // User Data Store (for offline user profiles, settings, etc.)
        if (!db.objectStoreNames.contains("userData")) {
          const userStore = db.createObjectStore("userData", { keyPath: "id" });
          userStore.createIndex("userId", "userId");
          userStore.createIndex("type", "type");
        }
      };
    });
  }

  private ensureDB(): IDBDatabase {
    if (!this.db) {
      throw new Error("Database not initialized. Call init() first.");
    }
    return this.db;
  }

  // Offline Actions Management
  async addOfflineAction(
    action: Omit<OfflineAction, "id" | "timestamp" | "retryCount" | "synced">,
  ): Promise<string> {
    const db = this.ensureDB();
    const id = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const fullAction: OfflineAction = {
      ...action,
      id,
      timestamp: Date.now(),
      retryCount: 0,
      synced: false,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["offlineActions"], "readwrite");
      const store = transaction.objectStore("offlineActions");
      const request = store.add(fullAction);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  async getOfflineActions(filter?: {
    synced?: boolean;
    userId?: string;
    type?: string;
  }): Promise<OfflineAction[]> {
    const db = this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["offlineActions"], "readonly");
      const store = transaction.objectStore("offlineActions");
      const request = store.getAll();

      request.onsuccess = () => {
        let actions = request.result as OfflineAction[];

        if (filter) {
          actions = actions.filter((action) => {
            if (filter.synced !== undefined && action.synced !== filter.synced)
              return false;
            if (filter.userId && action.userId !== filter.userId) return false;
            if (filter.type && action.type !== filter.type) return false;
            return true;
          });
        }

        // Sort by timestamp (oldest first for sync queue)
        actions.sort((a, b) => a.timestamp - b.timestamp);
        resolve(actions);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async updateOfflineAction(
    id: string,
    updates: Partial<OfflineAction>,
  ): Promise<void> {
    const db = this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["offlineActions"], "readwrite");
      const store = transaction.objectStore("offlineActions");
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const action = getRequest.result;
        if (!action) {
          reject(new Error("Action not found"));
          return;
        }

        const updatedAction = { ...action, ...updates };
        const putRequest = store.put(updatedAction);

        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async deleteOfflineAction(id: string): Promise<void> {
    const db = this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["offlineActions"], "readwrite");
      const store = transaction.objectStore("offlineActions");
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearSyncedActions(): Promise<void> {
    const db = this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["offlineActions"], "readwrite");
      const store = transaction.objectStore("offlineActions");
      const index = store.index("synced");
      const request = index.openCursor(IDBKeyRange.only(true));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Cached Data Management
  async setCachedData(
    key: string,
    data: any,
    expiresIn?: number,
  ): Promise<void> {
    const db = this.ensureDB();
    const id = `cache_${key}`;

    const cachedData: CachedData = {
      id,
      key,
      data,
      timestamp: Date.now(),
      expiresAt: expiresIn ? Date.now() + expiresIn : undefined,
      version: 1,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["cachedData"], "readwrite");
      const store = transaction.objectStore("cachedData");
      const request = store.put(cachedData);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getCachedData(key: string): Promise<any | null> {
    const db = this.ensureDB();
    const id = `cache_${key}`;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["cachedData"], "readonly");
      const store = transaction.objectStore("cachedData");
      const request = store.get(id);

      request.onsuccess = () => {
        const result = request.result as CachedData;
        if (!result) {
          resolve(null);
          return;
        }

        // Check if expired
        if (result.expiresAt && Date.now() > result.expiresAt) {
          // Delete expired data
          this.deleteCachedData(key);
          resolve(null);
          return;
        }

        resolve(result.data);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteCachedData(key: string): Promise<void> {
    const db = this.ensureDB();
    const id = `cache_${key}`;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["cachedData"], "readwrite");
      const store = transaction.objectStore("cachedData");
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearExpiredCache(): Promise<void> {
    const db = this.ensureDB();
    const now = Date.now();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["cachedData"], "readwrite");
      const store = transaction.objectStore("cachedData");
      const index = store.index("expiresAt");
      const request = index.openCursor(IDBKeyRange.upperBound(now));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Sync Metadata Management
  async setSyncMetadata(
    id: string,
    metadata: Omit<SyncMetadata, "id">,
  ): Promise<void> {
    const db = this.ensureDB();
    const fullMetadata: SyncMetadata = { ...metadata, id };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["syncMetadata"], "readwrite");
      const store = transaction.objectStore("syncMetadata");
      const request = store.put(fullMetadata);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSyncMetadata(id: string): Promise<SyncMetadata | null> {
    const db = this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["syncMetadata"], "readonly");
      const store = transaction.objectStore("syncMetadata");
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // User Data Management (for offline user profiles, settings, etc.)
  async setUserData(userId: string, type: string, data: any): Promise<void> {
    const db = this.ensureDB();
    const id = `user_${userId}_${type}`;

    const userData = {
      id,
      userId,
      type,
      data,
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["userData"], "readwrite");
      const store = transaction.objectStore("userData");
      const request = store.put(userData);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getUserData(userId: string, type: string): Promise<any | null> {
    const db = this.ensureDB();
    const id = `user_${userId}_${type}`;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["userData"], "readonly");
      const store = transaction.objectStore("userData");
      const request = store.get(id);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.data : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Database maintenance
  async getStorageUsage(): Promise<{
    quota: number;
    usage: number;
    available: number;
  }> {
    if ("storage" in navigator && "estimate" in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        quota: estimate.quota || 0,
        usage: estimate.usage || 0,
        available: (estimate.quota || 0) - (estimate.usage || 0),
      };
    }
    return { quota: 0, usage: 0, available: 0 };
  }

  async clearAllData(): Promise<void> {
    const db = this.ensureDB();
    const storeNames = [
      "offlineActions",
      "cachedData",
      "syncMetadata",
      "userData",
    ];

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeNames, "readwrite");
      let completed = 0;

      const checkComplete = () => {
        completed++;
        if (completed === storeNames.length) {
          resolve();
        }
      };

      storeNames.forEach((storeName) => {
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        request.onsuccess = checkComplete;
        request.onerror = () => reject(request.error);
      });
    });
  }
}

// Singleton instance
export const offlineDB = new OfflineDB();

// Initialize the database
export const initOfflineDB = async (): Promise<void> => {
  try {
    await offlineDB.init();
    console.log("Offline database initialized successfully");
  } catch (error) {
    console.error("Failed to initialize offline database:", error);
    throw error;
  }
};
