"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { WidgetConfig, FormatConfig } from "@/lib/types/analytics";

interface HeatmapData {
  x: string | number;
  y: string | number;
  value: number;
  [key: string]: any;
}

interface HeatmapChartProps {
  title?: string;
  description?: string;
  data: HeatmapData[];
  loading?: boolean;
  error?: string;
  config?: WidgetConfig;
  className?: string;
  colorScale?: string[];
  showValues?: boolean;
}

export function HeatmapChart({
  title,
  description,
  data,
  loading = false,
  error,
  config = {},
  className = "",
  colorScale = ["#f0f9ff", "#0ea5e9", "#0369a1"],
  showValues = true,
}: HeatmapChartProps) {
  const { format } = config;

  // Format value based on configuration
  const formatValue = (value: any, formatConfig?: FormatConfig) => {
    if (!formatConfig || value === null || value === undefined) return value;

    const {
      type,
      decimals = 0,
      currency = "USD",
      locale = "en-US",
      prefix = "",
      suffix = "",
    } = formatConfig;

    let formatted = value;

    switch (type) {
      case "number":
        formatted = new Intl.NumberFormat(locale, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(value);
        break;
      case "currency":
        formatted = new Intl.NumberFormat(locale, {
          style: "currency",
          currency,
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(value);
        break;
      case "percentage":
        formatted = new Intl.NumberFormat(locale, {
          style: "percent",
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(value / 100);
        break;
      default:
        formatted = value;
    }

    return `${prefix}${formatted}${suffix}`;
  };

  // Get unique x and y values
  const xValues = Array.from(new Set(data.map((d) => d.x))).sort();
  const yValues = Array.from(new Set(data.map((d) => d.y))).sort();

  // Get min and max values for color scaling
  const values = data.map((d) => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  // Create a map for quick data lookup
  const dataMap = new Map();
  data.forEach((d) => {
    dataMap.set(`${d.x}-${d.y}`, d);
  });

  // Generate color based on value
  const getColor = (value: number) => {
    if (minValue === maxValue) return colorScale[0];

    const normalized = (value - minValue) / (maxValue - minValue);
    const colorIndex = Math.floor(normalized * (colorScale.length - 1));
    const nextColorIndex = Math.min(colorIndex + 1, colorScale.length - 1);

    // Simple interpolation between colors
    const ratio = normalized * (colorScale.length - 1) - colorIndex;

    if (ratio === 0) return colorScale[colorIndex];

    // For simplicity, return the nearest color
    return ratio < 0.5 ? colorScale[colorIndex] : colorScale[nextColorIndex];
  };

  // Get text color based on background
  const getTextColor = (backgroundColor: string) => {
    // Simple heuristic: if it's a dark color, use white text
    const isDark =
      backgroundColor.includes("#0") ||
      backgroundColor.includes("#1") ||
      backgroundColor.includes("#2");
    return isDark ? "#ffffff" : "#000000";
  };

  // Loading state
  if (loading) {
    return (
      <Card className={className}>
        {(title || description) && (
          <CardHeader>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={className}>
        {(title || description) && (
          <CardHeader>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-sm text-red-600 dark:text-red-400 mb-2">
                Error loading chart
              </p>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        {(title || description) && (
          <CardHeader>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <p className="text-sm text-muted-foreground">No data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const cellSize = Math.min(300 / Math.max(xValues.length, yValues.length), 40);

  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <div className="overflow-auto">
          <div className="inline-block min-w-full">
            {/* Y-axis labels */}
            <div className="flex">
              <div className="w-16 flex-shrink-0" />
              {/* X-axis labels */}
              <div className="flex">
                {xValues.map((x, index) => (
                  <div
                    key={index}
                    className="text-xs text-muted-foreground text-center flex-shrink-0"
                    style={{ width: cellSize, minWidth: cellSize }}
                  >
                    {x}
                  </div>
                ))}
              </div>
            </div>

            {/* Heatmap grid */}
            {yValues.map((y, yIndex) => (
              <div key={yIndex} className="flex items-center">
                {/* Y-axis label */}
                <div className="w-16 text-xs text-muted-foreground text-right pr-2 flex-shrink-0">
                  {y}
                </div>

                {/* Row cells */}
                <div className="flex">
                  {xValues.map((x, xIndex) => {
                    const cellData = dataMap.get(`${x}-${y}`);
                    const value = cellData?.value || 0;
                    const backgroundColor = getColor(value);
                    const textColor = getTextColor(backgroundColor);

                    return (
                      <div
                        key={xIndex}
                        className="border border-gray-200 dark:border-gray-700 flex items-center justify-center text-xs font-medium transition-all hover:scale-105 cursor-pointer flex-shrink-0"
                        style={{
                          width: cellSize,
                          height: cellSize,
                          minWidth: cellSize,
                          backgroundColor,
                          color: textColor,
                        }}
                        title={`${x}, ${y}: ${formatValue(value, format)}`}
                      >
                        {showValues && (
                          <span className="truncate px-1">
                            {formatValue(value, format)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Color scale legend */}
            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="text-xs text-muted-foreground">
                {formatValue(minValue, format)}
              </span>
              <div className="flex">
                {colorScale.map((color, index) => (
                  <div
                    key={index}
                    className="w-4 h-4"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {formatValue(maxValue, format)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
