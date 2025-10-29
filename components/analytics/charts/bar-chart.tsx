"use client";

import { BarChart as RechartsBarChart, Bar } from "recharts";
import { BaseChart, getChartColor } from "./base-chart";
import { WidgetConfig } from "@/lib/types/analytics";

interface BarChartProps {
  title?: string;
  description?: string;
  data: any[];
  dataKeys: string[];
  xAxisKey?: string;
  loading?: boolean;
  error?: string;
  config?: WidgetConfig;
  className?: string;
  orientation?: "vertical" | "horizontal";
  stacked?: boolean;
}

export function BarChart({
  title,
  description,
  data,
  dataKeys,
  loading = false,
  error,
  config = {},
  className = "",
  orientation = "vertical",
  stacked = false,
}: BarChartProps) {
  const { colors } = config;

  const renderBars = () => {
    return dataKeys.map((key, index) => {
      const color = getChartColor(index, colors);

      return (
        <Bar
          key={key}
          dataKey={key}
          fill={color}
          stackId={stacked ? "1" : undefined}
          radius={[2, 2, 0, 0]}
          maxBarSize={60}
        />
      );
    });
  };

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
      <RechartsBarChart
        data={data}
        layout={orientation === "horizontal" ? "horizontal" : "vertical"}
      >
        {renderBars()}
      </RechartsBarChart>
    </BaseChart>
  );
}

// Specialized horizontal bar chart
export function HorizontalBarChart({
  title,
  description,
  data,
  dataKeys,
  xAxisKey,
  loading,
  error,
  config,
  className,
  stacked,
}: Omit<BarChartProps, "orientation">) {
  return (
    <BarChart
      title={title}
      description={description}
      data={data}
      dataKeys={dataKeys}
      xAxisKey={xAxisKey}
      loading={loading}
      error={error}
      config={config}
      className={className}
      orientation="horizontal"
      stacked={stacked}
    />
  );
}

// Specialized stacked bar chart
export function StackedBarChart({
  title,
  description,
  data,
  dataKeys,
  xAxisKey,
  loading,
  error,
  config,
  className,
  orientation,
}: Omit<BarChartProps, "stacked">) {
  return (
    <BarChart
      title={title}
      description={description}
      data={data}
      dataKeys={dataKeys}
      xAxisKey={xAxisKey}
      loading={loading}
      error={error}
      config={config}
      className={className}
      orientation={orientation}
      stacked={true}
    />
  );
}
