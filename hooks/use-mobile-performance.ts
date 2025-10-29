"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  networkService,
  performanceMonitorService,
  performanceUtils,
  type NetworkInfo,
} from "@/lib/mobile/performance";
import {
  componentLoader,
  bundleAnalyzer,
  type LoadingState,
} from "@/lib/mobile/code-splitting";

export interface PerformanceMetrics {
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  memoryUsage?: number;
  networkType?: string;
  loadTime?: number;
}

export interface BundleMetrics {
  totalBundles: number;
  totalSize: number;
  averageLoadTime: number;
  recommendations: Array<{
    bundle: string;
    recommendation: string;
    impact: "high" | "medium" | "low";
  }>;
}

/**
 * Hook for monitoring mobile performance metrics
 */
export function useMobilePerformance() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  const [bundleMetrics, setBundleMetrics] = useState<BundleMetrics | null>(
    null,
  );

  useEffect(() => {
    // Initialize network monitoring
    const updateNetworkInfo = (info: NetworkInfo) => {
      setNetworkInfo(info);
      setIsSlowConnection(networkService.isSlowConnection());
    };

    const unsubscribe = networkService.onNetworkChange(updateNetworkInfo);

    // Get initial network info
    const initialInfo = networkService.getNetworkInfo();
    if (initialInfo) {
      updateNetworkInfo(initialInfo);
    }

    return unsubscribe;
  }, []);

  useEffect(() => {
    // Update performance metrics periodically
    const updateMetrics = () => {
      const currentMetrics = performanceMonitorService.getMetrics();
      setMetrics({
        lcp: currentMetrics.lcp,
        fid: currentMetrics.fid,
        cls: currentMetrics.cls,
        memoryUsage: currentMetrics.memory_used,
        networkType: networkInfo?.effectiveType,
        loadTime: performance.now(),
      });
    };

    const interval = setInterval(updateMetrics, 5000);
    updateMetrics(); // Initial update

    return () => clearInterval(interval);
  }, [networkInfo]);

  useEffect(() => {
    // Update bundle metrics
    const updateBundleMetrics = () => {
      setBundleMetrics(bundleAnalyzer.generateReport());
    };

    const interval = setInterval(updateBundleMetrics, 10000);
    updateBundleMetrics(); // Initial update

    return () => clearInterval(interval);
  }, []);

  const reportMetrics = useCallback(() => {
    performanceMonitorService.reportMetrics();
  }, []);

  return {
    metrics,
    networkInfo,
    isSlowConnection,
    bundleMetrics,
    reportMetrics,
  };
}

/**
 * Hook for network-aware loading strategies
 */
export function useNetworkAwareLoading() {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [loadingStrategy, setLoadingStrategy] = useState<
    "aggressive" | "conservative" | "minimal"
  >("conservative");

  useEffect(() => {
    const updateStrategy = (info: NetworkInfo) => {
      setNetworkInfo(info);

      if (
        info.saveData ||
        info.effectiveType === "slow-2g" ||
        info.effectiveType === "2g"
      ) {
        setLoadingStrategy("minimal");
      } else if (info.effectiveType === "4g" && info.downlink > 5) {
        setLoadingStrategy("aggressive");
      } else {
        setLoadingStrategy("conservative");
      }
    };

    const unsubscribe = networkService.onNetworkChange(updateStrategy);

    const initialInfo = networkService.getNetworkInfo();
    if (initialInfo) {
      updateStrategy(initialInfo);
    }

    return unsubscribe;
  }, []);

  const shouldPreload = useCallback(
    (priority: "high" | "medium" | "low" = "medium") => {
      switch (loadingStrategy) {
        case "aggressive":
          return true;
        case "conservative":
          return priority === "high";
        case "minimal":
          return false;
        default:
          return priority === "high";
      }
    },
    [loadingStrategy],
  );

  const getImageQuality = useCallback(() => {
    switch (loadingStrategy) {
      case "aggressive":
        return 90;
      case "conservative":
        return 75;
      case "minimal":
        return 60;
      default:
        return 75;
    }
  }, [loadingStrategy]);

  const getMaxConcurrentRequests = useCallback(() => {
    switch (loadingStrategy) {
      case "aggressive":
        return 6;
      case "conservative":
        return 3;
      case "minimal":
        return 1;
      default:
        return 3;
    }
  }, [loadingStrategy]);

  return {
    networkInfo,
    loadingStrategy,
    shouldPreload,
    getImageQuality,
    getMaxConcurrentRequests,
  };
}

/**
 * Hook for component lazy loading with performance tracking
 */
