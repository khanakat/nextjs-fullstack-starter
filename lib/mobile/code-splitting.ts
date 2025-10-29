/**
 * Code Splitting and Bundle Optimization for Mobile
 * Provides dynamic imports, route-based splitting, and mobile-optimized loading
 */

import React from "react";
import { networkService } from "./performance";

// Component loading states
export type LoadingState = "idle" | "loading" | "loaded" | "error";

export interface ComponentLoadOptions {
  preload?: boolean;
  timeout?: number;
  fallback?: React.ComponentType;
  onError?: (error: Error) => void;
}

export interface BundleInfo {
  name: string;
  size: number;
  loadTime: number;
  cached: boolean;
}

/**
 * Dynamic Component Loader
 * Handles lazy loading of React components with network awareness
 */
export class ComponentLoader {
  private static cache = new Map<string, Promise<any>>();
  private static loadingStates = new Map<string, LoadingState>();
  private static bundleInfo = new Map<string, BundleInfo>();

  /**
   * Dynamically import a component with caching and error handling
   */
  static async loadComponent<T = any>(
    importFn: () => Promise<{ default: T }>,
    componentName: string,
    options: ComponentLoadOptions = {},
  ): Promise<T> {
    const { timeout = 10000, onError } = options;

    // Check cache first
    if (this.cache.has(componentName)) {
      const cached = await this.cache.get(componentName)!;
      this.loadingStates.set(componentName, "loaded");
      return cached.default;
    }

    this.loadingStates.set(componentName, "loading");
    const startTime = performance.now();

    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error(`Component ${componentName} load timeout`)),
          timeout,
        );
      });

      // Race between import and timeout
      const importPromise = importFn();
      this.cache.set(componentName, importPromise);

      const result = await Promise.race([importPromise, timeoutPromise]);
      const loadTime = performance.now() - startTime;

      // Store bundle info
      this.bundleInfo.set(componentName, {
        name: componentName,
        size: this.estimateBundleSize(result),
        loadTime,
        cached: false,
      });

      this.loadingStates.set(componentName, "loaded");
      return result.default;
    } catch (error) {
      this.loadingStates.set(componentName, "error");
      this.cache.delete(componentName); // Remove failed cache entry

      const err =
        error instanceof Error ? error : new Error("Component load failed");
      onError?.(err);
      throw err;
    }
  }

  /**
   * Preload components based on network conditions
   */
  static preloadComponents(
    components: Array<{
      name: string;
      importFn: () => Promise<any>;
      priority?: "high" | "medium" | "low";
    }>,
  ): void {
    const isSlowConnection = networkService.isSlowConnection();
    const isFastConnection = networkService.isFastConnection();

    // Sort by priority
    const sortedComponents = components.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return (
        priorityOrder[b.priority || "medium"] -
        priorityOrder[a.priority || "medium"]
      );
    });

    // Limit preloading based on network conditions
    let maxPreload = 3;
    if (isSlowConnection) maxPreload = 1;
    else if (isFastConnection) maxPreload = 5;

    const componentsToPreload = sortedComponents.slice(0, maxPreload);

    // Use requestIdleCallback for non-blocking preloading
    const preloadNext = (index: number) => {
      if (index >= componentsToPreload.length) return;

      const component = componentsToPreload[index];

      if ("requestIdleCallback" in window) {
        requestIdleCallback(() => {
          this.loadComponent(component.importFn, component.name).catch(
            () => {},
          ); // Ignore preload errors
          preloadNext(index + 1);
        });
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => {
          this.loadComponent(component.importFn, component.name).catch(
            () => {},
          );
          preloadNext(index + 1);
        }, 100);
      }
    };

    preloadNext(0);
  }

  /**
   * Get loading state for a component
   */
  static getLoadingState(componentName: string): LoadingState {
    return this.loadingStates.get(componentName) || "idle";
  }

  /**
   * Get bundle information
   */
  static getBundleInfo(): BundleInfo[] {
    return Array.from(this.bundleInfo.values());
  }

  /**
   * Clear cache (useful for development)
   */
  static clearCache(): void {
    this.cache.clear();
    this.loadingStates.clear();
    this.bundleInfo.clear();
  }

  private static estimateBundleSize(module: any): number {
    // Rough estimation based on stringified module
    try {
      return JSON.stringify(module).length;
    } catch {
      return 0;
    }
  }
}

