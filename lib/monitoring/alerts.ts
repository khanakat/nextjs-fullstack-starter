import { getMetricsCollector } from "./metrics-collector";
import { getHealthCheckService } from "./health-checks";

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric: string;
  condition: "gt" | "lt" | "eq" | "gte" | "lte";
  threshold: number;
  duration: number; // milliseconds
  severity: "low" | "medium" | "high" | "critical";
  enabled: boolean;
  tags?: Record<string, string>;
}

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}

export interface AlertChannel {
  id: string;
  name: string;
  type: "email" | "webhook" | "slack" | "console";
  config: Record<string, any>;
  enabled: boolean;
}

export class AlertManager {
  private rules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private channels: Map<string, AlertChannel> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;
  private metricsCollector = getMetricsCollector();
  private healthService = getHealthCheckService();

  constructor() {
    this.initializeDefaultRules();
    this.initializeDefaultChannels();
    this.startMonitoring();
  }

  private initializeDefaultRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: "high-error-rate",
        name: "High Error Rate",
        description: "Error rate exceeds 5%",
        metric: "error_rate",
        condition: "gt",
        threshold: 5,
        duration: 5 * 60 * 1000, // 5 minutes
        severity: "high",
        enabled: true,
      },
      {
        id: "slow-response-time",
        name: "Slow Response Time",
        description: "Average response time exceeds 2 seconds",
        metric: "average_response_time",
        condition: "gt",
        threshold: 2000,
        duration: 3 * 60 * 1000, // 3 minutes
        severity: "medium",
        enabled: true,
      },
      {
        id: "high-memory-usage",
        name: "High Memory Usage",
        description: "Memory usage exceeds 85%",
        metric: "memory_usage",
        condition: "gt",
        threshold: 85,
        duration: 10 * 60 * 1000, // 10 minutes
        severity: "high",
        enabled: true,
      },
      {
        id: "high-cpu-usage",
        name: "High CPU Usage",
        description: "CPU usage exceeds 80%",
        metric: "cpu_usage",
        condition: "gt",
        threshold: 80,
        duration: 5 * 60 * 1000, // 5 minutes
        severity: "medium",
        enabled: true,
      },
      {
        id: "low-cache-hit-rate",
        name: "Low Cache Hit Rate",
        description: "Cache hit rate below 70%",
        metric: "cache_hit_rate",
        condition: "lt",
        threshold: 70,
        duration: 15 * 60 * 1000, // 15 minutes
        severity: "low",
        enabled: true,
      },
      {
        id: "database-connection-failure",
        name: "Database Connection Failure",
        description: "Database health check failed",
        metric: "database_health",
        condition: "eq",
        threshold: 0, // 0 = unhealthy
        duration: 1 * 60 * 1000, // 1 minute
        severity: "critical",
        enabled: true,
      },
    ];

    defaultRules.forEach((rule) => {
      this.rules.set(rule.id, rule);
    });
  }

  private initializeDefaultChannels(): void {
    const defaultChannels: AlertChannel[] = [
      {
        id: "console",
        name: "Console Logger",
        type: "console",
        config: {},
        enabled: true,
      },
    ];

    defaultChannels.forEach((channel) => {
      this.channels.set(channel.id, channel);
    });
  }

  private startMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Check alerts every 30 seconds
    this.checkInterval = setInterval(() => {
      this.checkAlerts();
    }, 30 * 1000);
  }

  private async checkAlerts(): Promise<void> {
    try {
      const summary = await this.metricsCollector.getMetricsSummary();
      const healthStatus = await this.healthService.getSystemHealth();

      // Create extended metrics including health status
      const databaseService = healthStatus.services.find(s => s.service === 'database');
      const redisService = healthStatus.services.find(s => s.service === 'redis');
      
      const extendedMetrics = {
        ...summary,
        database_health: databaseService?.status === 'healthy' ? 1 : 0,
        redis_health: redisService?.status === 'healthy' ? 1 : 0,
        overall_health: healthStatus.overall === 'healthy' ? 1 : 0,
      };

      for (const rule of this.rules.values()) {
        if (!rule.enabled) continue;

        await this.evaluateRule(rule, extendedMetrics);
      }
    } catch (error) {
      console.error("Error checking alerts:", error);
    }
  }

  private async evaluateRule(rule: AlertRule, metrics: any): Promise<void> {
    const metricValue = metrics[rule.metric];

    if (metricValue === undefined) {
      return; // Metric not available
    }

    const conditionMet = this.evaluateCondition(
      metricValue,
      rule.condition,
      rule.threshold,
    );
    const alertId = `${rule.id}-${Date.now()}`;
    const existingAlert = Array.from(this.activeAlerts.values()).find(
      (alert) => alert.ruleId === rule.id && !alert.resolved,
    );

    if (conditionMet) {
      if (!existingAlert) {
        // Create new alert
        const alert: Alert = {
          id: alertId,
          ruleId: rule.id,
          ruleName: rule.name,
          message: `${rule.description}. Current value: ${metricValue}, Threshold: ${rule.threshold}`,
          severity: rule.severity,
          timestamp: new Date(),
          resolved: false,
          metadata: {
            metric: rule.metric,
            value: metricValue,
            threshold: rule.threshold,
            condition: rule.condition,
          },
        };

        this.activeAlerts.set(alert.id, alert);
        await this.sendAlert(alert);
      }
    } else if (existingAlert) {
      // Resolve existing alert
      existingAlert.resolved = true;
      existingAlert.resolvedAt = new Date();

      await this.sendAlertResolution(existingAlert);
    }
  }

  private evaluateCondition(
    value: number,
    condition: string,
    threshold: number,
  ): boolean {
    switch (condition) {
      case "gt":
        return value > threshold;
      case "gte":
        return value >= threshold;
      case "lt":
        return value < threshold;
      case "lte":
        return value <= threshold;
      case "eq":
        return value === threshold;
      default:
        return false;
    }
  }

  private async sendAlert(alert: Alert): Promise<void> {
    for (const channel of this.channels.values()) {
      if (!channel.enabled) continue;

      try {
        await this.sendToChannel(channel, alert, "alert");
      } catch (error) {
        console.error(
          `Failed to send alert to channel ${channel.name}:`,
          error,
        );
      }
    }
  }

  private async sendAlertResolution(alert: Alert): Promise<void> {
    for (const channel of this.channels.values()) {
      if (!channel.enabled) continue;

      try {
        await this.sendToChannel(channel, alert, "resolution");
      } catch (error) {
        console.error(
          `Failed to send alert resolution to channel ${channel.name}:`,
          error,
        );
      }
    }
  }

  private async sendToChannel(
    channel: AlertChannel,
    alert: Alert,
    type: "alert" | "resolution",
  ): Promise<void> {
    const message =
      type === "alert"
        ? `🚨 ALERT: ${alert.message}`
        : `✅ RESOLVED: ${alert.ruleName} - Alert resolved at ${alert.resolvedAt?.toISOString()}`;

    switch (channel.type) {
      case "console":
        console.log(`[${alert.severity.toUpperCase()}] ${message}`);
        break;

      case "webhook":
        if (channel.config.url) {
          await fetch(channel.config.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(channel.config.headers || {}),
            },
            body: JSON.stringify({
              type,
              alert,
              message,
              timestamp: new Date().toISOString(),
            }),
          });
        }
        break;

      case "email":
        // Email implementation would go here
        console.log(`Email alert: ${message}`);
        break;

      case "slack":
        // Slack implementation would go here
        console.log(`Slack alert: ${message}`);
        break;
    }
  }

  // Public API methods
  addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
  }

  removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  updateRule(ruleId: string, updates: Partial<AlertRule>): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;

    this.rules.set(ruleId, { ...rule, ...updates });
    return true;
  }

  getRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  getRule(ruleId: string): AlertRule | undefined {
    return this.rules.get(ruleId);
  }

  addChannel(channel: AlertChannel): void {
    this.channels.set(channel.id, channel);
  }

  removeChannel(channelId: string): boolean {
    return this.channels.delete(channelId);
  }

  updateChannel(channelId: string, updates: Partial<AlertChannel>): boolean {
    const channel = this.channels.get(channelId);
    if (!channel) return false;

    this.channels.set(channelId, { ...channel, ...updates });
    return true;
  }

  getChannels(): AlertChannel[] {
    return Array.from(this.channels.values());
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values()).filter(
      (alert) => !alert.resolved,
    );
  }

  getAllAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (!alert || alert.resolved) return false;

    alert.resolved = true;
    alert.resolvedAt = new Date();

    this.sendAlertResolution(alert);
    return true;
  }

  // Test alert functionality
  async testAlert(ruleId: string): Promise<boolean> {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;

    const testAlert: Alert = {
      id: `test-${ruleId}-${Date.now()}`,
      ruleId: rule.id,
      ruleName: `[TEST] ${rule.name}`,
      message: `Test alert for rule: ${rule.description}`,
      severity: rule.severity,
      timestamp: new Date(),
      resolved: false,
      metadata: { test: true },
    };

    await this.sendAlert(testAlert);
    return true;
  }

  // Cleanup and shutdown
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

