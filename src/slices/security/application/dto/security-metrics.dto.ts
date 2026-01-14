/**
 * DTO for Security Metrics operations
 */

export interface SecurityMetricsRequest {
  organizationId: string;
  range: '1h' | '24h' | '7d' | '30d';
  startDate: Date;
  endDate: Date;
}

export interface SecurityMetricsResponse {
  metrics: {
    totalEvents: number;
    criticalEvents: number;
    highSeverityEvents: number;
    openEvents: number;
    resolvedEvents: number;
    averageResolutionTime?: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    trendData: Array<{
      timestamp: Date;
      count: number;
    }>;
  };
  range: string;
  organizationId: string;
  timeRange: {
    start: string;
    end: string;
  };
}