/**
 * Route-based Code Splitting Configuration
 */
export const routeComponents = {
  // Core dashboard components
  dashboard: () => import("@/components/dashboard/dashboard"),
  analytics: () => import("@/components/analytics/analytics-dashboard"),
  workflows: () => import("@/components/workflows/workflow-list"),

  // Mobile-specific components
  mobile: () => import("@/components/mobile/mobile-dashboard"),
  mobileWorkflows: () => import("@/components/mobile/mobile-workflows"),
  mobileSettings: () => import("@/components/mobile/mobile-settings"),

  // Settings and admin - using existing components
  settings: () => import("@/components/mobile/mobile-settings"),
  admin: () => import("@/components/audit/audit-dashboard"),

  // Integration components
  integrations: () => import("@/components/integrations/connection-manager"),
  apiKeys: () => import("@/components/security/api-key-management"),

  // Collaboration components
  collaboration: () =>
    import("@/components/collaboration/CollaborationProvider"),
  chat: () => import("@/components/collaboration/CommentSystem"),

  // Third-party libraries
  chartLibrary: () => import("recharts"),
  markdownEditor: () => import("@/components/ui/advanced/rich-text-editor"),
  codeEditor: () => import("@/components/ui/advanced/rich-text-editor"),
};

/**
 * Mobile-Optimized Bundle Splitter
 * Splits bundles based on mobile usage patterns
 */
export class MobileBundleSplitter {
  private static mobileChunks = new Set([
    "mobile-dashboard",
    "mobile-navigation",
    "mobile-workflows",
    "touch-components",
    "offline-sync",
  ]);

  private static desktopChunks = new Set([
    "desktop-dashboard",
    "advanced-charts",
    "desktop-workflows",
    "keyboard-shortcuts",
  ]);

  /**
   * Determine which chunks to load based on device type
   */
  static getRequiredChunks(): string[] {
    const isMobile = this.isMobileDevice();
    const isTablet = this.isTabletDevice();

    const baseChunks = ["core", "auth", "api"];

    if (isMobile) {
      return [...baseChunks, ...this.mobileChunks];
    } else if (isTablet) {
      return [...baseChunks, ...this.mobileChunks, "tablet-specific"];
    } else {
      return [...baseChunks, ...this.desktopChunks];
    }
  }

  /**
   * Preload critical chunks for mobile
   */
  static preloadCriticalChunks(): void {
    const criticalChunks = this.getCriticalChunks();

    criticalChunks.forEach((chunk) => {
      const link = document.createElement("link");
      link.rel = "modulepreload";
      link.href = `/chunks/${chunk}.js`;
      document.head.appendChild(link);
    });
  }

  private static getCriticalChunks(): string[] {
    const isMobile = this.isMobileDevice();

    if (isMobile) {
      return ["mobile-dashboard", "mobile-navigation", "touch-components"];
    }

    return ["desktop-dashboard", "navigation"];
  }

  private static isMobileDevice(): boolean {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent);
  }

  private static isTabletDevice(): boolean {
    if (typeof window === "undefined") return false;
    return window.innerWidth >= 768 && window.innerWidth < 1024;
  }
}

/**
 * Progressive Loading Strategy
 * Loads components progressively based on user interaction
 */
export class ProgressiveLoader {
  private static loadQueue: Array<{
    name: string;
    importFn: () => Promise<any>;
    priority: number;
  }> = [];

  private static isLoading = false;

  /**
   * Add component to progressive loading queue
   */
  static enqueue(
    name: string,
    importFn: () => Promise<any>,
    priority: number = 1,
  ): void {
    this.loadQueue.push({ name, importFn, priority });
    this.loadQueue.sort((a, b) => b.priority - a.priority);

    if (!this.isLoading) {
      this.processQueue();
    }
  }

  /**
   * Process the loading queue
   */
  private static async processQueue(): Promise<void> {
    if (this.loadQueue.length === 0 || this.isLoading) return;

    this.isLoading = true;
    const isSlowConnection = networkService.isSlowConnection();

    while (this.loadQueue.length > 0) {
      const item = this.loadQueue.shift()!;

      try {
        await ComponentLoader.loadComponent(item.importFn, item.name);

        // Add delay on slow connections to prevent overwhelming
        if (isSlowConnection) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.warn(`Failed to progressively load ${item.name}:`, error);
      }
    }

    this.isLoading = false;
  }

