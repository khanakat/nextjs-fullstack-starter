"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Search,
  Filter,
  MoreHorizontal,
  Settings,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Activity,
  Eye,
  Edit,
  Power,
  BarChart3,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { toast } from "sonner";

interface Integration {
  id: string;
  name: string;
  provider: string;
  status: "active" | "inactive" | "error" | "syncing";
  lastSync: string;
  nextSync: string;
  syncFrequency: string;
  errorCount: number;
  successRate: number;
  dataTransferred: number;
  createdAt: string;
  config: Record<string, any>;
  providerMetadata: {
    name: string;
    icon: string;
    color: string;
  };
}

interface ConnectionManagerProps {
  organizationId?: string;
}

export default function ConnectionManager({
  organizationId,
}: ConnectionManagerProps) {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>(
    [],
  );
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  useEffect(() => {
    loadIntegrations();
  }, [organizationId]);

  const loadIntegrations = async () => {
    try {
      const response = await fetch("/api/integrations");
      if (response.ok) {
        const data = await response.json();
        setIntegrations(data);
      }
    } catch (error) {
      console.error("Failed to load integrations:", error);
      toast.error("Failed to load integrations");
    } finally {
      setLoading(false);
    }
  };

  const filteredIntegrations = integrations.filter((integration) => {
    const matchesSearch =
      integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.provider.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || integration.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleToggleStatus = async (
    integrationId: string,
    currentStatus: string,
  ) => {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      const response = await fetch(`/api/integrations/${integrationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setIntegrations((prev) =>
          prev.map((integration) =>
            integration.id === integrationId
              ? { ...integration, status: newStatus as any }
              : integration,
          ),
        );
        toast.success(
          `Integration ${newStatus === "active" ? "enabled" : "disabled"}`,
        );
      }
    } catch (error) {
      toast.error("Failed to update integration status");
    }
  };

  const handleSync = async (integrationId: string) => {
    try {
      const response = await fetch(`/api/integrations/${integrationId}/sync`, {
        method: "POST",
      });

      if (response.ok) {
        setIntegrations((prev) =>
          prev.map((integration) =>
            integration.id === integrationId
              ? { ...integration, status: "syncing" as any }
              : integration,
          ),
        );
        toast.success("Sync started");

        // Refresh data after a delay
        setTimeout(loadIntegrations, 2000);
      }
    } catch (error) {
      toast.error("Failed to start sync");
    }
  };

  const handleDelete = async (integrationId: string) => {
    if (!confirm("Are you sure you want to delete this integration?")) return;

    try {
      const response = await fetch(`/api/integrations/${integrationId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setIntegrations((prev) =>
          prev.filter((integration) => integration.id !== integrationId),
        );
        toast.success("Integration deleted");
      }
    } catch (error) {
      toast.error("Failed to delete integration");
    }
  };

  const handleBulkAction = async (
    action: "enable" | "disable" | "delete" | "sync",
  ) => {
    if (selectedIntegrations.length === 0) return;

    setBulkActionLoading(true);
    try {
      const promises = selectedIntegrations.map(async (integrationId) => {
        switch (action) {
          case "enable":
          case "disable":
            return fetch(`/api/integrations/${integrationId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                status: action === "enable" ? "active" : "inactive",
              }),
            });
          case "delete":
            return fetch(`/api/integrations/${integrationId}`, {
              method: "DELETE",
            });
          case "sync":
            return fetch(`/api/integrations/${integrationId}/sync`, {
              method: "POST",
            });
        }
      });

      await Promise.all(promises);

      if (action === "delete") {
        setIntegrations((prev) =>
          prev.filter(
            (integration) => !selectedIntegrations.includes(integration.id),
          ),
        );
      } else {
        loadIntegrations();
      }

      setSelectedIntegrations([]);
      toast.success(`Bulk ${action} completed`);
    } catch (error) {
      toast.error(`Failed to ${action} integrations`);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "inactive":
        return <XCircle className="h-4 w-4 text-gray-400" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "syncing":
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "inactive":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "error":
        return "bg-red-100 text-red-800 border-red-200";
      case "syncing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Connection Manager</h2>
          <p className="text-gray-600">
            Manage and monitor your active integrations
          </p>
        </div>

        <div className="flex gap-2">
          {selectedIntegrations.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={bulkActionLoading}>
                  {bulkActionLoading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Settings className="h-4 w-4 mr-2" />
                  )}
                  Bulk Actions ({selectedIntegrations.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleBulkAction("enable")}>
                  <Power className="h-4 w-4 mr-2" />
                  Enable Selected
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction("disable")}>
                  <Power className="h-4 w-4 mr-2" />
                  Disable Selected
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction("sync")}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Selected
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleBulkAction("delete")}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button onClick={loadIntegrations} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="error">Error</option>
            <option value="syncing">Syncing</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{integrations.length}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {integrations.filter((i) => i.status === "active").length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Errors</p>
                <p className="text-2xl font-bold text-red-600">
                  {integrations.filter((i) => i.status === "error").length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Success Rate</p>
                <p className="text-2xl font-bold">
                  {Math.round(
                    integrations.reduce((acc, i) => acc + i.successRate, 0) /
                      integrations.length || 0,
                  )}
                  %
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integrations List */}
      <div className="space-y-4">
        {filteredIntegrations.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No integrations found
              </h3>
              <p className="text-gray-600">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Create your first integration to get started"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredIntegrations.map((integration) => (
            <Card
              key={integration.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={selectedIntegrations.includes(integration.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIntegrations((prev) => [
                            ...prev,
                            integration.id,
                          ]);
                        } else {
                          setSelectedIntegrations((prev) =>
                            prev.filter((id) => id !== integration.id),
                          );
                        }
                      }}
                      className="rounded"
                    />

                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                      style={{
                        backgroundColor: integration.providerMetadata.color,
                      }}
                    >
                      {integration.providerMetadata.icon}
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg">
                        {integration.name}
                      </h3>
                      <p className="text-gray-600">
                        {integration.providerMetadata.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusIcon(integration.status)}
                        <Badge className={getStatusColor(integration.status)}>
                          {integration.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        Last sync:{" "}
                        {new Date(integration.lastSync).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={integration.status === "active"}
                        onCheckedChange={() =>
                          handleToggleStatus(integration.id, integration.status)
                        }
                      />

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleSync(integration.id)}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Sync Now
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Settings
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(integration.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>

                {/* Integration Stats */}
                <div className="mt-4 grid grid-cols-4 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Success Rate</p>
                    <p className="font-semibold text-green-600">
                      {integration.successRate}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Errors</p>
                    <p className="font-semibold text-red-600">
                      {integration.errorCount}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Data Transferred</p>
                    <p className="font-semibold">
                      {integration.dataTransferred.toLocaleString()} KB
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Next Sync</p>
                    <p className="font-semibold">
                      {new Date(integration.nextSync).toLocaleString()}
                    </p>
                  </div>
                </div>

                {integration.status === "error" && (
                  <Alert className="mt-4 border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      This integration has encountered errors. Check the logs
                      for more details.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
