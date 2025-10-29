"use client";

import { useState, useEffect, useCallback } from "react";
import {
  serviceWorkerManager,
  ServiceWorkerState,
  ServiceWorkerConfig,
} from "@/lib/mobile/service-worker";

export interface UseServiceWorkerOptions extends ServiceWorkerConfig {
  autoRegister?: boolean;
  onRegistered?: (registration: ServiceWorkerRegistration) => void;
  onWaiting?: (worker: ServiceWorker) => void;
  onActive?: (worker: ServiceWorker) => void;
  onError?: (error: string) => void;
  onUpdateAvailable?: () => void;
}

export interface UseServiceWorkerReturn {
  // State
  isSupported: boolean;
  isRegistered: boolean;
  isInstalling: boolean;
  isWaiting: boolean;
  isActive: boolean;
  isControlling: boolean;
  error: string | null;
  registration: ServiceWorkerRegistration | null;

  // Actions
  register: () => Promise<ServiceWorkerRegistration | null>;
  unregister: () => Promise<boolean>;
  update: () => Promise<void>;
  skipWaiting: () => Promise<void>;
  sendMessage: (message: any) => Promise<any>;
  cacheUrls: (urls: string[]) => Promise<void>;

  // Utilities
  getVersion: () => Promise<string>;
  reload: () => void;
}

/**
 * React hook for Service Worker management
 */
export function useServiceWorker(
  options: UseServiceWorkerOptions = {},
): UseServiceWorkerReturn {
  const {
    autoRegister = true,
    onRegistered,
    onWaiting,
    onActive,
    onError,
    onUpdateAvailable,
    ...swConfig
  } = options;

  const [state, setState] = useState<ServiceWorkerState>(() =>
    serviceWorkerManager.getState(),
  );
  const [isControlling, setIsControlling] = useState(false);

  // Update state when service worker state changes
  useEffect(() => {
    const updateState = () => {
      setState(serviceWorkerManager.getState());
      setIsControlling(serviceWorkerManager.isControlling());
    };

    // Set up event listeners
    serviceWorkerManager.on(
      "registered",
      (registration: ServiceWorkerRegistration) => {
        updateState();
        onRegistered?.(registration);
      },
    );

    serviceWorkerManager.on("waiting", (worker: ServiceWorker) => {
      updateState();
      onWaiting?.(worker);
      onUpdateAvailable?.();
    });

    serviceWorkerManager.on("active", (worker: ServiceWorker) => {
      updateState();
      onActive?.(worker);
    });

    serviceWorkerManager.on("error", (error: string) => {
      updateState();
      onError?.(error);
    });

    serviceWorkerManager.on("controllerchange", () => {
      updateState();
    });

    serviceWorkerManager.on("updatefound", () => {
      updateState();
    });

    // Initial state update
    updateState();

    // Cleanup
    return () => {
      // Note: In a real implementation, you'd want to remove specific listeners
      // For simplicity, we're not implementing listener removal here
    };
  }, [onRegistered, onWaiting, onActive, onError, onUpdateAvailable]);

  // Auto-register service worker
  useEffect(() => {
    if (autoRegister && state.isSupported && !state.isRegistered) {
      register();
    }
  }, [autoRegister, state.isSupported, state.isRegistered]);

  // Actions
  const register =
    useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
      if (Object.keys(swConfig).length > 0) {
        const customManager = new (
          await import("@/lib/mobile/service-worker")
        ).ServiceWorkerManager(swConfig);
        return await customManager.register();
      }
      return await serviceWorkerManager.register();
    }, [swConfig]);

  const unregister = useCallback(async (): Promise<boolean> => {
    return await serviceWorkerManager.unregister();
  }, []);

  const update = useCallback(async (): Promise<void> => {
    await serviceWorkerManager.update();
  }, []);

  const skipWaiting = useCallback(async (): Promise<void> => {
    await serviceWorkerManager.skipWaiting();
  }, []);

  const sendMessage = useCallback(async (message: any): Promise<any> => {
    return await serviceWorkerManager.sendMessage(message);
  }, []);

  const cacheUrls = useCallback(async (urls: string[]): Promise<void> => {
    await serviceWorkerManager.cacheUrls(urls);
  }, []);

  const getVersion = useCallback(async (): Promise<string> => {
    return await serviceWorkerManager.getVersion();
  }, []);

  const reload = useCallback((): void => {
    window.location.reload();
  }, []);

  return {
    // State
    isSupported: state.isSupported,
    isRegistered: state.isRegistered,
    isInstalling: state.isInstalling,
    isWaiting: state.isWaiting,
    isActive: state.isActive,
    isControlling,
    error: state.error,
    registration: state.registration,

    // Actions
    register,
    unregister,
    update,
    skipWaiting,
    sendMessage,
    cacheUrls,

    // Utilities
    getVersion,
    reload,
  };
}

/**
 * Hook for handling service worker updates
 */
export function useServiceWorkerUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const { isWaiting, skipWaiting, reload } = useServiceWorker({
    autoRegister: true,
    onUpdateAvailable: () => setUpdateAvailable(true),
  });

  const applyUpdate = useCallback(async () => {
    if (!isWaiting) return;

    setIsUpdating(true);

    try {
      await skipWaiting();
      // The controllerchange event will trigger a reload
    } catch (error) {
      console.error("Failed to apply update:", error);
      setIsUpdating(false);
    }
  }, [isWaiting, skipWaiting]);

  const dismissUpdate = useCallback(() => {
    setUpdateAvailable(false);
  }, []);

  return {
    updateAvailable,
    isUpdating,
    applyUpdate,
    dismissUpdate,
    reload,
  };
}

/**
 * Hook for service worker installation prompt
 */
export function useServiceWorkerInstall() {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  const { isSupported, isRegistered, register } = useServiceWorker({
    autoRegister: false,
  });

  useEffect(() => {
    if (isSupported && !isRegistered) {
      setShowInstallPrompt(true);
    }
  }, [isSupported, isRegistered]);

  const install = useCallback(async () => {
    setIsInstalling(true);

    try {
      await register();
      setShowInstallPrompt(false);
    } catch (error) {
      console.error("Failed to install service worker:", error);
    } finally {
      setIsInstalling(false);
    }
  }, [register]);

  const dismiss = useCallback(() => {
    setShowInstallPrompt(false);
  }, []);

  return {
    showInstallPrompt,
    isInstalling,
    install,
    dismiss,
  };
}
