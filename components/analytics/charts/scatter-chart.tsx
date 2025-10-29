"use client";

import React from "react";
import { ScatterChart as RechartsScatterChart, Scatter, ZAxis } from "recharts";
import { BaseChart, getChartColor } from "./base-chart";
import { WidgetConfig } from "@/lib/types/analytics";

interface ScatterChartProps {
  title?: string;
  description?: string;
  data: any[];
  xKey: string;
  yKey: string;
  zKey?: string; // For bubble size
  loading?: boolean;
  error?: string;
  config?: WidgetConfig;
  className?: string;
  showTrendLine?: boolean;
}

export function ScatterChart({
  title,
  description,
  data,
  xKey,
  yKey,
  zKey,
  loading = false,
  error,
  config = {},
  className = "",
}: ScatterChartProps) {
  const { colors } = config;

  // Transform data for scatter chart
  const scatterData = data.map((item) => ({
    x: item[xKey],
    y: item[yKey],
    z: zKey ? item[zKey] : 50, // Default bubble size
    ...item,
  }));

  return (
    <BaseChart
      title={title}
      description={description}
      data={scatterData}
      loading={loading}
      error={error}
      config={config}
      className={className}
    >
      <RechartsScatterChart data={scatterData}>
        <Scatter data={scatterData} fill={getChartColor(0, colors)} />
        {zKey && <ZAxis type="number" dataKey="z" range={[20, 200]} />}
      </RechartsScatterChart>
    </BaseChart>
  );
}

// Specialized bubble chart (scatter with size dimension)
export function BubbleChart({
  title,
  description,
  data,
  xKey,
  yKey,
  zKey,
  loading,
  error,
  config,
  className,
}: ScatterChartProps) {
  return (
    <ScatterChart
      title={title}
      description={description}
      data={data}
      xKey={xKey}
      yKey={yKey}
      zKey={zKey}
      loading={loading}
      error={error}
      config={config}
      className={className}
    />
  );
}
