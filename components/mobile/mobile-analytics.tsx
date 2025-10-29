"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  Target,
  RefreshCw,
  ChevronRight,
  Eye,
  FileText,
} from "lucide-react";

import { useNetworkAwareLoading } from "@/hooks/use-mobile-performance";
import { useOffline } from "@/hooks/use-offline";
import { MobileWorkflows } from "./mobile-workflows";
import { MobileCollaboration } from "./mobile-collaboration";
import { MobileIntegrations } from "./mobile-integrations";

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  pageViews: number;
  bounceRate: number;
  avgSessionDuration: number;
  conversionRate: number;
  topPages: Array<{ path: string; views: number; change: number }>;
  userActivity: Array<{ hour: number; users: number }>;
  recentEvents: Array<{ type: string; count: number; change: number }>;
}

/**
 * Mobile-optimized Analytics Dashboard
 */
export function MobileAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { loadingStrategy } = useNetworkAwareLoading();
  const { isOnline, getCachedData, setCachedData } = useOffline();

  // Load analytics data
  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true);

      try {
        // Try to get cached data first if offline
        if (!isOnline) {
          const cached = getCachedData("analytics-dashboard");
          if (cached) {
            setData(cached);
            setIsLoading(false);
            return;
          }
        }

        // Fetch fresh data
        const response = await fetch("/api/analytics/dashboard", {
          method: "GET",
          headers: {
            "Cache-Control":
              loadingStrategy === "conservative" ? "max-age=300" : "no-cache",
          },
        });

        if (response.ok) {
          const analyticsData = await response.json();
          setData(analyticsData);
          setCachedData("analytics-dashboard", analyticsData);
          setLastUpdated(new Date());
        } else {
          // Fallback to cached data or mock data
          const cached = getCachedData("analytics-dashboard");
          if (cached) {
            setData(cached);
          } else {
            // Mock data for demo
            setData({
              totalUsers: 12543,
              activeUsers: 1847,
              pageViews: 45621,
              bounceRate: 34.2,
              avgSessionDuration: 245,
              conversionRate: 3.8,
              topPages: [
                { path: "/dashboard", views: 8934, change: 12.5 },
                { path: "/workflows", views: 6721, change: -2.1 },
                { path: "/analytics", views: 4532, change: 8.7 },
              ],
              userActivity: Array.from({ length: 24 }, (_, i) => ({
                hour: i,
                users: Math.floor(Math.random() * 200) + 50,
              })),
              recentEvents: [
                { type: "workflow_created", count: 23, change: 15.2 },
                { type: "user_signup", count: 12, change: -5.1 },
                { type: "integration_added", count: 8, change: 22.3 },
              ],
            });
          }
        }
      } catch (error) {
        console.error("Failed to load analytics:", error);
        // Try cached data as fallback
        const cached = getCachedData("analytics-dashboard");
        if (cached) {
          setData(cached);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [isOnline, loadingStrategy, getCachedData, setCachedData]);

  const refreshData = () => {
    setLastUpdated(null);
    setData(null);
    setIsLoading(true);
    // Trigger reload
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Analytics</h2>
          <RefreshCw className="w-5 h-5 animate-spin" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600 dark:text-gray-400">
          Unable to load analytics data
        </p>
        <Button onClick={refreshData} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Analytics</h2>
          {lastUpdated && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Updated {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshData}
          disabled={!isOnline}
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">Total Users</span>
            </div>
            <div className="text-2xl font-bold">
              {data.totalUsers.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span className="text-xs text-green-600">+12.5%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">Active Users</span>
            </div>
            <div className="text-2xl font-bold">
              {data.activeUsers.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span className="text-xs text-green-600">+8.2%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium">Page Views</span>
            </div>
            <div className="text-2xl font-bold">
              {data.pageViews.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingDown className="w-3 h-3 text-red-500" />
              <span className="text-xs text-red-600">-2.1%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium">Conversion</span>
            </div>
            <div className="text-2xl font-bold">{data.conversionRate}%</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span className="text-xs text-green-600">+0.3%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Bounce Rate</span>
              <span>{data.bounceRate}%</span>
            </div>
            <Progress value={data.bounceRate} className="h-2" />
            <div className="text-xs text-gray-500">Target: &lt; 40%</div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Avg Session Duration</span>
              <span>
                {Math.floor(data.avgSessionDuration / 60)}m{" "}
                {data.avgSessionDuration % 60}s
              </span>
            </div>
            <Progress
              value={(data.avgSessionDuration / 600) * 100}
              className="h-2"
            />
            <div className="text-xs text-gray-500">Target: &gt; 5 minutes</div>
          </div>
        </CardContent>
      </Card>

      {/* Top Pages */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Top Pages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.topPages.map((page, index) => (
              <div
                key={page.path}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded text-xs font-medium flex items-center justify-center">
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{page.path}</div>
                    <div className="text-xs text-gray-600">
                      {page.views.toLocaleString()} views
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={page.change > 0 ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {page.change > 0 ? "+" : ""}
                    {page.change.toFixed(1)}%
                  </Badge>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Events */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.recentEvents.map((event) => (
              <div
                key={event.type}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <div className="text-sm font-medium capitalize">
                      {event.type.replace("_", " ")}
                    </div>
                    <div className="text-xs text-gray-600">
                      {event.count} events
                    </div>
                  </div>
                </div>
                <Badge
                  variant={event.change > 0 ? "default" : "secondary"}
                  className="text-xs"
                >
                  {event.change > 0 ? "+" : ""}
                  {event.change.toFixed(1)}%
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Integrated Mobile Features */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Workflows</h3>
          <MobileWorkflows />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Collaboration</h3>
          <MobileCollaboration />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Integrations</h3>
          <MobileIntegrations />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="h-12 flex-col gap-1"
          onClick={() => (window.location.href = "/analytics")}
        >
          <BarChart3 className="w-4 h-4" />
          <span className="text-xs">Full Analytics</span>
        </Button>

        <Button
          variant="outline"
          className="h-12 flex-col gap-1"
          onClick={() => (window.location.href = "/reports")}
        >
          <FileText className="w-4 h-4" />
          <span className="text-xs">Reports</span>
        </Button>
      </div>

      {/* Offline Indicator */}
      {!isOnline && (
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          <p>Showing cached data - some information may be outdated</p>
        </div>
      )}
    </div>
  );
}
