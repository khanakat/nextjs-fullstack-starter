// import { getCacheService } from "@/lib/cache/cache-service"; // Commented out as not used

export interface Metric {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
  type: "counter" | "gauge" | "histogram" | "timer";
}

export interface MetricsSummary {
  totalRequests: number;
  averageResponseTime: number;
  errorRate: number;
  activeUsers: number;
  memoryUsage: number;
  cpuUsage: number;
  cacheHitRate: number;
  queueSize: number;
}

export class MetricsCollector {
  private metrics: Map<string, Metric[]> = new Map();
  // private _cache = getCacheService(); // Commented out as not used
  private maxMetricsPerType = 1000;
  private retentionPeriod = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    // Clean up old metrics periodically
    setInterval(
      () => {
        this.cleanupOldMetrics();
      },
      60 * 60 * 1000,
    ); // Every hour
  }

  // Record a counter metric (incremental value)
  recordCounter(
    name: string,
    value: number = 1,
    tags?: Record<string, string>,
  ): void {
    this.addMetric({
      name,
      value,
      timestamp: new Date(),
      tags,
      type: "counter",
    });
  }

  // Record a gauge metric (current value)
  recordGauge(
    name: string,
    value: number,
    tags?: Record<string, string>,
  ): void {
    this.addMetric({
      name,
      value,
      timestamp: new Date(),
      tags,
      type: "gauge",
    });
  }

  // Record a timer metric (duration in milliseconds)
  recordTimer(
    name: string,
    duration: number,
    tags?: Record<string, string>,
  ): void {
    this.addMetric({
      name,
      value: duration,
      timestamp: new Date(),
      tags,
      type: "timer",
    });
  }

  // Record a histogram metric (distribution of values)
  recordHistogram(
    name: string,
    value: number,
    tags?: Record<string, string>,
  ): void {
    this.addMetric({
      name,
      value,
      timestamp: new Date(),
      tags,
      type: "histogram",
    });
  }

  private addMetric(metric: Metric): void {
    const key = this.getMetricKey(metric.name, metric.tags);

    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }

    const metrics = this.metrics.get(key)!;
    metrics.push(metric);

    // Keep only recent metrics
    if (metrics.length > this.maxMetricsPerType) {
      metrics.shift();
    }
  }

  private getMetricKey(name: string, tags?: Record<string, string>): string {
    const tagString = tags
      ? Object.entries(tags)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, v]) => `${k}:${v}`)
          .join(",")
      : "";

    return tagString ? `${name}[${tagString}]` : name;
  }

  // Get metrics for a specific name and time range
  getMetrics(
    name: string,
    tags?: Record<string, string>,
    since?: Date,
  ): Metric[] {
    const key = this.getMetricKey(name, tags);
    const metrics = this.metrics.get(key) || [];

    if (since) {
      return metrics.filter((m) => m.timestamp >= since);
    }

    return [...metrics];
  }

  // Get aggregated metrics summary
  async getMetricsSummary(
    timeRange: number = 60 * 60 * 1000,
  ): Promise<MetricsSummary> {
    const since = new Date(Date.now() - timeRange);

    // Get request metrics
    const requestMetrics = this.getMetrics(
      "http_requests_total",
      undefined,
      since,
    );
    const responseTimeMetrics = this.getMetrics(
      "http_request_duration",
      undefined,
      since,
    );
    const errorMetrics = this.getMetrics("http_errors_total", undefined, since);

    // Calculate aggregations
    const totalRequests = requestMetrics.reduce((sum, m) => sum + m.value, 0);
    const averageResponseTime =
      responseTimeMetrics.length > 0
        ? responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) /
          responseTimeMetrics.length
        : 0;

    const errorRate =
      totalRequests > 0
        ? (errorMetrics.reduce((sum, m) => sum + m.value, 0) / totalRequests) *
          100
        : 0;

    // Get system metrics
    const memoryMetrics = this.getMetrics("memory_usage", undefined, since);
    const cpuMetrics = this.getMetrics("cpu_usage", undefined, since);
    const activeUserMetrics = this.getMetrics("active_users", undefined, since);
    const cacheMetrics = this.getMetrics("cache_hits", undefined, since);
    const cacheMissMetrics = this.getMetrics("cache_misses", undefined, since);
    const queueMetrics = this.getMetrics("queue_size", undefined, since);

    const latestMemory =
      memoryMetrics.length > 0
        ? memoryMetrics[memoryMetrics.length - 1].value
        : 0;
    const latestCpu =
      cpuMetrics.length > 0 ? cpuMetrics[cpuMetrics.length - 1].value : 0;
    const latestActiveUsers =
      activeUserMetrics.length > 0
        ? activeUserMetrics[activeUserMetrics.length - 1].value
        : 0;
    const latestQueueSize =
      queueMetrics.length > 0 ? queueMetrics[queueMetrics.length - 1].value : 0;

    const cacheHits = cacheMetrics.reduce((sum, m) => sum + m.value, 0);
    const cacheMisses = cacheMissMetrics.reduce((sum, m) => sum + m.value, 0);
    const cacheHitRate =
      cacheHits + cacheMisses > 0
        ? (cacheHits / (cacheHits + cacheMisses)) * 100
        : 0;

    return {
      totalRequests,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      activeUsers: latestActiveUsers,
      memoryUsage: Math.round(latestMemory * 100) / 100,
      cpuUsage: Math.round(latestCpu * 100) / 100,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      queueSize: latestQueueSize,
    };
  }

  // Get time-series data for charts
  getTimeSeries(
    name: string,
    tags?: Record<string, string>,
    timeRange: number = 60 * 60 * 1000,
    bucketSize: number = 60 * 1000, // 1 minute buckets
  ): Array<{ timestamp: Date; value: number; count: number }> {
    const since = new Date(Date.now() - timeRange);
    const metrics = this.getMetrics(name, tags, since);

    if (metrics.length === 0) return [];

    // Group metrics into time buckets
    const buckets = new Map<number, { sum: number; count: number }>();

    metrics.forEach((metric) => {
      const bucketTime =
        Math.floor(metric.timestamp.getTime() / bucketSize) * bucketSize;

      if (!buckets.has(bucketTime)) {
        buckets.set(bucketTime, { sum: 0, count: 0 });
      }

      const bucket = buckets.get(bucketTime)!;
      bucket.sum += metric.value;
      bucket.count += 1;
    });

    // Convert to array and calculate averages
    return Array.from(buckets.entries())
      .map(([timestamp, { sum, count }]) => ({
        timestamp: new Date(timestamp),
        value: sum / count,
        count,
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  // Clean up old metrics
  private cleanupOldMetrics(): void {
    const cutoff = new Date(Date.now() - this.retentionPeriod);

    for (const [key, metrics] of this.metrics.entries()) {
      const filteredMetrics = metrics.filter((m) => m.timestamp >= cutoff);

      if (filteredMetrics.length === 0) {
        this.metrics.delete(key);
      } else {
        this.metrics.set(key, filteredMetrics);
      }
    }
  }

  // Export metrics for external monitoring systems
  exportMetrics(): Record<string, Metric[]> {
    const exported: Record<string, Metric[]> = {};

    for (const [key, metrics] of this.metrics.entries()) {
      exported[key] = [...metrics];
    }

    return exported;
  }

  // Import metrics (for testing or data migration)
  importMetrics(data: Record<string, Metric[]>): void {
    for (const [key, metrics] of Object.entries(data)) {
      this.metrics.set(key, [...metrics]);
    }
  }

  // Get current metrics count
  getMetricsCount(): number {
    let total = 0;
    for (const metrics of this.metrics.values()) {
      total += metrics.length;
    }
    return total;
  }

  // Clear all metrics
  clear(): void {
    this.metrics.clear();
  }
}

// Singleton instance
let metricsCollector: MetricsCollector;

export function getMetricsCollector(): MetricsCollector {
  if (!metricsCollector) {
    metricsCollector = new MetricsCollector();
  }
  return metricsCollector;
}

// Utility functions for common metrics
export const metrics = {
  // HTTP request metrics
  recordRequest: (
    method: string,
    path: string,
    statusCode: number,
    duration: number,
  ) => {
    const collector = getMetricsCollector();
    const tags = { method, path, status: statusCode.toString() };

    collector.recordCounter("http_requests_total", 1, tags);
    collector.recordTimer("http_request_duration", duration, tags);

    if (statusCode >= 400) {
      collector.recordCounter("http_errors_total", 1, tags);
    }
  },

  // Database query metrics
  recordQuery: (
    operation: string,
    table: string,
    duration: number,
    success: boolean,
  ) => {
    const collector = getMetricsCollector();
    const tags = { operation, table, success: success.toString() };

    collector.recordCounter("db_queries_total", 1, tags);
    collector.recordTimer("db_query_duration", duration, tags);
  },

  // Cache metrics
  recordCacheHit: (key: string) => {
    const collector = getMetricsCollector();
    collector.recordCounter("cache_hits", 1, { key });
  },

  recordCacheMiss: (key: string) => {
    const collector = getMetricsCollector();
    collector.recordCounter("cache_misses", 1, { key });
  },

  // Queue metrics
  recordQueueSize: (queueName: string, size: number) => {
    const collector = getMetricsCollector();
    collector.recordGauge("queue_size", size, { queue: queueName });
  },

  // User activity metrics
  recordActiveUsers: (count: number) => {
    const collector = getMetricsCollector();
    collector.recordGauge("active_users", count);
  },

  // System metrics
  recordMemoryUsage: (usage: number) => {
    const collector = getMetricsCollector();
    collector.recordGauge("memory_usage", usage);
  },

  recordCpuUsage: (usage: number) => {
    const collector = getMetricsCollector();
    collector.recordGauge("cpu_usage", usage);
  },
};

// Middleware to automatically collect HTTP metrics
export function createMetricsMiddleware() {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();

    res.on("finish", () => {
      const duration = Date.now() - startTime;
      metrics.recordRequest(
        req.method,
        req.route?.path || req.path,
        res.statusCode,
        duration,
      );
    });

    next();
  };
}
