"use client";

/**
 * Service Worker Registration and Management
 */

export interface ServiceWorkerConfig {
  swUrl?: string;
  scope?: string;
  updateViaCache?: "imports" | "all" | "none";
}

export interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isInstalling: boolean;
  isWaiting: boolean;
  isActive: boolean;
  registration: ServiceWorkerRegistration | null;
  error: string | null;
}

export class ServiceWorkerManager {
  private config: ServiceWorkerConfig;
  private listeners: Map<string, Function[]> = new Map();
  private state: ServiceWorkerState = {
    isSupported: false,
    isRegistered: false,
    isInstalling: false,
    isWaiting: false,
    isActive: false,
    registration: null,
    error: null,
  };

  constructor(config: ServiceWorkerConfig = {}) {
    this.config = {
      swUrl: "/sw.js",
      scope: "/",
      updateViaCache: "none",
      ...config,
    };

    this.state.isSupported = "serviceWorker" in navigator;
  }

  /**
   * Register the service worker
   */
  async register(): Promise<ServiceWorkerRegistration | null> {
    if (!this.state.isSupported) {
      const error = "Service Worker is not supported in this browser";
      this.state.error = error;
      this.emit("error", error);
      return null;
    }

    try {
      this.state.isInstalling = true;
      this.emit("installing");

      const registration = await navigator.serviceWorker.register(
        this.config.swUrl!,
        {
          scope: this.config.scope,
          updateViaCache: this.config.updateViaCache,
        },
      );

      this.state.registration = registration;
      this.state.isRegistered = true;
      this.state.isInstalling = false;

      // Set up event listeners
      this.setupEventListeners(registration);

      // Check for updates
      this.checkForUpdates(registration);

      this.emit("registered", registration);
      return registration;
    } catch (error) {
      this.state.isInstalling = false;
      this.state.error =
        error instanceof Error ? error.message : "Registration failed";
      this.emit("error", this.state.error);
      return null;
    }
  }

  /**
   * Unregister the service worker
   */
  async unregister(): Promise<boolean> {
    if (!this.state.registration) {
      return false;
    }

    try {
      const result = await this.state.registration.unregister();

      if (result) {
        this.state.isRegistered = false;
        this.state.isActive = false;
        this.state.registration = null;
        this.emit("unregistered");
      }

      return result;
    } catch (error) {
      this.state.error =
        error instanceof Error ? error.message : "Unregistration failed";
      this.emit("error", this.state.error);
      return false;
    }
  }

  /**
   * Update the service worker
   */
  async update(): Promise<void> {
    if (!this.state.registration) {
      throw new Error("Service Worker is not registered");
    }

    try {
      await this.state.registration.update();
      this.emit("updatefound");
    } catch (error) {
      this.state.error =
        error instanceof Error ? error.message : "Update failed";
      this.emit("error", this.state.error);
    }
  }

  /**
   * Skip waiting and activate new service worker
   */
  async skipWaiting(): Promise<void> {
    if (!this.state.registration?.waiting) {
      return;
    }

    // Send message to service worker to skip waiting
    this.state.registration.waiting.postMessage({ type: "SKIP_WAITING" });
  }

  /**
   * Send message to service worker
   */
  async sendMessage(message: any): Promise<any> {
    if (!this.state.registration?.active) {
      throw new Error("No active service worker");
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();

      messageChannel.port1.onmessage = (event) => {
        if (event.data.error) {
          reject(new Error(event.data.error));
        } else {
          resolve(event.data);
        }
      };

      this.state.registration!.active!.postMessage(message, [
        messageChannel.port2,
      ]);
    });
  }

  /**
   * Cache specific URLs
   */
  async cacheUrls(urls: string[]): Promise<void> {
    await this.sendMessage({
      type: "CACHE_URLS",
      urls,
    });
  }

  /**
   * Get service worker version
   */
  async getVersion(): Promise<string> {
    const response = await this.sendMessage({ type: "GET_VERSION" });
    return response.version;
  }

  /**
   * Check if service worker is controlling the page
   */
  isControlling(): boolean {
    return !!navigator.serviceWorker.controller;
  }

  /**
   * Get current state
   */
  getState(): ServiceWorkerState {
    return { ...this.state };
  }

  /**
   * Add event listener
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   */
  private emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  /**
   * Set up event listeners for service worker registration
   */
  private setupEventListeners(registration: ServiceWorkerRegistration): void {
    // Handle installing state
    if (registration.installing) {
      this.handleServiceWorkerState(registration.installing, "installing");
    }

    // Handle waiting state
    if (registration.waiting) {
      this.state.isWaiting = true;
      this.emit("waiting", registration.waiting);
    }

    // Handle active state
    if (registration.active) {
      this.state.isActive = true;
      this.emit("active", registration.active);
    }

    // Listen for updates
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (newWorker) {
        this.handleServiceWorkerState(newWorker, "updatefound");
      }
    });

    // Listen for controller changes
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      this.emit("controllerchange");
      // Reload the page to use the new service worker
      window.location.reload();
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener("message", (event) => {
      this.emit("message", event.data);
    });
  }

  /**
   * Handle service worker state changes
   */
  private handleServiceWorkerState(
    worker: ServiceWorker,
    context: string,
  ): void {
    worker.addEventListener("statechange", () => {
      console.log(`[SW] State changed (${context}):`, worker.state);

      switch (worker.state) {
        case "installing":
          this.state.isInstalling = true;
          this.emit("installing");
          break;

        case "installed":
          this.state.isInstalling = false;
          if (navigator.serviceWorker.controller) {
            // New service worker is waiting
            this.state.isWaiting = true;
            this.emit("waiting", worker);
          } else {
            // First time install
            this.state.isActive = true;
            this.emit("active", worker);
          }
          break;

        case "activating":
          this.emit("activating");
          break;

        case "activated":
          this.state.isWaiting = false;
          this.state.isActive = true;
          this.emit("activated", worker);
          break;

        case "redundant":
          this.emit("redundant");
          break;
      }
    });
  }

  /**
   * Check for service worker updates
   */
  private checkForUpdates(registration: ServiceWorkerRegistration): void {
    // Check for updates every 60 seconds
    setInterval(() => {
      registration.update().catch((error) => {
        console.warn("[SW] Update check failed:", error);
      });
    }, 60000);

    // Check for updates when the page becomes visible
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        registration.update().catch((error) => {
          console.warn("[SW] Update check failed:", error);
        });
      }
    });
  }
}

/**
 * Default service worker manager instance
 */
export const serviceWorkerManager = new ServiceWorkerManager();

/**
 * Register service worker with default configuration
 */
export async function registerServiceWorker(
  config?: ServiceWorkerConfig,
): Promise<ServiceWorkerRegistration | null> {
  const manager = config
    ? new ServiceWorkerManager(config)
    : serviceWorkerManager;
  return await manager.register();
}

/**
 * Unregister service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  return await serviceWorkerManager.unregister();
}

/**
 * Check if service worker is supported
 */
export function isServiceWorkerSupported(): boolean {
  return "serviceWorker" in navigator;
}

/**
 * Check if service worker is registered
 */
export function isServiceWorkerRegistered(): boolean {
  return serviceWorkerManager.getState().isRegistered;
}

/**
 * Get service worker registration
 */
export function getServiceWorkerRegistration(): ServiceWorkerRegistration | null {
  return serviceWorkerManager.getState().registration;
}
