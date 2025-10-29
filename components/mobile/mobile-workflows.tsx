"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Zap,
  Play,
  Pause,
  Square,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MoreVertical,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

import { useNetworkAwareLoading } from "@/hooks/use-mobile-performance";
import { useOffline } from "@/hooks/use-offline";

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: "active" | "paused" | "stopped" | "error";
  lastRun: string;
  nextRun?: string;
  runCount: number;
  successRate: number;
  avgDuration: number;
  triggers: string[];
  actions: number;
  category: string;
}

interface WorkflowStats {
  total: number;
  active: number;
  paused: number;
  errors: number;
  totalRuns: number;
  avgSuccessRate: number;
}

/**
 * Mobile-optimized Workflows Interface
 */
export function MobileWorkflows() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [stats, setStats] = useState<WorkflowStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { loadingStrategy } = useNetworkAwareLoading();
  const { isOnline, getCachedData, setCachedData, executeOrQueue } =
    useOffline();

  // Load workflows data
  useEffect(() => {
    const loadWorkflows = async () => {
      setIsLoading(true);

      try {
        // Try to get cached data first if offline
        if (!isOnline) {
          const cachedWorkflows = getCachedData("workflows-list");
          const cachedStats = getCachedData("workflows-stats");
          if (cachedWorkflows && cachedStats) {
            setWorkflows(cachedWorkflows);
            setStats(cachedStats);
            setIsLoading(false);
            return;
          }
        }

        // Fetch fresh data
        const [workflowsResponse, statsResponse] = await Promise.all([
          fetch("/api/workflows", {
            headers: {
              "Cache-Control":
                loadingStrategy === "conservative" ? "max-age=300" : "no-cache",
            },
          }),
          fetch("/api/workflows/stats", {
            headers: {
              "Cache-Control":
                loadingStrategy === "conservative" ? "max-age=300" : "no-cache",
            },
          }),
        ]);

        if (workflowsResponse.ok && statsResponse.ok) {
          const workflowsData = await workflowsResponse.json();
          const statsData = await statsResponse.json();

          setWorkflows(workflowsData.workflows || []);
          setStats(statsData);

          setCachedData("workflows-list", workflowsData.workflows || []);
          setCachedData("workflows-stats", statsData);
          setLastUpdated(new Date());
        } else {
          // Fallback to cached data or mock data
          const cachedWorkflows = getCachedData("workflows-list");
          const cachedStats = getCachedData("workflows-stats");

          if (cachedWorkflows && cachedStats) {
            setWorkflows(cachedWorkflows);
            setStats(cachedStats);
          } else {
            // Mock data for demo
            const mockWorkflows: Workflow[] = [
              {
                id: "1",
                name: "Daily Report Generation",
                description: "Generates and sends daily analytics reports",
                status: "active",
                lastRun: "2024-01-15T08:00:00Z",
                nextRun: "2024-01-16T08:00:00Z",
                runCount: 45,
                successRate: 97.8,
                avgDuration: 120,
                triggers: ["schedule", "webhook"],
                actions: 5,
                category: "reporting",
              },
              {
                id: "2",
                name: "User Onboarding",
                description: "Automated user onboarding sequence",
                status: "active",
                lastRun: "2024-01-15T14:30:00Z",
                runCount: 23,
                successRate: 100,
                avgDuration: 45,
                triggers: ["user_signup"],
                actions: 3,
                category: "user_management",
              },
              {
                id: "3",
                name: "Data Backup",
                description: "Weekly database backup process",
                status: "paused",
                lastRun: "2024-01-08T02:00:00Z",
                runCount: 12,
                successRate: 91.7,
                avgDuration: 300,
                triggers: ["schedule"],
                actions: 2,
                category: "maintenance",
              },
            ];

            const mockStats: WorkflowStats = {
              total: 3,
              active: 2,
              paused: 1,
              errors: 0,
              totalRuns: 80,
              avgSuccessRate: 96.5,
            };

            setWorkflows(mockWorkflows);
            setStats(mockStats);
          }
        }
      } catch (error) {
        console.error("Failed to load workflows:", error);
        // Try cached data as fallback
        const cachedWorkflows = getCachedData("workflows-list");
        const cachedStats = getCachedData("workflows-stats");
        if (cachedWorkflows && cachedStats) {
          setWorkflows(cachedWorkflows);
          setStats(cachedStats);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkflows();
  }, [isOnline, loadingStrategy, getCachedData, setCachedData]);

  // Filter workflows
  const filteredWorkflows = workflows.filter((workflow) => {
    const matchesSearch =
      workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workflow.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || workflow.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "paused":
        return <Pause className="w-4 h-4 text-yellow-500" />;
      case "stopped":
        return <Square className="w-4 h-4 text-gray-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "paused":
        return "secondary";
      case "stopped":
        return "outline";
      case "error":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const handleWorkflowAction = async (
    workflowId: string,
    action: "start" | "pause" | "stop",
  ) => {
    try {
      await executeOrQueue(
        {
          type: "update",
          entity: "workflow",
          data: { id: workflowId, action },
        },
        async () => {
          const response = await fetch(
            `/api/workflows/${workflowId}/${action}`,
            {
              method: "POST",
            },
          );

          if (!response.ok) {
            throw new Error(`Failed to ${action} workflow`);
          }

          // Update local state
          setWorkflows((prev) =>
            prev.map((w) =>
              w.id === workflowId
                ? {
                    ...w,
                    status: action === "start" ? "active" : (action as any),
                  }
                : w,
            ),
          );

          return response.json();
        },
      );
    } catch (error) {
      console.error(`Failed to ${action} workflow:`, error);
    }
  };

  const refreshData = () => {
    setLastUpdated(null);
    setWorkflows([]);
    setStats(null);
    setIsLoading(true);
    // Trigger reload
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Workflows</h2>
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
          <h2 className="text-xl font-bold">Workflows</h2>
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
            onClick={() => (window.location.href = "/workflows/new")}
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
                <Zap className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">Total</span>
              </div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-gray-600">
                {stats.active} active, {stats.paused} paused
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">Success Rate</span>
              </div>
              <div className="text-2xl font-bold">
                {stats.avgSuccessRate.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-600">
                {stats.totalRuns} total runs
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
            placeholder="Search workflows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {["all", "active", "paused", "stopped", "error"].map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus(status)}
              className="whitespace-nowrap"
            >
              <Filter className="w-3 h-3 mr-1" />
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Workflows List */}
      <div className="space-y-3">
        {filteredWorkflows.map((workflow) => (
          <Card
            key={workflow.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(workflow.status)}
                    <h3 className="font-medium text-sm">{workflow.name}</h3>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {workflow.description}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{workflow.runCount} runs</span>
                    <span>{workflow.successRate.toFixed(1)}% success</span>
                    <span>{workflow.actions} actions</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Badge
                    variant={getStatusColor(workflow.status) as any}
                    className="text-xs"
                  >
                    {workflow.status}
                  </Badge>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreVertical className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Last run: {new Date(workflow.lastRun).toLocaleDateString()}
                  </div>
                  {workflow.nextRun && (
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      Next: {new Date(workflow.nextRun).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {workflow.status === "active" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWorkflowAction(workflow.id, "pause");
                      }}
                      className="h-7 px-2"
                    >
                      <Pause className="w-3 h-3" />
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWorkflowAction(workflow.id, "start");
                      }}
                      className="h-7 px-2"
                    >
                      <Play className="w-3 h-3" />
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      (window.location.href = `/workflows/${workflow.id}`)
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

      {filteredWorkflows.length === 0 && (
        <div className="text-center py-8">
          <Zap className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {searchQuery || filterStatus !== "all"
              ? "No workflows match your criteria"
              : "No workflows found"}
          </p>
          <Button
            onClick={() => (window.location.href = "/workflows/new")}
            className="mt-4"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Workflow
          </Button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="h-12 flex-col gap-1"
          onClick={() => (window.location.href = "/workflows")}
        >
          <Zap className="w-4 h-4" />
          <span className="text-xs">All Workflows</span>
        </Button>

        <Button
          variant="outline"
          className="h-12 flex-col gap-1"
          onClick={() => (window.location.href = "/workflows/templates")}
        >
          <Plus className="w-4 h-4" />
          <span className="text-xs">Templates</span>
        </Button>
      </div>

      {/* Offline Indicator */}
      {!isOnline && (
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          <p>Some actions may be queued until you're back online</p>
        </div>
      )}
    </div>
  );
}
