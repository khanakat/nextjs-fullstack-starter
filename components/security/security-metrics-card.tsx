"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  AlertTriangle,
  Activity,
  Ban,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface SecurityMetricsCardProps {
  title: string;
  value: number | string;
  change?: number;
  changeType?: "increase" | "decrease";
  icon: "shield" | "alert" | "activity" | "ban";
  severity?: "low" | "medium" | "high" | "critical";
  description?: string;
}

const iconMap = {
  shield: Shield,
  alert: AlertTriangle,
  activity: Activity,
  ban: Ban,
};

const severityColors = {
  low: "bg-green-100 text-green-800 border-green-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  critical: "bg-red-100 text-red-800 border-red-200",
};

export function SecurityMetricsCard({
  title,
  value,
  change,
  changeType,
  icon,
  severity,
  description,
}: SecurityMetricsCardProps) {
  const IconComponent = iconMap[icon];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center space-x-2">
          {severity && (
            <Badge variant="outline" className={severityColors[severity]}>
              {severity.toUpperCase()}
            </Badge>
          )}
          <IconComponent className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            {changeType === "increase" ? (
              <TrendingUp className="h-3 w-3 text-red-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-green-500" />
            )}
            <span
              className={
                changeType === "increase" ? "text-red-500" : "text-green-500"
              }
            >
              {Math.abs(change)}% from last period
            </span>
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
