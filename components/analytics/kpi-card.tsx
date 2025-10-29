"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FormatConfig } from "@/lib/types/analytics";

interface KPICardProps {
  title: string;
  value: number | string;
  previousValue?: number;
  description?: string;
  format?: FormatConfig;
  trend?: "up" | "down" | "neutral";
  trendValue?: number;
  trendLabel?: string;
  icon?: React.ReactNode;
  className?: string;
  loading?: boolean;
  variant?: "default" | "success" | "warning" | "danger";
}

export function KPICard({
  title,
  value,
  previousValue,
  description,
  format,
  trend,
  trendValue,
  trendLabel = "vs last period",
  icon,
  className = "",
  loading = false,
  variant = "default",
}: KPICardProps) {
  // Format value based on configuration
  const formatValue = (val: any, formatConfig?: FormatConfig) => {
    if (!formatConfig || val === null || val === undefined) return val;

    const {
      type,
      decimals = 0,
      currency = "USD",
      locale = "en-US",
      prefix = "",
      suffix = "",
    } = formatConfig;

    let formatted = val;

    switch (type) {
      case "number":
        formatted = new Intl.NumberFormat(locale, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(val);
        break;
      case "currency":
        formatted = new Intl.NumberFormat(locale, {
          style: "currency",
          currency,
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(val);
        break;
      case "percentage":
        formatted = new Intl.NumberFormat(locale, {
          style: "percent",
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(val / 100);
        break;
      default:
        formatted = val;
    }

    return `${prefix}${formatted}${suffix}`;
  };

  // Calculate trend if not provided
  const calculatedTrend =
    trend ||
    (previousValue !== undefined && typeof value === "number"
      ? value > previousValue
        ? "up"
        : value < previousValue
          ? "down"
          : "neutral"
      : "neutral");

  // Calculate trend percentage if not provided
  const calculatedTrendValue =
    trendValue ||
    (previousValue !== undefined &&
    typeof value === "number" &&
    previousValue !== 0
      ? ((value - previousValue) / previousValue) * 100
      : 0);

  // Get trend icon
  const getTrendIcon = () => {
    switch (calculatedTrend) {
      case "up":
        return <TrendingUp className="h-4 w-4" />;
      case "down":
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  // Get trend color
  const getTrendColor = () => {
    switch (calculatedTrend) {
      case "up":
        return "text-green-600 dark:text-green-400";
      case "down":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  // Get card variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950";
      case "warning":
        return "border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950";
      case "danger":
        return "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950";
      default:
        return "";
    }
  };

  return (
    <Card className={cn(getVariantStyles(), className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Main value */}
          <div className="text-2xl font-bold">
            {loading ? (
              <div className="h-8 w-24 bg-muted animate-pulse rounded" />
            ) : (
              formatValue(value, format)
            )}
          </div>

          {/* Trend and description */}
          <div className="flex items-center justify-between">
            {(calculatedTrendValue !== 0 || trend) && (
              <div
                className={cn(
                  "flex items-center gap-1 text-xs",
                  getTrendColor(),
                )}
              >
                {getTrendIcon()}
                <span>{Math.abs(calculatedTrendValue).toFixed(1)}%</span>
                <span className="text-muted-foreground">{trendLabel}</span>
              </div>
            )}

            {description && (
              <CardDescription className="text-xs">
                {description}
              </CardDescription>
            )}
          </div>

          {/* Trend badge */}
          {calculatedTrend !== "neutral" && (
            <Badge
              variant={calculatedTrend === "up" ? "default" : "destructive"}
              className="text-xs"
            >
              {calculatedTrend === "up" ? (
                <ArrowUp className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDown className="h-3 w-3 mr-1" />
              )}
              {calculatedTrend === "up" ? "Increasing" : "Decreasing"}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Specialized KPI cards for common use cases
export function RevenueKPI({
  value,
  previousValue,
  ...props
}: Omit<KPICardProps, "title" | "format">) {
  return (
    <KPICard
      title="Revenue"
      value={value}
      previousValue={previousValue}
      format={{ type: "currency", currency: "USD", decimals: 0 }}
      variant="success"
      {...props}
    />
  );
}

export function UsersKPI({
  value,
  previousValue,
  ...props
}: Omit<KPICardProps, "title" | "format">) {
  return (
    <KPICard
      title="Active Users"
      value={value}
      previousValue={previousValue}
      format={{ type: "number", decimals: 0 }}
      {...props}
    />
  );
}

export function ConversionKPI({
  value,
  previousValue,
  ...props
}: Omit<KPICardProps, "title" | "format">) {
  return (
    <KPICard
      title="Conversion Rate"
      value={value}
      previousValue={previousValue}
      format={{ type: "percentage", decimals: 2 }}
      {...props}
    />
  );
}

export function GrowthKPI({
  value,
  previousValue,
  ...props
}: Omit<KPICardProps, "title" | "format">) {
  return (
    <KPICard
      title="Growth Rate"
      value={value}
      previousValue={previousValue}
      format={{ type: "percentage", decimals: 1 }}
      variant={typeof value === "number" && value > 0 ? "success" : "warning"}
      {...props}
    />
  );
}