// Singleton instance
let alertManager: AlertManager;

export function getAlertManager(): AlertManager {
  if (!alertManager) {
    alertManager = new AlertManager();
  }
  return alertManager;
}

// Utility functions
export const alerts = {
  // Quick alert creation
  createCustomAlert: (
    name: string,
    metric: string,
    condition: AlertRule["condition"],
    threshold: number,
    severity: AlertRule["severity"] = "medium",
  ): AlertRule => ({
    id: `custom-${Date.now()}`,
    name,
    description: `Custom alert for ${metric}`,
    metric,
    condition,
    threshold,
    duration: 5 * 60 * 1000, // 5 minutes default
    severity,
    enabled: true,
  }),

  // Predefined alert templates
  templates: {
    highErrorRate: (threshold: number = 5) =>
      alerts.createCustomAlert(
        "High Error Rate",
        "error_rate",
        "gt",
        threshold,
        "high",
      ),

    slowResponse: (threshold: number = 2000) =>
      alerts.createCustomAlert(
        "Slow Response Time",
        "average_response_time",
        "gt",
        threshold,
        "medium",
      ),

    lowCacheHit: (threshold: number = 70) =>
      alerts.createCustomAlert(
        "Low Cache Hit Rate",
        "cache_hit_rate",
        "lt",
        threshold,
        "low",
      ),
  },
};
