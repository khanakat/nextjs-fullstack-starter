"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Zap,
  Settings,
  Link,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Clock,
  Activity,
  MoreVertical,
  ChevronRight,
  RefreshCw,
  Globe,
  Database,
  MessageSquare,
  Calendar,
  CreditCard,
  Shield,
  Cloud,
} from "lucide-react";

import { useNetworkAwareLoading } from "@/hooks/use-mobile-performance";
import { useOffline } from "@/hooks/use-offline";

interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  status: "connected" | "disconnected" | "error" | "pending";
  provider: string;
  icon: string;
  lastSync?: string;
  syncFrequency?: string;
  dataPoints: number;
  isEnabled: boolean;
  hasConfig: boolean;
  errorMessage?: string;
}

interface IntegrationStats {
  total: number;
  connected: number;
  active: number;
  errors: number;
  totalDataPoints: number;
  lastSyncTime: string;
}

/**
 * Mobile-optimized Integrations Interface
 */
export function MobileIntegrations() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [stats, setStats] = useState<IntegrationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { loadingStrategy } = useNetworkAwareLoading();
  const { isOnline, getCachedData, setCachedData, executeOrQueue } =
    useOffline();

  // Load integrations data
  useEffect(() => {
    const loadIntegrations = async () => {
      setIsLoading(true);

      try {
        // Try to get cached data first if offline
        if (!isOnline) {
          const cachedIntegrations = getCachedData("integrations-list");
          const cachedStats = getCachedData("integrations-stats");
          if (cachedIntegrations && cachedStats) {
            setIntegrations(cachedIntegrations);
            setStats(cachedStats);
            setIsLoading(false);
            return;
          }
        }

        // Fetch fresh data
        const [integrationsResponse, statsResponse] = await Promise.all([
          fetch("/api/integrations", {
            headers: {
              "Cache-Control":
                loadingStrategy === "conservative" ? "max-age=300" : "no-cache",
            },
          }),
          fetch("/api/integrations/stats", {
            headers: {
              "Cache-Control":
                loadingStrategy === "conservative" ? "max-age=300" : "no-cache",
            },
          }),
        ]);

        if (integrationsResponse.ok && statsResponse.ok) {
          const integrationsData = await integrationsResponse.json();
          const statsData = await statsResponse.json();

          setIntegrations(integrationsData.integrations || []);
          setStats(statsData);

          setCachedData(
            "integrations-list",
            integrationsData.integrations || [],
          );
          setCachedData("integrations-stats", statsData);
          setLastUpdated(new Date());
        } else {
          // Fallback to cached data or mock data
          const cachedIntegrations = getCachedData("integrations-list");
          const cachedStats = getCachedData("integrations-stats");

          if (cachedIntegrations && cachedStats) {
            setIntegrations(cachedIntegrations);
            setStats(cachedStats);
          } else {
            // Mock data for demo
            const mockIntegrations: Integration[] = [
              {
                id: "1",
                name: "Slack",
                description: "Team communication and notifications",
                category: "communication",
                status: "connected",
                provider: "slack",
                icon: "MessageSquare",
                lastSync: "2024-01-15T14:30:00Z",
                syncFrequency: "real-time",
                dataPoints: 1250,
                isEnabled: true,
                hasConfig: true,
              },
              {
                id: "2",
                name: "Google Calendar",
                description: "Calendar events and scheduling",
                category: "productivity",
                status: "connected",
                provider: "google",
                icon: "Calendar",
                lastSync: "2024-01-15T13:45:00Z",
                syncFrequency: "hourly",
                dataPoints: 89,
                isEnabled: true,
                hasConfig: true,
              },
              {
                id: "3",
                name: "Stripe",
                description: "Payment processing and billing",
                category: "finance",
                status: "error",
                provider: "stripe",
                icon: "CreditCard",
                lastSync: "2024-01-14T10:20:00Z",
                syncFrequency: "daily",
                dataPoints: 456,
                isEnabled: false,
                hasConfig: true,
                errorMessage: "API key expired",
              },
              {
                id: "4",
                name: "GitHub",
                description: "Code repository and issue tracking",
                category: "development",
                status: "connected",
                provider: "github",
                icon: "Globe",
                lastSync: "2024-01-15T15:00:00Z",
                syncFrequency: "real-time",
                dataPoints: 234,
                isEnabled: true,
                hasConfig: true,
              },
              {
                id: "5",
                name: "Salesforce",
                description: "Customer relationship management",
                category: "crm",
                status: "disconnected",
                provider: "salesforce",
                icon: "Database",
                dataPoints: 0,
                isEnabled: false,
                hasConfig: false,
              },
            ];

            const mockStats: IntegrationStats = {
              total: 5,
              connected: 3,
              active: 3,
              errors: 1,
              totalDataPoints: 2029,
              lastSyncTime: "2024-01-15T15:00:00Z",
            };

            setIntegrations(mockIntegrations);
            setStats(mockStats);
          }
        }
      } catch (error) {
        console.error("Failed to load integrations:", error);
        // Try cached data as fallback
        const cachedIntegrations = getCachedData("integrations-list");
        const cachedStats = getCachedData("integrations-stats");
        if (cachedIntegrations && cachedStats) {
          setIntegrations(cachedIntegrations);
          setStats(cachedStats);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadIntegrations();
  }, [isOnline, loadingStrategy, getCachedData, setCachedData]);

  // Filter integrations
  const filteredIntegrations = integrations.filter((integration) => {
    const matchesSearch =
      integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || integration.category === filterCategory;
    const matchesStatus =
      filterStatus === "all" || integration.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "disconnected":
        return <XCircle className="w-4 h-4 text-gray-500" />;
      case "error":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <XCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "default";
      case "disconnected":
        return "secondary";
      case "error":
        return "destructive";
      case "pending":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "communication":
        return <MessageSquare className="w-4 h-4" />;
      case "productivity":
        return <Calendar className="w-4 h-4" />;
      case "finance":
        return <CreditCard className="w-4 h-4" />;
      case "development":
        return <Globe className="w-4 h-4" />;
      case "crm":
        return <Database className="w-4 h-4" />;
      case "security":
        return <Shield className="w-4 h-4" />;
      case "storage":
        return <Cloud className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  const handleToggleIntegration = async (
    integrationId: string,
    enabled: boolean,
  ) => {
    try {
      await executeOrQueue(
        {
          type: "update",
          entity: "integration",
          data: { id: integrationId, enabled },
        },
        async () => {
          const response = await fetch(
            `/api/integrations/${integrationId}/toggle`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ enabled }),
            },
          );

          if (!response.ok) {
            throw new Error("Failed to toggle integration");
          }

          // Update local state
          setIntegrations((prev) =>
            prev.map((integration) =>
              integration.id === integrationId
                ? { ...integration, isEnabled: enabled }
                : integration,
            ),
          );

          return response.json();
        },
      );
    } catch (error) {
      console.error("Failed to toggle integration:", error);
    }
  };

  const handleSyncIntegration = async (integrationId: string) => {
    try {
      await executeOrQueue(
        {
          type: "update",
          entity: "integration",
          data: { id: integrationId, action: "sync" },
        },
        async () => {
          const response = await fetch(
            `/api/integrations/${integrationId}/sync`,
            {
              method: "POST",
            },
          );

          if (!response.ok) {
            throw new Error("Failed to sync integration");
          }

          // Update local state
          setIntegrations((prev) =>
            prev.map((integration) =>
              integration.id === integrationId
                ? { ...integration, lastSync: new Date().toISOString() }
                : integration,
            ),
          );

          return response.json();
        },
      );
    } catch (error) {
      console.error("Failed to sync integration:", error);
    }
  };

  const refreshData = () => {
    setLastUpdated(null);
    setIntegrations([]);
    setStats(null);
    setIsLoading(true);
    // Trigger reload
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Integrations</h2>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Integrations</h2>
          {lastUpdated && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Updated {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={!isOnline}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            onClick={() => (window.location.href = "/integrations/browse")}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Link className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">Connected</span>
              </div>
              <div className="text-2xl font-bold">{stats.connected}</div>
              <div className="text-xs text-gray-600">
                {stats.total} total, {stats.errors} errors
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">Data Points</span>
              </div>
              <div className="text-2xl font-bold">
                {stats.totalDataPoints.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600">
                Last sync: {new Date(stats.lastSyncTime).toLocaleTimeString()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            "all",
            "communication",
            "productivity",
            "finance",
            "development",
            "crm",
          ].map((category) => (
            <Button
              key={category}
              variant={filterCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterCategory(category)}
              className="whitespace-nowrap"
            >
              {category === "all" ? (
                <Filter className="w-3 h-3 mr-1" />
              ) : (
                getCategoryIcon(category)
              )}
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {["all", "connected", "disconnected", "error"].map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus(status)}
              className="whitespace-nowrap"
            >
              {status === "all" ? (
                <Filter className="w-3 h-3 mr-1" />
              ) : (
                getStatusIcon(status)
              )}
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Integrations List */}
      <div className="space-y-3">
        {filteredIntegrations.map((integration) => (
          <Card
            key={integration.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getCategoryIcon(integration.category)}
                    <h3 className="font-medium text-sm">{integration.name}</h3>
                    <Badge
                      variant={getStatusColor(integration.status) as any}
                      className="text-xs"
                    >
                      {integration.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {integration.description}
                  </p>
                  {integration.errorMessage && (
                    <p className="text-xs text-red-600 mb-2">
                      Error: {integration.errorMessage}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>
                      {integration.dataPoints.toLocaleString()} data points
                    </span>
                    {integration.lastSync && (
                      <span>
                        Synced:{" "}
                        {new Date(integration.lastSync).toLocaleDateString()}
                      </span>
                    )}
                    {integration.syncFrequency && (
                      <span>Freq: {integration.syncFrequency}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={integration.isEnabled}
                    onCheckedChange={(checked) =>
                      handleToggleIntegration(integration.id, checked)
                    }
                    disabled={!isOnline || integration.status === "error"}
                  />
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreVertical className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(integration.status)}
                  <span className="text-xs text-gray-500">
                    {integration.status === "connected"
                      ? "Active"
                      : integration.status === "error"
                        ? "Needs attention"
                        : integration.status === "pending"
                          ? "Connecting..."
                          : "Not connected"}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {integration.status === "connected" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSyncIntegration(integration.id);
                      }}
                      disabled={!isOnline}
                      className="h-7 px-2"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      (window.location.href = `/integrations/${integration.id}`)
                    }
                    className="h-7 px-2"
                  >
                    <Settings className="w-3 h-3" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      (window.location.href = `/integrations/${integration.id}`)
                    }
                    className="h-7 px-2"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredIntegrations.length === 0 && (
        <div className="text-center py-8">
          <Zap className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {searchQuery || filterCategory !== "all" || filterStatus !== "all"
              ? "No integrations match your criteria"
              : "No integrations configured"}
          </p>
          <Button
            onClick={() => (window.location.href = "/integrations/browse")}
            className="mt-4"
          >
            <Plus className="w-4 h-4 mr-2" />
            Browse Integrations
          </Button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="h-12 flex-col gap-1"
          onClick={() => (window.location.href = "/integrations")}
        >
          <Link className="w-4 h-4" />
          <span className="text-xs">All Integrations</span>
        </Button>

        <Button
          variant="outline"
          className="h-12 flex-col gap-1"
          onClick={() => (window.location.href = "/integrations/browse")}
        >
          <Plus className="w-4 h-4" />
          <span className="text-xs">Add New</span>
        </Button>
      </div>

      {/* Offline Indicator */}
      {!isOnline && (
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          <p>Integration management requires an internet connection</p>
        </div>
      )}
    </div>
  );
}
