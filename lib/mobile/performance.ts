/**
 * Mobile Performance Optimization Utilities
 * Provides image optimization, lazy loading, and network-aware strategies
 */

// Network connection types
export type NetworkType = "slow-2g" | "2g" | "3g" | "4g" | "unknown";
export type EffectiveType = "slow-2g" | "2g" | "3g" | "4g";

export interface NetworkInfo {
  type: NetworkType;
  effectiveType: EffectiveType;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

export interface ImageOptimizationOptions {
  quality?: number;
  format?: "webp" | "avif" | "jpeg" | "png";
  width?: number;
  height?: number;
  blur?: boolean;
  priority?: boolean;
}

export interface LazyLoadOptions {
  rootMargin?: string;
  threshold?: number;
  enableOnSlowConnection?: boolean;
}

/**
 * Network Information Service
 * Provides network connection details and adaptive loading strategies
 */
export class NetworkService {
  private static instance: NetworkService;
  private networkInfo: NetworkInfo | null = null;
  private listeners: ((info: NetworkInfo) => void)[] = [];

  static getInstance(): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService();
    }
    return NetworkService.instance;
  }

  constructor() {
    this.initializeNetworkMonitoring();
  }

  private initializeNetworkMonitoring(): void {
    if (typeof window === "undefined") return;

    // Check for Network Information API support
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    if (connection) {
      this.updateNetworkInfo(connection);

      // Listen for network changes
      connection.addEventListener("change", () => {
        this.updateNetworkInfo(connection);
      });
    } else {
      // Fallback: estimate based on timing
      this.estimateNetworkSpeed();
    }

    // Listen for online/offline events
    window.addEventListener("online", () => this.handleConnectionChange());
    window.addEventListener("offline", () => this.handleConnectionChange());
  }

  private updateNetworkInfo(connection: any): void {
    this.networkInfo = {
      type: connection.type || "unknown",
      effectiveType: connection.effectiveType || "4g",
      downlink: connection.downlink || 10,
      rtt: connection.rtt || 100,
      saveData: connection.saveData || false,
    };

    this.notifyListeners();
  }

  private async estimateNetworkSpeed(): Promise<void> {
    try {
      const startTime = performance.now();
      await fetch("/api/ping", {
        method: "HEAD",
        cache: "no-cache",
      });
      const endTime = performance.now();
      const rtt = endTime - startTime;

      // Estimate effective type based on RTT
      let effectiveType: EffectiveType = "4g";
      if (rtt > 2000) effectiveType = "slow-2g";
      else if (rtt > 1400) effectiveType = "2g";
      else if (rtt > 270) effectiveType = "3g";

      this.networkInfo = {
        type: "unknown",
        effectiveType,
        downlink: rtt < 270 ? 10 : rtt < 1400 ? 1.5 : 0.5,
        rtt,
        saveData: false,
      };

      this.notifyListeners();
    } catch (error) {
      console.warn("Failed to estimate network speed:", error);
    }
  }

  private handleConnectionChange(): void {
    if (navigator.onLine && this.networkInfo) {
      this.notifyListeners();
    }
  }

  private notifyListeners(): void {
    if (this.networkInfo) {
      this.listeners.forEach((listener) => listener(this.networkInfo!));
    }
  }

  getNetworkInfo(): NetworkInfo | null {
    return this.networkInfo;
  }

  isSlowConnection(): boolean {
    if (!this.networkInfo) return false;
    return (
      this.networkInfo.effectiveType === "slow-2g" ||
      this.networkInfo.effectiveType === "2g" ||
      this.networkInfo.saveData
    );
  }

  isFastConnection(): boolean {
    if (!this.networkInfo) return true;
    return (
      this.networkInfo.effectiveType === "4g" && this.networkInfo.downlink > 5
    );
  }

  onNetworkChange(callback: (info: NetworkInfo) => void): () => void {
    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
}

/**
 * Image Optimization Service
 * Provides adaptive image loading based on network conditions
 */
export class ImageOptimizationService {
  private networkService: NetworkService;

  constructor() {
    this.networkService = NetworkService.getInstance();
  }

  getOptimizedImageUrl(
    src: string,
    options: ImageOptimizationOptions = {},
  ): string {
    const isSlowConnection = this.networkService.isSlowConnection();

    // Adjust quality based on network conditions
    let quality = options.quality || 80;
    if (isSlowConnection) {
      quality = Math.min(quality, 60);
    }

    // Adjust dimensions for mobile
    const isMobile = window.innerWidth < 768;
    let { width, height } = options;

    if (isMobile && !width && !height) {
      width = Math.min(window.innerWidth * window.devicePixelRatio, 800);
    }

    // Build optimization parameters
    const params = new URLSearchParams();
    if (width) params.set("w", width.toString());
    if (height) params.set("h", height.toString());
    params.set("q", quality.toString());

    // Choose format based on browser support and network
    const format = this.getBestFormat(options.format, isSlowConnection);
    if (format) params.set("f", format);

    if (options.blur) params.set("blur", "5");

    return `${src}?${params.toString()}`;
  }

  private getBestFormat(
    preferredFormat?: string,
    isSlowConnection?: boolean,
  ): string {
    if (preferredFormat) return preferredFormat;

    // Check browser support
    const supportsWebP = this.supportsFormat("webp");
    const supportsAVIF = this.supportsFormat("avif");

    if (isSlowConnection) {
      // Prioritize smaller file sizes
      if (supportsAVIF) return "avif";
      if (supportsWebP) return "webp";
      return "jpeg";
    }

    // Balance quality and size
    if (supportsWebP) return "webp";
    return "jpeg";
  }

