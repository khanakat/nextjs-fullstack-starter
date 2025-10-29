"use client";

import React, { useState, useEffect } from "react";
import { useConditionalUser } from "@/components/conditional-clerk";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Wifi,
  WifiOff,
  Battery,
  Signal,
  Download,
  Bell,
  Settings,
  Activity,
  Zap,
  Globe,
  Shield,
  Gauge,
  Users,
  BarChart3,
  CheckCircle,
  Info,
  Vibrate,
  Volume2,
  Moon,
  Sun,
} from "lucide-react";

// Error Boundary Component
class MobilePageErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Mobile page error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container mx-auto py-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
              <p className="text-muted-foreground mb-4">
                There was an error loading the mobile dashboard.
              </p>
              <button
                onClick={() => this.setState({ hasError: false })}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Custom hooks (these would be in separate files in a real app)
const useMobilePerformance = () => {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    memoryUsage: 0,
    batteryLevel: 0,
    networkSpeed: 0,
  });

  useEffect(() => {
    // Simulate performance metrics
    const updateMetrics = () => {
      setMetrics({
        loadTime: Math.random() * 3 + 1, // 1-4 seconds
        memoryUsage: Math.random() * 100, // 0-100%
        batteryLevel: Math.random() * 100, // 0-100%
        networkSpeed: Math.random() * 50 + 10, // 10-60 Mbps
      });
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  return metrics;
};

const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported("Notification" in window);
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  };

  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (permission === "granted") {
      new Notification(title, options);
    }
  };

  return {
    permission,
    isSupported,
    requestPermission,
    sendNotification,
  };
};

const useOffline = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionType, setConnectionType] = useState<string>("unknown");

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    const updateConnectionType = () => {
      // @ts-ignore - navigator.connection is experimental
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (connection) {
        setConnectionType(connection.effectiveType || "unknown");
      }
    };

    updateOnlineStatus();
    updateConnectionType();

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    // @ts-ignore
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      connection.addEventListener("change", updateConnectionType);
    }

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
      if (connection) {
        connection.removeEventListener("change", updateConnectionType);
      }
    };
  }, []);

  return { isOnline, connectionType };
};

