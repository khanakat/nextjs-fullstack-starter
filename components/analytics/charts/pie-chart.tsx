"use client";

import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { getChartColor } from "./base-chart";
import { WidgetConfig, FormatConfig } from "@/lib/types/analytics";

interface PieChartProps {
  title?: string;
  description?: string;
  data: any[];
  dataKey: string;
  nameKey?: string;
  loading?: boolean;
  error?: string;
  config?: WidgetConfig;
  className?: string;
  variant?: "pie" | "donut";
  showLabels?: boolean;
  showPercentage?: boolean;
}

export function PieChart({
  title,
  description,
  data,
  dataKey,
  nameKey = "name",
  loading = false,
  error,
  config = {},
  className = "",
  variant = "pie",
  showLabels = true,
  showPercentage = true,
}: PieChartProps) {
  const {
    showLegend = true,
    showTooltip = true,
    colors,
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
      default:
        formatted = value;
    }

    return `${prefix}${formatted}${suffix}`;
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    const value = payload[0].value;
    const name = data[nameKey];

    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
          {name}
        </p>
        <div className="flex items-center gap-2 text-sm">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: payload[0].color }}
          />
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {formatValue(value, format)}
          </span>
          {showPercentage && (
            <span className="text-gray-600 dark:text-gray-400">
              ({((value / data.total) * 100).toFixed(1)}%)
            </span>
          )}
        </div>
      </div>
    );
  };

  // Custom label function
  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    name,
  }: any) => {
    if (!showLabels) return null;

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't show labels for slices smaller than 5%

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {showPercentage ? `${(percent * 100).toFixed(0)}%` : name}
      </text>
    );
  };

  // Calculate total for percentage calculations
  const dataWithTotal = data.map((item) => ({
    ...item,
    total: data.reduce((sum, d) => sum + d[dataKey], 0),
  }));

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
          <RechartsPieChart>
            <Pie
              data={dataWithTotal}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={80}
              innerRadius={variant === "donut" ? 40 : 0}
              fill="#8884d8"
              dataKey={dataKey}
              {...(animation.enabled && {
                animationBegin: animation.delay || 0,
                animationDuration: animation.duration,
                animationEasing: animation.easing,
              })}
            >
              {dataWithTotal.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getChartColor(index, colors)}
                />
              ))}
            </Pie>
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && (
              <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="circle" />
            )}
          </RechartsPieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Specialized donut chart
export function DonutChart({
  title,
  description,
  data,
  dataKey,
  nameKey,
  loading,
  error,
  config,
  className,
  showLabels,
  showPercentage,
}: Omit<PieChartProps, "variant">) {
  return (
    <PieChart
      title={title}
      description={description}
      data={data}
      dataKey={dataKey}
      nameKey={nameKey}
      loading={loading}
      error={error}
      config={config}
      className={className}
      variant="donut"
      showLabels={showLabels}
      showPercentage={showPercentage}
    />
  );
}