export function useLazyComponent(
  componentName: string,
  importFn: () => Promise<any>,
  options: {
    preload?: boolean;
    timeout?: number;
    onError?: (error: Error) => void;
  } = {},
) {
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [component, setComponent] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);
  const loadStartTime = useRef<number>(0);

  const loadComponent = useCallback(async () => {
    if (loadingState === "loading" || loadingState === "loaded") return;

    setLoadingState("loading");
    setError(null);
    loadStartTime.current = performance.now();

    try {
      const loadedComponent = await componentLoader.loadComponent(
        importFn,
        componentName,
        options,
      );

      setComponent(loadedComponent);
      setLoadingState("loaded");

      // Track bundle usage
      bundleAnalyzer.trackUsage(componentName);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Component load failed");
      setError(error);
      setLoadingState("error");
      options.onError?.(error);
    }
  }, [componentName, importFn, options, loadingState]);

  useEffect(() => {
    if (options.preload) {
      loadComponent();
    }
  }, [options.preload, loadComponent]);

  return {
    component,
    loadingState,
    error,
    loadComponent,
  };
}

/**
 * Hook for image optimization and lazy loading
 */
export function useImageOptimization() {
  const { getImageQuality } = useNetworkAwareLoading();
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const getOptimizedImageUrl = useCallback(
    (
      src: string,
      options: {
        width?: number;
        height?: number;
        quality?: number;
        format?: "webp" | "avif" | "jpeg" | "png";
      } = {},
    ) => {
      const quality = options.quality || getImageQuality();
      const params = new URLSearchParams();

      if (options.width) params.set("w", options.width.toString());
      if (options.height) params.set("h", options.height.toString());
      params.set("q", quality.toString());

      if (options.format) params.set("f", options.format);

      return `${src}?${params.toString()}`;
    },
    [getImageQuality],
  );

  const preloadImage = useCallback(
    (src: string) => {
      if (loadedImages.has(src) || failedImages.has(src)) return;

      const img = new Image();
      img.onload = () => {
        setLoadedImages((prev) => new Set(prev).add(src));
      };
      img.onerror = () => {
        setFailedImages((prev) => new Set(prev).add(src));
      };
      img.src = src;
    },
    [loadedImages, failedImages],
  );

  const isImageLoaded = useCallback(
    (src: string) => {
      return loadedImages.has(src);
    },
    [loadedImages],
  );

  const isImageFailed = useCallback(
    (src: string) => {
      return failedImages.has(src);
    },
    [failedImages],
  );

  return {
    getOptimizedImageUrl,
    preloadImage,
    isImageLoaded,
    isImageFailed,
  };
}

/**
 * Hook for memory usage monitoring
 */
export function useMemoryMonitoring() {
  const [memoryInfo, setMemoryInfo] = useState<{
    used: number;
    total: number;
    limit: number;
    percentage: number;
  } | null>(null);
  const [isLowMemory, setIsLowMemory] = useState(false);

  useEffect(() => {
    const updateMemoryInfo = () => {
      if ("memory" in performance) {
        const memory = (performance as any).memory;
        const used = memory.usedJSHeapSize;
        const total = memory.totalJSHeapSize;
        const limit = memory.jsHeapSizeLimit;
        const percentage = (used / limit) * 100;

        setMemoryInfo({ used, total, limit, percentage });
        setIsLowMemory(percentage > 80);
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000);

    return () => clearInterval(interval);
  }, []);

  const clearMemory = useCallback(() => {
    // Clear component cache if memory is low
    if (isLowMemory) {
      componentLoader.clearCache();
    }

    // Force garbage collection if available
    if ("gc" in window) {
      (window as any).gc();
    }
  }, [isLowMemory]);

  return {
    memoryInfo,
    isLowMemory,
    clearMemory,
  };
}

/**
 * Hook for performance-aware animations
 */
export function usePerformanceAwareAnimations() {
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);
  const [animationQuality, setAnimationQuality] = useState<
    "high" | "medium" | "low"
  >("high");

  useEffect(() => {
    // Check user preference for reduced motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setShouldReduceMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setShouldReduceMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    // Adjust animation quality based on device capabilities
    const isLowEndDevice = performanceUtils.isLowEndDevice();
    const networkInfo = networkService.getNetworkInfo();
    const isSlowConnection = networkService.isSlowConnection();

    if (shouldReduceMotion || isLowEndDevice || isSlowConnection) {
      setAnimationQuality("low");
    } else if (networkInfo?.effectiveType === "4g") {
      setAnimationQuality("high");
    } else {
      setAnimationQuality("medium");
    }
  }, [shouldReduceMotion]);

  const getAnimationConfig = useCallback(() => {
    switch (animationQuality) {
      case "high":
        return {
          duration: 300,
          easing: "cubic-bezier(0.4, 0, 0.2, 1)",
          enableParallax: true,
          enableBlur: true,
        };
      case "medium":
        return {
          duration: 200,
          easing: "ease-out",
          enableParallax: false,
          enableBlur: false,
        };
      case "low":
        return {
          duration: 100,
          easing: "linear",
          enableParallax: false,
          enableBlur: false,
        };
      default:
        return {
          duration: 200,
          easing: "ease-out",
          enableParallax: false,
          enableBlur: false,
        };
    }
  }, [animationQuality]);

  return {
    shouldReduceMotion,
    animationQuality,
    getAnimationConfig,
  };
}
