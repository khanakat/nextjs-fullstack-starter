/**
 * API de Métricas
 *
 * Endpoint para obtener métricas de la aplicación
 * GET /api/metrics - Métricas en formato JSON
 * GET /api/metrics?format=prometheus - Métricas en formato Prometheus
 */

import { NextRequest, NextResponse } from "next/server";
import { monitoring } from "@/lib/monitoring";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format");
    const name = searchParams.get("name");
    const startTime = searchParams.get("start_time");
    const endTime = searchParams.get("end_time");

    // Parsear parámetros de tiempo
    const start = startTime ? new Date(startTime) : undefined;
    const end = endTime ? new Date(endTime) : undefined;

    // Obtener métricas
    const metrics = monitoring.getMetrics(name || undefined, start, end);
    const performanceMetrics = await monitoring.getPerformanceMetrics();

    if (format === "prometheus") {
      // Formato Prometheus
      let prometheusOutput = "";

      // Métricas de performance
      prometheusOutput += `# HELP response_time_seconds Response time in seconds\n`;
      prometheusOutput += `# TYPE response_time_seconds gauge\n`;
      prometheusOutput += `response_time_seconds ${performanceMetrics.responseTime / 1000}\n\n`;

      prometheusOutput += `# HELP throughput_requests_per_second Requests per second\n`;
      prometheusOutput += `# TYPE throughput_requests_per_second gauge\n`;
      prometheusOutput += `throughput_requests_per_second ${performanceMetrics.throughput}\n\n`;

      prometheusOutput += `# HELP error_rate_percent Error rate percentage\n`;
      prometheusOutput += `# TYPE error_rate_percent gauge\n`;
      prometheusOutput += `error_rate_percent ${performanceMetrics.errorRate}\n\n`;

      prometheusOutput += `# HELP cpu_usage_percent CPU usage percentage\n`;
      prometheusOutput += `# TYPE cpu_usage_percent gauge\n`;
      prometheusOutput += `cpu_usage_percent ${performanceMetrics.cpuUsage}\n\n`;

      prometheusOutput += `# HELP memory_usage_percent Memory usage percentage\n`;
      prometheusOutput += `# TYPE memory_usage_percent gauge\n`;
      prometheusOutput += `memory_usage_percent ${performanceMetrics.memoryUsage}\n\n`;

      prometheusOutput += `# HELP active_connections Active connections count\n`;
      prometheusOutput += `# TYPE active_connections gauge\n`;
      prometheusOutput += `active_connections ${performanceMetrics.activeConnections}\n\n`;

      // Métricas históricas agrupadas
      const metricGroups = metrics.reduce(
        (groups, metric) => {
          if (!groups[metric.name]) {
            groups[metric.name] = [];
          }
          groups[metric.name].push(metric);
          return groups;
        },
        {} as Record<string, typeof metrics>,
      );

      Object.entries(metricGroups).forEach(([metricName, metricList]) => {
        const latestMetric = metricList[metricList.length - 1];
        const sanitizedName = metricName.replace(/[^a-zA-Z0-9_]/g, "_");

        prometheusOutput += `# HELP ${sanitizedName} ${metricName}\n`;
        prometheusOutput += `# TYPE ${sanitizedName} gauge\n`;

        if (latestMetric.tags) {
          const tags = Object.entries(latestMetric.tags)
            .map(([key, value]) => `${key}="${value}"`)
            .join(",");
          prometheusOutput += `${sanitizedName}{${tags}} ${latestMetric.value}\n`;
        } else {
          prometheusOutput += `${sanitizedName} ${latestMetric.value}\n`;
        }
        prometheusOutput += "\n";
      });

      return new NextResponse(prometheusOutput, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    } else {
      // Formato JSON
      return NextResponse.json({
        timestamp: new Date(),
        performance: performanceMetrics,
        metrics: {
          total: metrics.length,
          data: metrics.slice(-100), // Últimas 100 métricas
        },
        summary: {
          unique_metrics: [...new Set(metrics.map((m) => m.name))].length,
          time_range: {
            start: metrics.length > 0 ? metrics[0].timestamp : null,
            end:
              metrics.length > 0 ? metrics[metrics.length - 1].timestamp : null,
          },
        },
      });
    }
  } catch (error) {
    console.error("Metrics API error:", error);

    return NextResponse.json(
      {
        error: "Failed to retrieve metrics",
        timestamp: new Date(),
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, value, unit, tags } = body;

    if (!name || typeof value !== "number" || !unit) {
      return NextResponse.json(
        { error: "Missing required fields: name, value, unit" },
        { status: 400 },
      );
    }

    // Registrar métrica
    monitoring.recordMetric(name, value, unit, tags);

    return NextResponse.json({
      success: true,
      timestamp: new Date(),
      metric: { name, value, unit, tags },
    });
  } catch (error) {
    console.error("Metrics POST error:", error);

    return NextResponse.json(
      {
        error: "Failed to record metric",
        timestamp: new Date(),
      },
      { status: 500 },
    );
  }
}