function MobilePage() {
  const { user, isLoaded } = useConditionalUser();
  const performance = useMobilePerformance();
  const notifications = usePushNotifications();
  const { isOnline, connectionType } = useOffline();

  const [pwaInstallPrompt, setPwaInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [settings, setSettings] = useState({
    darkMode: false,
    notifications: true,
    vibration: true,
    sound: true,
    autoSync: true,
    dataCompression: false,
  });

  // PWA Installation
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setPwaInstallPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setPwaInstallPrompt(null);
      toast.success("App installed successfully!");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Check if app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (!pwaInstallPrompt) return;

    try {
      const result = await pwaInstallPrompt.prompt();
      if (result.outcome === "accepted") {
        toast.success("Installation started...");
      }
    } catch (error) {
      console.error("Error installing PWA:", error);
      toast.error("Installation failed");
    }
  };

  const handleNotificationTest = async () => {
    if (notifications.permission !== "granted") {
      const granted = await notifications.requestPermission();
      if (!granted) {
        toast.error("Notification permission denied");
        return;
      }
    }

    notifications.sendNotification("Test Notification", {
      body: "This is a test notification from your mobile app!",
      icon: "/icon-192x192.png",
      badge: "/icon-72x72.png",
    });
    toast.success("Test notification sent!");
  };

  const getConnectionIcon = () => {
    if (!isOnline) return <WifiOff className="w-4 h-4 text-red-500" />;
    
    switch (connectionType) {
      case "4g":
        return <Signal className="w-4 h-4 text-green-500" />;
      case "3g":
        return <Signal className="w-4 h-4 text-yellow-500" />;
      case "2g":
        return <Signal className="w-4 h-4 text-orange-500" />;
      default:
        return <Wifi className="w-4 h-4 text-blue-500" />;
    }
  };

  const getPerformanceColor = (value: number, type: "load" | "memory" | "battery" | "speed") => {
    switch (type) {
      case "load":
        return value < 2 ? "text-green-600" : value < 3 ? "text-yellow-600" : "text-red-600";
      case "memory":
        return value < 50 ? "text-green-600" : value < 80 ? "text-yellow-600" : "text-red-600";
      case "battery":
        return value > 50 ? "text-green-600" : value > 20 ? "text-yellow-600" : "text-red-600";
      case "speed":
        return value > 30 ? "text-green-600" : value > 15 ? "text-yellow-600" : "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  // Show loading state while authentication is loading
  if (!isLoaded) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading mobile dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mobile Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage your mobile app experience
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getConnectionIcon()}
          <span className="text-sm text-muted-foreground">
            {isOnline ? connectionType.toUpperCase() : "Offline"}
          </span>
        </div>
      </div>

      {/* User Info */}
      {user && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Welcome back, {user.firstName}!</h3>
                <p className="text-sm text-muted-foreground">
                  Last active: {new Date().toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Load Time</p>
                <p className={`text-xl font-bold ${getPerformanceColor(performance.loadTime, "load")}`}>
                  {performance.loadTime.toFixed(1)}s
                </p>
              </div>
              <Gauge className="w-6 h-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Memory</p>
                <p className={`text-xl font-bold ${getPerformanceColor(performance.memoryUsage, "memory")}`}>
                  {performance.memoryUsage.toFixed(0)}%
                </p>
              </div>
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Battery</p>
                <p className={`text-xl font-bold ${getPerformanceColor(performance.batteryLevel, "battery")}`}>
                  {performance.batteryLevel.toFixed(0)}%
                </p>
              </div>
              <Battery className="w-6 h-6 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Speed</p>
                <p className={`text-xl font-bold ${getPerformanceColor(performance.networkSpeed, "speed")}`}>
                  {performance.networkSpeed.toFixed(0)} Mbps
                </p>
              </div>
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="pwa">
            <Download className="w-4 h-4 mr-2" />
            PWA
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Real-time performance monitoring for your mobile experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label>Load Time</Label>
                    <span className="text-sm text-muted-foreground">
                      {performance.loadTime.toFixed(1)}s
                    </span>
                  </div>
                  <Progress value={(4 - performance.loadTime) * 25} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label>Memory Usage</Label>
                    <span className="text-sm text-muted-foreground">
                      {performance.memoryUsage.toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={performance.memoryUsage} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label>Battery Level</Label>
                    <span className="text-sm text-muted-foreground">
                      {performance.batteryLevel.toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={performance.batteryLevel} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label>Network Speed</Label>
                    <span className="text-sm text-muted-foreground">
                      {performance.networkSpeed.toFixed(0)} Mbps
                    </span>
                  </div>
                  <Progress value={(performance.networkSpeed / 60) * 100} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Network Information */}
          <Card>
            <CardHeader>
              <CardTitle>Network Information</CardTitle>
              <CardDescription>
                Current network status and connection details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  {getConnectionIcon()}
                  <div>
                    <p className="font-medium">Connection Status</p>
                    <p className="text-sm text-muted-foreground">
                      {isOnline ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="font-medium">Connection Type</p>
                    <p className="text-sm text-muted-foreground">
                      {connectionType.toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Push Notifications</CardTitle>
              <CardDescription>
                Manage your notification preferences and test functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notification Support</p>
                  <p className="text-sm text-muted-foreground">
                    {notifications.isSupported ? "Supported" : "Not supported"}
                  </p>
                </div>
                <Badge variant={notifications.isSupported ? "default" : "destructive"}>
                  {notifications.isSupported ? "Available" : "Unavailable"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Permission Status</p>
                  <p className="text-sm text-muted-foreground">
                    Current permission: {notifications.permission}
                  </p>
                </div>
                <Badge
                  variant={
                    notifications.permission === "granted"
                      ? "default"
                      : notifications.permission === "denied"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {notifications.permission}
                </Badge>
              </div>

              <div className="flex gap-2">
                {notifications.permission !== "granted" && (
                  <Button
                    onClick={notifications.requestPermission}
                    disabled={!notifications.isSupported}
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Request Permission
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={handleNotificationTest}
                  disabled={notifications.permission !== "granted"}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Test Notification
                </Button>
              </div>

              {notifications.permission === "granted" && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <p className="text-sm font-medium text-green-800">
                      Notifications are enabled and working!
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pwa" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Progressive Web App</CardTitle>
              <CardDescription>
                Install this app on your device for a native-like experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Installation Status</p>
                  <p className="text-sm text-muted-foreground">
                    {isInstalled ? "App is installed" : "App is not installed"}
                  </p>
                </div>
                <Badge variant={isInstalled ? "default" : "secondary"}>
                  {isInstalled ? "Installed" : "Not Installed"}
                </Badge>
              </div>

              {!isInstalled && pwaInstallPrompt && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-blue-800 mb-2">
                        Install this app for better experience
                      </p>
                      <p className="text-sm text-blue-700 mb-3">
                        Get faster loading, offline access, and native-like features.
                      </p>
                      <Button onClick={handleInstallPWA} size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Install App
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {isInstalled && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <p className="text-sm font-medium text-green-800">
                      App is successfully installed on your device!
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="font-medium">PWA Features:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Offline functionality</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Push notifications</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Home screen icon</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Native-like experience</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mobile Settings</CardTitle>
              <CardDescription>
                Customize your mobile app experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {settings.darkMode ? (
                      <Moon className="w-4 h-4" />
                    ) : (
                      <Sun className="w-4 h-4" />
                    )}
                    <div>
                      <Label>Dark Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Switch between light and dark themes
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.darkMode}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, darkMode: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4" />
                    <div>
                      <Label>Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable push notifications
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.notifications}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, notifications: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Vibrate className="w-4 h-4" />
                    <div>
                      <Label>Vibration</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable haptic feedback
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.vibration}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, vibration: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-4 h-4" />
                    <div>
                      <Label>Sound</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable notification sounds
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.sound}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, sound: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Activity className="w-4 h-4" />
                    <div>
                      <Label>Auto Sync</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically sync data when online
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.autoSync}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, autoSync: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4" />
                    <div>
                      <Label>Data Compression</Label>
                      <p className="text-sm text-muted-foreground">
                        Reduce data usage with compression
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.dataCompression}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, dataCompression: checked })
                    }
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button
                  onClick={() => toast.success("Settings saved successfully!")}
                  className="w-full"
                >
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Export wrapped with error boundary
export default function MobilePageWithErrorBoundary() {
  return (
    <MobilePageErrorBoundary>
      <MobilePage />
    </MobilePageErrorBoundary>
  );
}