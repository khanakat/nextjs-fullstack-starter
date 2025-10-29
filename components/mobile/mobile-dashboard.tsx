"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  DollarSign,
  Activity,
  Smartphone,
  Wifi,
  WifiOff,
  Battery,
  Signal,
  RefreshCw,
  Settings,
  Bell,
  Search,
  Plus,
  ChevronRight,
} from "lucide-react";
import { MobileAnalytics } from "./mobile-analytics";
import { MobileWorkflows } from "./mobile-workflows";
import { MobileCollaboration } from "./mobile-collaboration";
import { MobileIntegrations } from "./mobile-integrations";
import { useNetworkAwareLoading } from "@/hooks/use-mobile-performance";
import { useOffline } from "@/hooks/use-offline";

interface MobileDashboardProps {
  className?: string;
}

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  conversionRate: number;
  mobileUsers: number;
  offlineUsers: number;
}

const mockStats: DashboardStats = {
  totalUsers: 12543,
  activeUsers: 8932,
  totalRevenue: 45678,
  conversionRate: 3.2,
  mobileUsers: 6234,
  offlineUsers: 234,
};

export function MobileDashboard({ className }: MobileDashboardProps) {
  const [stats, setStats] = useState<DashboardStats>(mockStats);
  const [refreshing, setRefreshing] = useState(false);
  const { networkInfo } = useNetworkAwareLoading();
  const { isOnline } = useOffline();

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setStats(mockStats);
    setRefreshing(false);
  };

  if (!networkInfo) {
    return (
      <div className="space-y-6 p-4">
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 p-4 ${className}`}>
      {/* Mobile Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mobile Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Optimized for mobile experience
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isOnline ? (
            <WifiOff className="h-5 w-5 text-red-500" />
          ) : (
            <Wifi className="h-5 w-5 text-green-500" />
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* Mobile Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Users</span>
            </div>
            <div className="text-2xl font-bold">
              {stats.totalUsers.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              {stats.activeUsers.toLocaleString()} active
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Revenue</span>
            </div>
            <div className="text-2xl font-bold">
              ${stats.totalRevenue.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              {stats.conversionRate}% conversion
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Mobile</span>
            </div>
            <div className="text-2xl font-bold">
              {stats.mobileUsers.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              {((stats.mobileUsers / stats.totalUsers) * 100).toFixed(1)}% of
              total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Activity</span>
            </div>
            <div className="text-2xl font-bold">{stats.offlineUsers}</div>
            <div className="text-xs text-muted-foreground">Offline users</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-12 flex-col gap-1">
              <Plus className="h-4 w-4" />
              <span className="text-xs">New Task</span>
            </Button>
            <Button variant="outline" className="h-12 flex-col gap-1">
              <Search className="h-4 w-4" />
              <span className="text-xs">Search</span>
            </Button>
            <Button variant="outline" className="h-12 flex-col gap-1">
              <Bell className="h-4 w-4" />
              <span className="text-xs">Notifications</span>
            </Button>
            <Button variant="outline" className="h-12 flex-col gap-1">
              <Settings className="h-4 w-4" />
              <span className="text-xs">Settings</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Analytics</span>
            <ChevronRight className="h-4 w-4" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MobileAnalytics />
        </CardContent>
      </Card>

      {/* Mobile Workflows */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Workflows</span>
            <ChevronRight className="h-4 w-4" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MobileWorkflows />
        </CardContent>
      </Card>

      {/* Mobile Collaboration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Collaboration</span>
            <ChevronRight className="h-4 w-4" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MobileCollaboration />
        </CardContent>
      </Card>

      {/* Mobile Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Integrations</span>
            <ChevronRight className="h-4 w-4" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MobileIntegrations />
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Signal className="h-4 w-4 text-green-500" />
                <span className="text-sm">Network</span>
              </div>
              <Badge variant={!isOnline ? "destructive" : "default"}>
                {!isOnline ? "Offline" : "Online"}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Battery className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Performance</span>
              </div>
              <Badge variant="default">Good</Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-500" />
                <span className="text-sm">Sync Status</span>
              </div>
              <Badge variant="default">Synced</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default MobileDashboard;