  /**
   * Load components when user is idle
   */
  static loadOnIdle(components: typeof routeComponents): void {
    const componentEntries = Object.entries(components);

    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => {
        componentEntries.forEach(([name, importFn], index) => {
          this.enqueue(name, importFn, componentEntries.length - index);
        });
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        componentEntries.forEach(([name, importFn], index) => {
          this.enqueue(name, importFn, componentEntries.length - index);
        });
      }, 2000);
    }
  }
}

/**
 * Bundle Analysis and Optimization
 */
export class BundleAnalyzer {
  private static bundleMetrics = new Map<
    string,
    {
      size: number;
      loadTime: number;
      usage: number;
      lastUsed: number;
    }
  >();

  /**
   * Track bundle usage
   */
  static trackUsage(bundleName: string): void {
    const current = this.bundleMetrics.get(bundleName) || {
      size: 0,
      loadTime: 0,
      usage: 0,
      lastUsed: 0,
    };

    current.usage += 1;
    current.lastUsed = Date.now();

    this.bundleMetrics.set(bundleName, current);
  }

  /**
   * Get bundle optimization recommendations
   */
  static getOptimizationRecommendations(): Array<{
    bundle: string;
    recommendation: string;
    impact: "high" | "medium" | "low";
  }> {
    const recommendations: Array<{
      bundle: string;
      recommendation: string;
      impact: "high" | "medium" | "low";
    }> = [];

    this.bundleMetrics.forEach((metrics, bundleName) => {
      const daysSinceLastUse =
        (Date.now() - metrics.lastUsed) / (1000 * 60 * 60 * 24);

      if (metrics.usage === 0) {
        recommendations.push({
          bundle: bundleName,
          recommendation: "Consider removing unused bundle",
          impact: "high",
        });
      } else if (daysSinceLastUse > 30) {
        recommendations.push({
          bundle: bundleName,
          recommendation: "Bundle rarely used, consider lazy loading",
          impact: "medium",
        });
      } else if (metrics.loadTime > 3000) {
        recommendations.push({
          bundle: bundleName,
          recommendation: "Bundle load time is slow, consider splitting",
          impact: "high",
        });
      }
    });

    return recommendations;
  }

  /**
   * Generate bundle report
   */
  static generateReport(): {
    totalBundles: number;
    totalSize: number;
    averageLoadTime: number;
    recommendations: Array<{
      bundle: string;
      recommendation: string;
      impact: "high" | "medium" | "low";
    }>;
  } {
    const bundles = Array.from(this.bundleMetrics.values());

    return {
      totalBundles: bundles.length,
      totalSize: bundles.reduce((sum, b) => sum + b.size, 0),
      averageLoadTime:
        bundles.reduce((sum, b) => sum + b.loadTime, 0) / bundles.length || 0,
      recommendations: this.getOptimizationRecommendations(),
    };
  }
}

// Utility functions for code splitting
export const codeSplittingUtils = {
  /**
   * Create a lazy component with error boundary
   */
  createLazyComponent<T extends React.ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    fallback?: React.ComponentType,
  ): React.LazyExoticComponent<T> {
    return React.lazy(async () => {
      try {
        const moduleResult = await importFn();
        return moduleResult;
      } catch (error) {
        console.error("Failed to load component:", error);

        if (fallback) {
          return { default: fallback as T };
        }

        throw error;
      }
    });
  },

  /**
   * Preload route components based on current route
   */
  preloadRouteComponents(currentRoute: string): void {
    const routePreloadMap: Record<string, string[]> = {
      "/dashboard": ["analytics", "workflows"],
      "/workflows": ["dashboard", "integrations"],
      "/mobile": ["mobileWorkflows", "mobileSettings"],
      "/settings": ["admin", "apiKeys"],
    };

    const componentsToPreload = routePreloadMap[currentRoute] || [];

    ComponentLoader.preloadComponents(
      componentsToPreload.map((name) => ({
        name,
        importFn: routeComponents[name as keyof typeof routeComponents],
        priority: "medium",
      })),
    );
  },
};

// Export instances
export const componentLoader = ComponentLoader;
export const mobileBundleSplitter = MobileBundleSplitter;
export const progressiveLoader = ProgressiveLoader;
export const bundleAnalyzer = BundleAnalyzer;
