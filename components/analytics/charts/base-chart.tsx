"use client";

import React from "react";

import {
  ResponsiveContainer,
  Tooltip,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { WidgetConfig, FormatConfig, Threshold } from "@/lib/types/analytics";

interface BaseChartProps {
  title?: string;
  description?: string;
  data: any[];
  loading?: boolean;
  error?: string;
  config?: WidgetConfig;
  className?: string;
  children: React.ReactNode;
}

export function BaseChart({
  title,
  description,
  data,
  loading = false,
  error,
  config = {},
  className = "",
  children,
}: BaseChartProps) {
  const {
    showLegend = true,
    showTooltip = true,
    format,
    animation = { enabled: true, duration: 300, easing: "ease" },
  } = config;

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
      case "date":
        formatted = new Date(value).toLocaleDateString(locale);
        break;
      case "time":
        formatted = new Date(value).toLocaleTimeString(locale);
        break;
      case "datetime":
        formatted = new Date(value).toLocaleString(locale);
        break;
      default:
        formatted = value;
    }

    return `${prefix}${formatted}${suffix}`;
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
          {label}
        </p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600 dark:text-gray-400">
              {entry.name}:
            </span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {formatValue(entry.value, format)}
            </span>
          </div>
        ))}
      </div>
    );
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

  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          {React.cloneElement(
            children as React.ReactElement,
            {
              data,
              ...(animation.enabled && {
                animationBegin: animation.delay || 0,
                animationDuration: animation.duration,
                animationEasing: animation.easing,
              }),
            },
            [
              // Common chart elements
              <CartesianGrid
                key="grid"
                strokeDasharray="3 3"
                className="stroke-muted-foreground/20"
              />,
              <XAxis
                key="xaxis"
                className="text-xs fill-muted-foreground"
                tickLine={false}
                axisLine={false}
              />,
              <YAxis
                key="yaxis"
                className="text-xs fill-muted-foreground"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatValue(value, format)}
              />,
              showTooltip && (
                <Tooltip
                  key="tooltip"
                  content={<CustomTooltip />}
                  cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
                />
              ),
              showLegend && (
                <Legend
                  key="legend"
                  wrapperStyle={{ paddingTop: "20px" }}
                  iconType="circle"
                />
              ),
              // Chart-specific elements will be added by child components
              ...((children as React.ReactElement).props.children || []),
            ],
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Utility function to get color from palette
export function getChartColor(index: number, colors?: string[]): string {
  const defaultColors = [
    "#3b82f6",
    "#ef4444",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
    "#84cc16",
  ];
  const palette = colors || defaultColors;
  return palette[index % palette.length];
}

// Utility function to apply thresholds
export function applyThresholds(
  value: number,
  thresholds?: Threshold[],
): string | undefined {
  if (!thresholds) return undefined;

  for (const threshold of thresholds) {
    const { operator, value: thresholdValue, color } = threshold;

    switch (operator) {
      case ">":
        if (value > thresholdValue) return color;
        break;
      case "<":
        if (value < thresholdValue) return color;
        break;
      case ">=":
        if (value >= thresholdValue) return color;
        break;
      case "<=":
        if (value <= thresholdValue) return color;
        break;
      case "=":
        if (value === thresholdValue) return color;
        break;
      case "!=":
        if (value !== thresholdValue) return color;
        break;
    }
  }

  return undefined;
}