  private supportsFormat(format: string): boolean {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;

    try {
      return (
        canvas.toDataURL(`image/${format}`).indexOf(`data:image/${format}`) ===
        0
      );
    } catch {
      return false;
    }
  }

  preloadCriticalImages(urls: string[]): void {
    const isSlowConnection = this.networkService.isSlowConnection();

    // Limit preloading on slow connections
    const maxPreload = isSlowConnection ? 2 : 5;
    const urlsToPreload = urls.slice(0, maxPreload);

    urlsToPreload.forEach((url) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = url;
      document.head.appendChild(link);
    });
  }
}

/**
 * Lazy Loading Service
 * Implements intersection observer-based lazy loading
 */
export class LazyLoadService {
  private observer: IntersectionObserver | null = null;
  private networkService: NetworkService;

  constructor() {
    this.networkService = NetworkService.getInstance();
    this.initializeObserver();
  }

  private initializeObserver(): void {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      return;
    }

    const options: IntersectionObserverInit = {
      rootMargin: "50px 0px",
      threshold: 0.1,
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          this.loadElement(element);
          this.observer?.unobserve(element);
        }
      });
    }, options);
  }

  observe(element: HTMLElement, options: LazyLoadOptions = {}): void {
    if (!this.observer) {
      // Fallback: load immediately
      this.loadElement(element);
      return;
    }

    const isSlowConnection = this.networkService.isSlowConnection();

    if (isSlowConnection && !options.enableOnSlowConnection) {
      // Skip lazy loading on slow connections for critical content
      this.loadElement(element);
      return;
    }

    this.observer.observe(element);
  }

  private loadElement(element: HTMLElement): void {
    if (element.tagName === "IMG") {
      const img = element as HTMLImageElement;
      const dataSrc = img.dataset.src;

      if (dataSrc) {
        img.src = dataSrc;
        img.removeAttribute("data-src");
      }
    } else {
      // Handle background images
      const dataBg = element.dataset.bg;
      if (dataBg) {
        element.style.backgroundImage = `url(${dataBg})`;
        element.removeAttribute("data-bg");
      }
    }

    element.classList.add("loaded");
  }

  disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

/**
 * Performance Monitoring Service
 * Tracks and reports mobile performance metrics
 */
export class PerformanceMonitorService {
  private metrics: Map<string, number> = new Map();
  private networkService: NetworkService;

  constructor() {
    this.networkService = NetworkService.getInstance();
    this.initializeMonitoring();
  }

  private initializeMonitoring(): void {
    if (typeof window === "undefined") return;

    // Monitor Core Web Vitals
    this.observeWebVitals();

    // Monitor resource loading
    this.observeResourceTiming();

    // Monitor memory usage (if available)
    this.observeMemoryUsage();
  }

  private observeWebVitals(): void {
    // Largest Contentful Paint (LCP)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.set("lcp", lastEntry.startTime);
    }).observe({ entryTypes: ["largest-contentful-paint"] });

    // First Input Delay (FID)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        this.metrics.set(
          "fid",
          (entry as any).processingStart - entry.startTime,
        );
      });
    }).observe({ entryTypes: ["first-input"] });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      });
      this.metrics.set("cls", clsValue);
    }).observe({ entryTypes: ["layout-shift"] });
  }

  private observeResourceTiming(): void {
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (
          entry.name.includes(".jpg") ||
          entry.name.includes(".png") ||
          entry.name.includes(".webp")
        ) {
          this.metrics.set(`image_load_${Date.now()}`, entry.duration);
        }
      });
    }).observe({ entryTypes: ["resource"] });
  }

  private observeMemoryUsage(): void {
    if ("memory" in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.metrics.set("memory_used", memory.usedJSHeapSize);
        this.metrics.set("memory_total", memory.totalJSHeapSize);
        this.metrics.set("memory_limit", memory.jsHeapSizeLimit);
      }, 30000); // Check every 30 seconds
    }
  }

  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  reportMetrics(): void {
    const metrics = this.getMetrics();
    const networkInfo = this.networkService.getNetworkInfo();

    // Send metrics to analytics endpoint
    fetch("/api/analytics/performance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        metrics,
        networkInfo,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
      }),
    }).catch((error) => {
      console.warn("Failed to report performance metrics:", error);
    });
  }
}

// Utility functions
export const performanceUtils = {
  // Debounce function for input events
  debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number,
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  },

  // Throttle function for scroll/resize events
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number,
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  // Check if device has limited resources
  isLowEndDevice(): boolean {
    if (typeof navigator === "undefined") return false;

    const memory = (navigator as any).deviceMemory;
    const cores = navigator.hardwareConcurrency;

    return (memory && memory < 4) || (cores && cores < 4);
  },

  // Get device pixel ratio for high-DPI displays
  getDevicePixelRatio(): number {
    return typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  },

  // Check if user prefers reduced motion
  prefersReducedMotion(): boolean {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  },
};

// Export singleton instances
export const networkService = NetworkService.getInstance();
export const imageOptimizationService = new ImageOptimizationService();
export const lazyLoadService = new LazyLoadService();
export const performanceMonitorService = new PerformanceMonitorService();
