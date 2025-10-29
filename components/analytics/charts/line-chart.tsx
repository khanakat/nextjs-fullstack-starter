"use client";

import {
  LineChart as RechartsLineChart,
  Line,
  Area,
  AreaChart as RechartsAreaChart,
} from "recharts";
import { BaseChart, getChartColor } from "./base-chart";
import { WidgetConfig } from "@/lib/types/analytics";

interface LineChartProps {
  title?: string;
  description?: string;
  data: any[];
  dataKeys: string[];
  xAxisKey?: string;
  loading?: boolean;
  error?: string;
  config?: WidgetConfig;
  className?: string;
  variant?: "line" | "area" | "smooth";
  stacked?: boolean;
}

export function LineChart({
  title,
  description,
  data,
  dataKeys,
  loading = false,
  error,
  config = {},
  className = "",
  variant = "line",
  stacked = false,
}: LineChartProps) {
  const { colors } = config;

  const renderLines = () => {
    return dataKeys.map((key, index) => {
      const color = getChartColor(index, colors);
      const strokeWidth = 2;
      const strokeDasharray = config.style?.strokeDasharray;

      if (variant === "area") {
        return (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stackId={stacked ? "1" : undefined}
            stroke={color}
            fill={color}
            fillOpacity={0.3}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            dot={{ fill: color, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
          />
        );
      }

      return (
        <Line
          key={key}
          type={variant === "smooth" ? "monotone" : "linear"}
          dataKey={key}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          dot={{ fill: color, strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
        />
      );
    });
  };

  const ChartComponent =
    variant === "area" ? RechartsAreaChart : RechartsLineChart;

  return (
    <BaseChart
      title={title}
      description={description}
      data={data}
      loading={loading}
      error={error}
      config={config}
      className={className}
    >
      <ChartComponent data={data}>{renderLines()}</ChartComponent>
    </BaseChart>
  );
}

// Specialized components for different line chart types
export function AreaChart({
  title,
  description,
  data,
  dataKeys,
  xAxisKey,
  loading,
  error,
  config,
  className,
  stacked = false,
}: Omit<LineChartProps, "variant">) {
  return (
    <LineChart
      title={title}
      description={description}
      data={data}
      dataKeys={dataKeys}
      xAxisKey={xAxisKey}
      loading={loading}
      error={error}
      config={config}
      className={className}
      variant="area"
      stacked={stacked}
    />
  );
}

export function SmoothLineChart({
  title,
  description,
  data,
  dataKeys,
  xAxisKey,
  loading,
  error,
  config,
  className,
}: Omit<LineChartProps, "variant" | "stacked">) {
  return (
    <LineChart
      title={title}
      description={description}
      data={data}
      dataKeys={dataKeys}
      xAxisKey={xAxisKey}
      loading={loading}
      error={error}
      config={config}
      className={className}
      variant="smooth"
    />
  );
}
