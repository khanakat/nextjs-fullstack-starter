"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { RefreshCw, Download, Share, Settings } from "lucide-react";
import { LineChart, BarChart, PieChart, AreaChart } from "./charts";
import {
  KPICard,
  RevenueKPI,
  UsersKPI,
  ConversionKPI,
  GrowthKPI,
} from "./kpi-card";
import {
  AnalyticsDashboard as DashboardType,
  DashboardWidget,
} from "@/lib/types/analytics";
import { AnalyticsService } from "@/lib/services/analytics-service";
import { toast } from "sonner";
import { DateRange } from "react-day-picker";
import { subDays } from "date-fns";

interface AnalyticsDashboardProps {
  dashboardId?: string;
  organizationId: string;
  className?: string;
  editable?: boolean;
}

export function AnalyticsDashboard({
  dashboardId,
  organizationId,
  className = "",
  editable = false,
}: AnalyticsDashboardProps) {
  const [dashboard, setDashboard] = useState<DashboardType | null>(null);
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("7d");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });

  // Mock data for demonstration
  const mockData = [
    { name: "Jan", value: 400 },
    { name: "Feb", value: 300 },
    { name: "Mar", value: 600 },
    { name: "Apr", value: 800 },
    { name: "May", value: 500 },
  ];
  const [activeTab, setActiveTab] = useState("overview");

  // Memoize default widgets configuration to avoid recreating on every render
  const defaultWidgetsConfig = useMemo(
    () => [
      {
        title: "Revenue",
        type: "kpi" as const,
        position: { x: 0, y: 0, width: 3, height: 2 },
        config: {
          format: { type: "currency" as const, currency: "USD" },
          colors: ["#10b981"],
        },
        queryId: "revenue-query",
      },
      {
        title: "Active Users",
        type: "kpi" as const,
        position: { x: 3, y: 0, width: 3, height: 2 },
        config: {
          format: { type: "number" as const },
          colors: ["#3b82f6"],
        },
        queryId: "users-query",
      },
      {
        title: "Conversion Rate",
        type: "kpi" as const,
        position: { x: 6, y: 0, width: 3, height: 2 },
        config: {
          format: { type: "percentage" as const, decimals: 2 },
          colors: ["#f59e0b"],
        },
        queryId: "conversion-query",
      },
      {
        title: "Growth Rate",
        type: "kpi" as const,
        position: { x: 9, y: 0, width: 3, height: 2 },
        config: {
          format: { type: "percentage" as const, decimals: 1 },
          colors: ["#8b5cf6"],
        },
        queryId: "growth-query",
      },
      {
        title: "Revenue Trend",
        type: "chart" as const,
        position: { x: 0, y: 2, width: 6, height: 3 },
        config: {
          chartType: "line" as const,
          format: { type: "currency" as const, currency: "USD" },
          colors: ["#10b981", "#3b82f6"],
        },
        queryId: "revenue-trend-query",
      },
      {
        title: "User Activity",
        type: "chart" as const,
        position: { x: 6, y: 2, width: 6, height: 3 },
        config: {
          chartType: "bar" as const,
          format: { type: "number" as const },
          colors: ["#3b82f6", "#ef4444"],
        },
        queryId: "activity-query",
      },
      {
        title: "Traffic Sources",
        type: "chart" as const,
        position: { x: 0, y: 5, width: 4, height: 3 },
        config: {
          chartType: "pie" as const,
          format: { type: "number" as const },
          colors: ["#3b82f6", "#ef4444", "#10b981", "#f59e0b"],
        },
        queryId: "traffic-query",
      },
      {
        title: "Performance Metrics",
        type: "chart" as const,
        position: { x: 4, y: 5, width: 8, height: 3 },
        config: {
          chartType: "area" as const,
          format: { type: "number" as const },
          colors: ["#8b5cf6", "#ec4899"],
        },
        queryId: "performance-query",
      },
    ],
    [],
  );

  const createDefaultWidgets = useCallback(
    async (dashboardId: string) => {
      try {
        const createdWidgets = [];
        for (const widget of defaultWidgetsConfig) {
          const createdWidget = await AnalyticsService.createWidget("user-id", {
            dashboardId,
            type: widget.type,
            title: widget.title,
            position: widget.position,
            config: widget.config,
            dataSource: {
              type: "static",
              data: [],
            },
          });
          createdWidgets.push(createdWidget);
        }
        return createdWidgets;
      } catch (error) {
        console.error("Error creating default widgets:", error);
        throw error;
      }
    },
    [defaultWidgetsConfig],
  );

  // Load dashboard data
  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);

      if (dashboardId) {
        // Load specific dashboard
        const dashboardData = await AnalyticsService.getDashboardById(
          dashboardId,
          "user-id",
          organizationId,
        );
        setDashboard(dashboardData);

        // Load dashboard widgets - this method doesn't exist, we'll get widgets from dashboard
        if (dashboardData) {
          setWidgets(dashboardData.widgets);
        }
      } else {
        // Load default dashboard or create one
        const dashboards = await AnalyticsService.getDashboards(
          "user-id",
          organizationId,
        );
        let defaultDashboard = dashboards.dashboards.find(
          (d) => d.name === "Default Dashboard",
        );

        if (!defaultDashboard) {
          // Create default dashboard
          defaultDashboard = await AnalyticsService.createDashboard("user-id", {
            name: "Overview Dashboard",
            description: "Main analytics overview",
            layout: {
              columns: 12,
              rows: 8,
              gap: 16,
              padding: 16,
              responsive: true,
            },
            settings: {
              theme: "light",
              showHeader: true,
              showFilters: true,
              allowExport: true,
              allowShare: true,
              timezone: "UTC",
              dateFormat: "YYYY-MM-DD",
              numberFormat: "en-US",
            },
            organizationId,
          });

          // Create default widgets
          await createDefaultWidgets(defaultDashboard.id);
        }

        setDashboard(defaultDashboard);
        setWidgets(defaultDashboard.widgets);
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [dashboardId, organizationId, createDefaultWidgets]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const refreshDashboard = async () => {
    setRefreshing(true);
    try {
      await loadDashboard();
      toast.success("Dashboard refreshed");
    } catch (error) {
      toast.error("Failed to refresh dashboard");
    } finally {
      setRefreshing(false);
    }
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);

    const now = new Date();
    let from: Date;

    switch (period) {
      case "7d":
        from = subDays(now, 7);
        break;
      case "30d":
        from = subDays(now, 30);
        break;
      case "90d":
        from = subDays(now, 90);
        break;
      case "1y":
        from = subDays(now, 365);
        break;
      default:
        from = subDays(now, 30);
    }

    setDateRange({ from, to: now });
  };

  const renderWidget = (widget: DashboardWidget) => {
    const { type, title, config } = widget;

    const commonProps = {
      title,
      data: mockData,
      config,
      loading: loading || refreshing,
      className: "h-full",
    };

    switch (type) {
      case "kpi":
        if (title.toLowerCase().includes("revenue")) {
          return (
            <RevenueKPI
              value={125000}
              previousValue={110000}
              {...commonProps}
            />
          );
        } else if (title.toLowerCase().includes("user")) {
          return (
            <UsersKPI value={8542} previousValue={7890} {...commonProps} />
          );
        } else if (title.toLowerCase().includes("conversion")) {
          return (
            <ConversionKPI value={3.45} previousValue={3.12} {...commonProps} />
          );
        } else if (title.toLowerCase().includes("growth")) {
          return (
            <GrowthKPI value={12.5} previousValue={8.3} {...commonProps} />
          );
        }
        return <KPICard value={1234} {...commonProps} />;

      case "chart":
        const chartType = config.chartType || "line";
        switch (chartType) {
          case "line":
            return <LineChart dataKeys={["value"]} {...commonProps} />;
          case "bar":
            return <BarChart dataKeys={["value"]} {...commonProps} />;
          case "pie":
            return <PieChart dataKey="value" nameKey="name" {...commonProps} />;
          case "area":
            return <AreaChart dataKeys={["value"]} {...commonProps} />;
          default:
            return <LineChart dataKeys={["value"]} {...commonProps} />;
        }

      default:
        return (
          <Card className="h-full">
            <CardContent className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">
                Unsupported widget type: {type}
              </p>
            </CardContent>
          </Card>
        );
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="flex gap-2">
            <div className="h-10 w-24 bg-muted animate-pulse rounded" />
            <div className="h-10 w-24 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {dashboard?.name || "Analytics Dashboard"}
          </h1>
          {dashboard?.description && (
            <p className="text-muted-foreground mt-1">
              {dashboard.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>

          <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />

          <Button
            variant="outline"
            size="sm"
            onClick={refreshDashboard}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </Button>

          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" />
          </Button>

          <Button variant="outline" size="sm">
            <Share className="h-4 w-4" />
          </Button>

          {editable && (
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <RevenueKPI
              value={125000}
              previousValue={110000}
              loading={refreshing}
            />
            <UsersKPI value={8542} previousValue={7890} loading={refreshing} />
            <ConversionKPI
              value={3.45}
              previousValue={3.12}
              loading={refreshing}
            />
            <GrowthKPI value={12.5} previousValue={8.3} loading={refreshing} />
          </div>

          {/* Main Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LineChart
              title="Revenue Trend"
              description="Monthly revenue over time"
              data={mockData}
              dataKeys={["value"]}
              config={{
                format: { type: "currency", currency: "USD" },
                colors: ["#10b981", "#3b82f6"],
              }}
              loading={refreshing}
            />

            <BarChart
              title="User Activity"
              description="Daily active users vs new users"
              data={mockData}
              dataKeys={["value"]}
              config={{
                format: { type: "number" },
                colors: ["#3b82f6", "#ef4444"],
              }}
              loading={refreshing}
            />
          </div>

          {/* Secondary Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <PieChart
              title="Traffic Sources"
              description="Breakdown of traffic sources"
              data={[
                { name: "Organic", value: 45 },
                { name: "Direct", value: 25 },
                { name: "Social", value: 20 },
                { name: "Referral", value: 10 },
              ]}
              dataKey="value"
              nameKey="name"
              config={{
                colors: ["#3b82f6", "#ef4444", "#10b981", "#f59e0b"],
              }}
              loading={refreshing}
            />

            <div className="lg:col-span-2">
              <AreaChart
                title="Performance Metrics"
                description="System performance over time"
                data={mockData}
                dataKeys={["value"]}
                config={{
                  format: { type: "percentage", decimals: 1 },
                  colors: ["#8b5cf6", "#ec4899"],
                }}
                loading={refreshing}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LineChart
              title="Revenue Growth"
              description="Monthly recurring revenue"
              data={mockData}
              dataKeys={["value"]}
              config={{
                format: { type: "currency", currency: "USD" },
                colors: ["#10b981", "#059669"],
              }}
              loading={refreshing}
            />

            <BarChart
              title="Revenue by Product"
              description="Revenue breakdown by product line"
              data={mockData}
              dataKeys={["value"]}
              config={{
                format: { type: "currency", currency: "USD" },
                colors: ["#10b981"],
              }}
              loading={refreshing}
            />
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AreaChart
              title="User Growth"
              description="Total and active users over time"
              data={mockData}
              dataKeys={["value"]}
              config={{
                format: { type: "number" },
                colors: ["#3b82f6", "#1d4ed8"],
              }}
              loading={refreshing}
            />

            <PieChart
              title="User Segments"
              description="User distribution by segment"
              data={[
                { name: "Free", value: 60 },
                { name: "Pro", value: 30 },
                { name: "Enterprise", value: 10 },
              ]}
              dataKey="value"
              nameKey="name"
              config={{
                colors: ["#6b7280", "#3b82f6", "#1d4ed8"],
              }}
              loading={refreshing}
            />
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LineChart
              title="Response Time"
              description="Average API response time"
              data={mockData}
              dataKeys={["value"]}
              config={{
                format: { type: "number", suffix: "ms" },
                colors: ["#f59e0b"],
              }}
              loading={refreshing}
            />

            <AreaChart
              title="System Resources"
              description="CPU and memory usage"
              data={mockData}
              dataKeys={["value"]}
              config={{
                format: { type: "percentage", decimals: 1 },
                colors: ["#8b5cf6", "#ec4899"],
              }}
              loading={refreshing}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Custom Widgets Grid */}
      {widgets.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Custom Widgets</h2>
            <Badge variant="secondary">
              {widgets.length} widget{widgets.length !== 1 ? "s" : ""}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {widgets.map((widget) => (
              <div key={widget.id} className="min-h-[200px]">
                {renderWidget(widget)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
