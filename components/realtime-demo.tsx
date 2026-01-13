"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Zap,
  Bell,
  Radio,
  MessageSquare,
  Activity,
  Wifi,
  Send,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  useNotifications,
  useRealtimeNotifications,
  useNotificationPreferences,
} from "@/hooks/use-notifications";
import NotificationCenter from "@/components/notification-center";

function RealtimeDemoContent() {
  const [activeTab, setActiveTab] = useState("notifications");
  const [testNotification, setTestNotification] = useState({
    title: "Test Notification",
    message: "This is a test notification message.",
    type: "info" as const,
    priority: "medium" as const,
  });
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side before using hooks
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Always call hooks - handle conditional logic inside the hooks themselves
  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
  } = useNotifications();

  const { connected } = useRealtimeNotifications();
  const {
    preferences,
    updatePreferences,
    loading: preferencesLoading,
  } = useNotificationPreferences();

  // Show loading state until client is ready
  if (!isClient) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Loading realtime demo...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Demo features showcase
  const features = [
    {
      icon: Bell,
      title: "Push Notifications",
      description: "Real-time in-app notifications with toast alerts",
      color: "text-blue-600",
    },
    {
      icon: Radio,
      title: "Server-Sent Events",
      description: "Live data streaming for instant updates",
      color: "text-green-600",
    },
    {
      icon: MessageSquare,
      title: "Live Chat System",
      description: "WebSocket-powered real-time messaging",
      color: "text-purple-600",
    },
    {
      icon: Activity,
      title: "Activity Feeds",
      description: "Real-time activity streams and status updates",
      color: "text-orange-600",
    },
  ];

  // Create test notification
  const handleCreateNotification = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...testNotification,
          userId: 'demo-user', // You might want to get this from auth context
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create notification');
      }

      const result = await response.json();
      toast.success("Test notification created!");
    } catch (error) {
      toast.error("Failed to create notification");
    }
  };

  // Update notification preferences
  const handlePreferenceChange = async (updates: any) => {
    if (preferences) {
      await updatePreferences(updates);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  Real-time Features System
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Live notifications, SSE streaming, and real-time data
                  synchronization
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={connected ? "default" : "destructive"}
                className="flex items-center gap-1"
              >
                <Wifi className="h-3 w-3" />
                {connected ? "Connected" : "Disconnected"}
              </Badge>
              <NotificationCenter />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <Icon
                    className={`h-5 w-5 ${feature.color} flex-shrink-0 mt-0.5`}
                  />
                  <div>
                    <div className="font-medium text-sm">{feature.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {feature.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Live Status */}
      <Card>
        <CardHeader>
          <CardTitle>Real-time Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div
                className={`w-3 h-3 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`}
              ></div>
              <div>
                <div className="font-medium text-sm">SSE Connection</div>
                <div className="text-xs text-muted-foreground">
                  {connected ? "Active" : "Inactive"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Bell className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-medium text-sm">Notifications</div>
                <div className="text-xs text-muted-foreground">
                  {unreadCount} unread
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Activity className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium text-sm">Last Event</div>
                <div className="text-xs text-muted-foreground">
                  None
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demo Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Real-time Features Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="live-data">Live Data</TabsTrigger>
              <TabsTrigger value="chat">Live Chat</TabsTrigger>
            </TabsList>

            <TabsContent value="notifications" className="mt-6">
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">
                    Notification Testing
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Create test notifications to see real-time delivery in
                    action
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Create Test Notification
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          value={testNotification.title}
                          onChange={(e) =>
                            setTestNotification((prev) => ({
                              ...prev,
                              title: e.target.value,
                            }))
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                          id="message"
                          value={testNotification.message}
                          onChange={(e) =>
                            setTestNotification((prev) => ({
                              ...prev,
                              message: e.target.value,
                            }))
                          }
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Type</Label>
                          <Select
                            value={testNotification.type}
                            onValueChange={(value: string) =>
                              setTestNotification((prev) => ({
                                ...prev,
                                type: value as any,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="info">Info</SelectItem>
                              <SelectItem value="success">Success</SelectItem>
                              <SelectItem value="warning">Warning</SelectItem>
                              <SelectItem value="error">Error</SelectItem>
                              <SelectItem value="system">System</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Priority</Label>
                          <Select
                            value={testNotification.priority}
                            onValueChange={(value: string) =>
                              setTestNotification((prev) => ({
                                ...prev,
                                priority: value as any,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Button
                        onClick={handleCreateNotification}
                        className="w-full"
                        disabled={
                          !testNotification.title || !testNotification.message
                        }
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Send Test Notification
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Recent Notifications
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {notificationsLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No notifications yet</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {notifications.slice(0, 5).map((notification) => (
                            <div
                              key={notification.id}
                              className="p-2 bg-gray-50 rounded text-sm"
                            >
                              <div className="font-medium">
                                {notification.title}
                              </div>
                              <div className="text-muted-foreground text-xs">
                                {notification.message}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preferences" className="mt-6">
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">
                    Notification Preferences
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Customize how and when you receive notifications
                  </p>
                </div>

                {preferencesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : preferences ? (
                  <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">
                          Delivery Channels
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="inApp">In-App Notifications</Label>
                          <Switch
                            id="inApp"
                            checked={preferences.channels.inApp}
                            onCheckedChange={(checked: boolean) =>
                              handlePreferenceChange({
                                channels: {
                                  ...preferences.channels,
                                  inApp: checked,
                                },
                              })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="email">Email Notifications</Label>
                          <Switch
                            id="email"
                            checked={preferences.channels.email}
                            onCheckedChange={(checked: boolean) =>
                              handlePreferenceChange({
                                channels: {
                                  ...preferences.channels,
                                  email: checked,
                                },
                              })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="push">Push Notifications</Label>
                          <Switch
                            id="push"
                            checked={preferences.channels.push}
                            onCheckedChange={(checked: boolean) =>
                              handlePreferenceChange({
                                channels: {
                                  ...preferences.channels,
                                  push: checked,
                                },
                              })
                            }
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Categories</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="security">Security Alerts</Label>
                          <Switch
                            id="security"
                            checked={preferences.categories.security}
                            onCheckedChange={(checked: boolean) =>
                              handlePreferenceChange({
                                categories: {
                                  ...preferences.categories,
                                  security: checked,
                                },
                              })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="updates">Product Updates</Label>
                          <Switch
                            id="updates"
                            checked={preferences.categories.updates}
                            onCheckedChange={(checked: boolean) =>
                              handlePreferenceChange({
                                categories: {
                                  ...preferences.categories,
                                  updates: checked,
                                },
                              })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="billing">Billing & Payments</Label>
                          <Switch
                            id="billing"
                            checked={preferences.categories.billing}
                            onCheckedChange={(checked: boolean) =>
                              handlePreferenceChange({
                                categories: {
                                  ...preferences.categories,
                                  billing: checked,
                                },
                              })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="marketing">Marketing</Label>
                          <Switch
                            id="marketing"
                            checked={preferences.categories.marketing}
                            onCheckedChange={(checked: boolean) =>
                              handlePreferenceChange({
                                categories: {
                                  ...preferences.categories,
                                  marketing: checked,
                                },
                              })
                            }
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>Unable to load preferences</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="live-data" className="mt-6">
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">
                    Live Data Streaming
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Real-time data updates using Server-Sent Events
                  </p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Connection Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">
                            SSE Connection
                          </span>
                          <Badge
                            variant={connected ? "default" : "destructive"}
                          >
                            {connected ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Server-Sent Events stream for real-time updates
                        </p>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">
                            Last Event
                          </span>
                          <Badge variant="outline">
                            None
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Waiting for events...
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="chat" className="mt-6">
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">
                    Live Chat System
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    WebSocket-powered real-time messaging (Coming Soon)
                  </p>
                </div>

                <Card>
                  <CardContent className="p-8 text-center">
                    <MessageSquare className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h4 className="text-lg font-medium mb-2">
                      Chat Feature Coming Soon
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      WebSocket-based real-time chat system with typing
                      indicators, presence status, and message delivery
                      confirmations.
                    </p>
                    <Badge variant="outline">In Development</Badge>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Implementation Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Implementation Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium">Features Included</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>
                  • Real-time notification system with multiple priorities
                </li>
                <li>• Server-Sent Events (SSE) for live data streaming</li>
                <li>• In-app notification center with unread badges</li>
                <li>• User preference management for notification channels</li>
                <li>• Toast notifications with custom actions</li>
                <li>• Connection status monitoring and auto-reconnect</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Files Created</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>
                  • <code>lib/notifications.ts</code> - Core notification system
                </li>
                <li>
                  • <code>hooks/use-notifications.ts</code> - React hooks
                </li>
                <li>
                  • <code>app/api/notifications/*</code> - API routes
                </li>
                <li>
                  • <code>components/notification-center.tsx</code> - UI
                  component
                </li>
                <li>
                  • <code>components/realtime-demo.tsx</code> - Demo interface
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Error boundary wrapper component
export default function RealtimeDemo() {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('RealtimeDemo error:', error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
              <h3 className="text-lg font-semibold">Something went wrong</h3>
              <p className="text-muted-foreground">
                There was an error loading the realtime demo. Please try refreshing the page.
              </p>
              <Button onClick={() => setHasError(false)}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  try {
    return <RealtimeDemoContent />;
  } catch (error) {
    console.error('RealtimeDemo render error:', error);
    setHasError(true);
    return null;
  }
}
