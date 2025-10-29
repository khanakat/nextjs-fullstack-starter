/**
 * Sistema de Monitoreo de Performance
 *
 * Implementa métricas de performance en tiempo real:
 * - Core Web Vitals (LCP, FID, CLS)
 * - Métricas de carga y renderizado
 * - Monitoreo de memoria y CPU
 * - Alertas automáticas
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  url: string;
  userAgent: string;
}

interface WebVitalsMetric extends PerformanceMetric {
  rating: "good" | "needs-improvement" | "poor";
  delta: number;
}

interface PerformanceAlert {
  type: "warning" | "critical";
  metric: string;
  value: number;
  threshold: number;
  timestamp: number;
  message: string;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private alerts: PerformanceAlert[] = [];
  private observers: PerformanceObserver[] = [];
  private thresholds = {
    lcp: { good: 2500, poor: 4000 },
    fid: { good: 100, poor: 300 },
    cls: { good: 0.1, poor: 0.25 },
    ttfb: { good: 800, poor: 1800 },
    fcp: { good: 1800, poor: 3000 },
  };

  constructor() {
    this.initializeObservers();
    this.startMemoryMonitoring();
  }

  private initializeObservers() {
    // Observer para Navigation Timing
    if ("PerformanceObserver" in window) {
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processNavigationEntry(entry as PerformanceNavigationTiming);
        }
      });
      navObserver.observe({ entryTypes: ["navigation"] });
      this.observers.push(navObserver);

      // Observer para Resource Timing
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processResourceEntry(entry as PerformanceResourceTiming);
        }
      });
      resourceObserver.observe({ entryTypes: ["resource"] });
      this.observers.push(resourceObserver);

      // Observer para Paint Timing
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processPaintEntry(entry as PerformancePaintTiming);
        }
      });
      paintObserver.observe({ entryTypes: ["paint"] });
      this.observers.push(paintObserver);

      // Observer para Layout Shift
      const layoutObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processLayoutShiftEntry(entry as any);
        }
      });
      layoutObserver.observe({ entryTypes: ["layout-shift"] });
      this.observers.push(layoutObserver);
    }
  }

  private processNavigationEntry(entry: PerformanceNavigationTiming) {
    const startTime = entry.startTime || 0;
    const metrics = {
      ttfb: entry.responseStart - entry.requestStart,
      domContentLoaded: entry.domContentLoadedEventEnd - startTime,
      loadComplete: entry.loadEventEnd - startTime,
      domInteractive: entry.domInteractive - startTime,
    };

    Object.entries(metrics).forEach(([name, value]) => {
      this.recordMetric({
        name,
        value,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      });
    });

    // Verificar thresholds
    if (metrics.ttfb > this.thresholds.ttfb.poor) {
      this.createAlert(
        "critical",
        "ttfb",
        metrics.ttfb,
        this.thresholds.ttfb.poor,
      );
    }
  }

  private processResourceEntry(entry: PerformanceResourceTiming) {
    const loadTime = entry.responseEnd - entry.startTime;

    this.recordMetric({
      name: "resource-load-time",
      value: loadTime,
      timestamp: Date.now(),
      url: entry.name,
      userAgent: navigator.userAgent,
    });

    // Alertar sobre recursos lentos
    if (loadTime > 5000) {
      this.createAlert("warning", "slow-resource", loadTime, 5000);
    }
  }

  private processPaintEntry(entry: PerformancePaintTiming) {
    this.recordMetric({
      name: entry.name,
      value: entry.startTime,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    });

    // Verificar FCP
    if (
      entry.name === "first-contentful-paint" &&
      entry.startTime > this.thresholds.fcp.poor
    ) {
      this.createAlert(
        "critical",
        "fcp",
        entry.startTime,
        this.thresholds.fcp.poor,
      );
    }
  }

  private processLayoutShiftEntry(entry: any) {
    if (!entry.hadRecentInput) {
      this.recordMetric({
        name: "cumulative-layout-shift",
        value: entry.value,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      });

      if (entry.value > this.thresholds.cls.poor) {
        this.createAlert(
          "warning",
          "cls",
          entry.value,
          this.thresholds.cls.poor,
        );
      }
    }
  }

  private startMemoryMonitoring() {
    if ("memory" in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;

        this.recordMetric({
          name: "memory-used",
          value: memory.usedJSHeapSize,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        });

        this.recordMetric({
          name: "memory-total",
          value: memory.totalJSHeapSize,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        });

        // Alertar sobre uso excesivo de memoria
        const memoryUsagePercent =
          (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        if (memoryUsagePercent > 80) {
          this.createAlert("critical", "memory-usage", memoryUsagePercent, 80);
        }
      }, 30000); // Cada 30 segundos
    }
  }

  private recordMetric(metric: PerformanceMetric) {
    if (!this.metrics.has(metric.name)) {
      this.metrics.set(metric.name, []);
    }

    const metricArray = this.metrics.get(metric.name)!;
    metricArray.push(metric);

    // Mantener solo las últimas 100 métricas por tipo
    if (metricArray.length > 100) {
      metricArray.shift();
    }
  }

  private createAlert(
    type: "warning" | "critical",
    metric: string,
    value: number,
    threshold: number,
  ) {
    const alert: PerformanceAlert = {
      type,
      metric,
      value,
      threshold,
      timestamp: Date.now(),
      message: `${metric} (${value.toFixed(2)}) exceeded ${type} threshold (${threshold})`,
    };

    this.alerts.push(alert);

    // Mantener solo las últimas 50 alertas
    if (this.alerts.length > 50) {
      this.alerts.shift();
    }

    // Enviar alerta al servidor si es crítica
    if (type === "critical") {
      this.sendAlertToServer(alert);
    }

    console.warn(`Performance Alert: ${alert.message}`);
  }

  private async sendAlertToServer(alert: PerformanceAlert) {
    try {
      await fetch("/api/monitoring/alerts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(alert),
      });
    } catch (error) {
      console.error("Failed to send alert to server:", error);
    }
  }

  // Métodos públicos
  public getMetrics(metricName?: string): PerformanceMetric[] {
    if (metricName) {
      return this.metrics.get(metricName) || [];
    }

    const allMetrics: PerformanceMetric[] = [];
    this.metrics.forEach((metrics) => allMetrics.push(...metrics));
    return allMetrics;
  }

  public getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  public getCriticalAlerts(): PerformanceAlert[] {
    return this.alerts.filter((alert) => alert.type === "critical");
  }

  public getAverageMetric(metricName: string, timeWindow = 300000): number {
    const metrics = this.getMetrics(metricName);
    const now = Date.now();
    const recentMetrics = metrics.filter(
      (m) => now - m.timestamp <= timeWindow,
    );

    if (recentMetrics.length === 0) return 0;

    const sum = recentMetrics.reduce((acc, m) => acc + m.value, 0);
    return sum / recentMetrics.length;
  }

  public getPerformanceScore(): number {
    const lcp = this.getAverageMetric("largest-contentful-paint");
    const fid = this.getAverageMetric("first-input-delay");
    const cls = this.getAverageMetric("cumulative-layout-shift");

    let score = 100;

    // Penalizar por LCP
    if (lcp > this.thresholds.lcp.poor) score -= 30;
    else if (lcp > this.thresholds.lcp.good) score -= 15;

    // Penalizar por FID
    if (fid > this.thresholds.fid.poor) score -= 30;
    else if (fid > this.thresholds.fid.good) score -= 15;

    // Penalizar por CLS
    if (cls > this.thresholds.cls.poor) score -= 20;
    else if (cls > this.thresholds.cls.good) score -= 10;

    return Math.max(0, score);
  }

  public startRealTimeMonitoring() {
    // Enviar métricas al servidor cada minuto
    setInterval(async () => {
      const recentMetrics = this.getMetrics().filter(
        (m) => Date.now() - m.timestamp <= 60000,
      );

      if (recentMetrics.length > 0) {
        try {
          await fetch("/api/monitoring/metrics", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              metrics: recentMetrics,
              score: this.getPerformanceScore(),
              timestamp: Date.now(),
            }),
          });
        } catch (error) {
          console.error("Failed to send metrics to server:", error);
        }
      }
    }, 60000);
  }

  public destroy() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
    this.alerts = [];
  }
}

// Singleton instance
let performanceMonitor: PerformanceMonitor | null = null;

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor();
  }
  return performanceMonitor;
}

// Hook para React
export function usePerformanceMonitor() {
  const monitor = getPerformanceMonitor();

  return {
    getMetrics: monitor.getMetrics.bind(monitor),
    getAlerts: monitor.getAlerts.bind(monitor),
    getCriticalAlerts: monitor.getCriticalAlerts.bind(monitor),
    getPerformanceScore: monitor.getPerformanceScore.bind(monitor),
    getAverageMetric: monitor.getAverageMetric.bind(monitor),
  };
}

// Inicializar automáticamente en el cliente
if (typeof window !== "undefined") {
  const monitor = getPerformanceMonitor();
  monitor.startRealTimeMonitoring();
}

export type { PerformanceMetric, WebVitalsMetric, PerformanceAlert };
