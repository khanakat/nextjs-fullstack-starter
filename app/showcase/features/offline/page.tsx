"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  WifiOff,
  RefreshCw,
  Home,
  ArrowLeft,
  AlertTriangle,
  Clock,
  Database,
  Smartphone,
  CheckCircle,
  XCircle,
  Download,
  Upload,
  RotateCcw,
  Globe,
  HardDrive,
  Wifi,
  Battery,
  Settings,
} from "lucide-react";

// Types
interface OfflineData {
  id: string;
  type: "page" | "api" | "asset";
  url: string;
  size: number;
  lastUpdated: Date;
  status: "cached" | "syncing" | "failed";
}

interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  pendingUploads: number;
  pendingDownloads: number;
  cacheSize: number;
  maxCacheSize: number;
}

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: true,
    lastSync: new Date(),
    pendingUploads: 0,
    pendingDownloads: 0,
    cacheSize: 15.7, // MB
    maxCacheSize: 100, // MB
  });

  const [offlineData, setOfflineData] = useState<OfflineData[]>([
    {
      id: "1",
      type: "page",
      url: "/dashboard",
      size: 2.3,
      lastUpdated: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      status: "cached",
    },
    {
      id: "2",
      type: "api",
      url: "/api/user/profile",
      size: 0.5,
      lastUpdated: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
      status: "cached",
    },
    {
      id: "3",
      type: "asset",
      url: "/images/logo.png",
      size: 1.2,
      lastUpdated: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      status: "cached",
    },
    {
      id: "4",
      type: "page",
      url: "/settings",
      size: 1.8,
      lastUpdated: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      status: "syncing",
    },
    {
      id: "5",
      type: "api",
      url: "/api/notifications",
      size: 0.3,
      lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      status: "failed",
    },
  ]);

  const handleSync = useCallback(async () => {
    if (!isOnline) {
      toast.error("Cannot sync while offline");
      return;
    }

    toast.info("Syncing data...");
    
    // Simulate sync process
    setTimeout(() => {
      setSyncStatus((prev) => ({
        ...prev,
        lastSync: new Date(),
        pendingUploads: 0,
        pendingDownloads: 0,
      }));
      
      setOfflineData((prev) =>
        prev.map((item) => ({
          ...item,
          status: item.status === "failed" ? "cached" : item.status,
          lastUpdated: new Date(),
        }))
      );
      
      toast.success("Data synced successfully!");
    }, 2000);
  }, [isOnline]);

  // Monitor online/offline status
  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      setSyncStatus((prev) => ({
        ...prev,
        isOnline: online,
        lastSync: online ? new Date() : prev.lastSync,
      }));

      if (online) {
        toast.success("Connection restored! Syncing data...");
        handleSync();
      } else {
        toast.error("You're now offline. Some features may be limited.");
      }
    };

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, [handleSync]);

  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = "/";
  };

  const handleGoBack = () => {
    window.history.back();
  };

  const handleClearCache = () => {
    setSyncStatus((prev) => ({
      ...prev,
      cacheSize: 0,
    }));
    
    setOfflineData([]);
    toast.success("Cache cleared successfully!");
  };

  const formatFileSize = (sizeInMB: number) => {
    if (sizeInMB < 1) {
      return `${(sizeInMB * 1024).toFixed(0)} KB`;
    }
    return `${sizeInMB.toFixed(1)} MB`;
  };

  const getStatusIcon = (status: OfflineData["status"]) => {
    switch (status) {
      case "cached":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "syncing":
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: OfflineData["status"]) => {
    switch (status) {
      case "cached":
        return <Badge className="bg-green-100 text-green-800">Cached</Badge>;
      case "syncing":
        return <Badge className="bg-blue-100 text-blue-800">Syncing</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getTypeIcon = (type: OfflineData["type"]) => {
    switch (type) {
      case "page":
        return <Globe className="w-4 h-4 text-blue-600" />;
      case "api":
        return <Database className="w-4 h-4 text-green-600" />;
      case "asset":
        return <Download className="w-4 h-4 text-purple-600" />;
      default:
        return <HardDrive className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Offline Support</h1>
          <p className="text-muted-foreground">
            Manage offline functionality and cached data
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <div className="flex items-center gap-2 text-green-600">
              <Wifi className="w-4 h-4" />
              <span className="text-sm font-medium">Online</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-600">
              <WifiOff className="w-4 h-4" />
              <span className="text-sm font-medium">Offline</span>
            </div>
          )}
        </div>
      </div>

      {/* Offline Banner */}
      {!isOnline && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <WifiOff className="w-5 h-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-orange-800 mb-1">
                  You're currently offline
                </h3>
                <p className="text-sm text-orange-700 mb-3">
                  Some features may be limited, but you can still access cached content and work offline.
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleRetry}
                    size="sm"
                    variant="outline"
                    className="border-orange-300 text-orange-700 hover:bg-orange-100"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Retry Connection
                  </Button>
                  <Button
                    onClick={handleGoHome}
                    size="sm"
                    variant="outline"
                    className="border-orange-300 text-orange-700 hover:bg-orange-100"
                  >
                    <Home className="w-4 h-4 mr-1" />
                    Go Home
                  </Button>
                  <Button
                    onClick={handleGoBack}
                    size="sm"
                    variant="outline"
                    className="border-orange-300 text-orange-700 hover:bg-orange-100"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Go Back
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Connection</p>
                <p className={`text-xl font-bold ${isOnline ? "text-green-600" : "text-red-600"}`}>
                  {isOnline ? "Online" : "Offline"}
                </p>
              </div>
              {isOnline ? (
                <Wifi className="w-6 h-6 text-green-600" />
              ) : (
                <WifiOff className="w-6 h-6 text-red-600" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cache Size</p>
                <p className="text-xl font-bold">
                  {formatFileSize(syncStatus.cacheSize)}
                </p>
              </div>
              <HardDrive className="w-6 h-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Sync</p>
                <p className="text-xl font-bold">
                  {syncStatus.pendingUploads + syncStatus.pendingDownloads}
                </p>
              </div>
              <RotateCcw className="w-6 h-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Last Sync</p>
                <p className="text-xl font-bold">
                  {syncStatus.lastSync
                    ? new Date(syncStatus.lastSync).toLocaleTimeString()
                    : "Never"}
                </p>
              </div>
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="cache" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cache">
            <Database className="w-4 h-4 mr-2" />
            Cache Management
          </TabsTrigger>
          <TabsTrigger value="sync">
            <RotateCcw className="w-4 h-4 mr-2" />
            Sync Status
          </TabsTrigger>
          <TabsTrigger value="tips">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Offline Tips
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cache" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Cached Data</CardTitle>
                  <CardDescription>
                    Manage your offline cache and stored data
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSync}
                    disabled={!isOnline}
                    size="sm"
                    variant="outline"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Sync Now
                  </Button>
                  <Button
                    onClick={handleClearCache}
                    size="sm"
                    variant="outline"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Clear Cache
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Cache Usage */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Cache Usage</span>
                    <span className="text-sm text-muted-foreground">
                      {formatFileSize(syncStatus.cacheSize)} / {formatFileSize(syncStatus.maxCacheSize)}
                    </span>
                  </div>
                  <Progress
                    value={(syncStatus.cacheSize / syncStatus.maxCacheSize) * 100}
                    className="h-2"
                  />
                </div>

                {/* Cached Items */}
                <div className="space-y-3">
                  {offlineData.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getTypeIcon(item.type)}
                        <div>
                          <p className="font-medium text-sm">{item.url}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(item.size)} • Updated{" "}
                            {item.lastUpdated.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(item.status)}
                        {getStatusIcon(item.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Synchronization Status</CardTitle>
              <CardDescription>
                Monitor data synchronization between offline and online states
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Pending Uploads
                  </h4>
                  {syncStatus.pendingUploads > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {syncStatus.pendingUploads} items waiting to upload
                      </p>
                      <Progress value={0} className="h-2" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">All data uploaded</span>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Pending Downloads
                  </h4>
                  {syncStatus.pendingDownloads > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {syncStatus.pendingDownloads} items waiting to download
                      </p>
                      <Progress value={0} className="h-2" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">All data downloaded</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto-sync</p>
                    <p className="text-sm text-muted-foreground">
                      Automatically sync when connection is restored
                    </p>
                  </div>
                  <Badge variant="default">Enabled</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tips" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Offline Usage Tips</CardTitle>
              <CardDescription>
                Make the most of your offline experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    What works offline
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      View cached pages and content
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      Create and edit drafts
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      Access downloaded files
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      Use basic app features
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Limitations offline
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <XCircle className="w-3 h-3 text-red-600" />
                      Real-time data updates
                    </li>
                    <li className="flex items-center gap-2">
                      <XCircle className="w-3 h-3 text-red-600" />
                      File uploads and sharing
                    </li>
                    <li className="flex items-center gap-2">
                      <XCircle className="w-3 h-3 text-red-600" />
                      Live collaboration
                    </li>
                    <li className="flex items-center gap-2">
                      <XCircle className="w-3 h-3 text-red-600" />
                      External integrations
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Best Practices</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-2">
                      <Database className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">
                          Cache Important Data
                        </p>
                        <p className="text-xs text-blue-700">
                          Pre-cache frequently accessed content for offline use
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-start gap-2">
                      <Battery className="w-4 h-4 text-green-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          Monitor Battery
                        </p>
                        <p className="text-xs text-green-700">
                          Offline mode can help preserve battery life
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-start gap-2">
                      <RotateCcw className="w-4 h-4 text-purple-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-purple-800">
                          Sync Regularly
                        </p>
                        <p className="text-xs text-purple-700">
                          Keep your offline data up to date when online
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-start gap-2">
                      <Settings className="w-4 h-4 text-orange-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-orange-800">
                          Manage Storage
                        </p>
                        <p className="text-xs text-orange-700">
                          Clear cache periodically to free up space
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}