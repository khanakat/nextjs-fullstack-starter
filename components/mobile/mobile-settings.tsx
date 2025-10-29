"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

import { Label } from "@/components/ui/label";
import {
  User,
  Bell,
  Shield,
  Smartphone,
  Palette,
  Database,
  Moon,
  Sun,
  Trash2,
  RefreshCw,
  ChevronRight,
  Save,
  Battery,
  Download,
  Upload,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useNetworkAwareLoading } from "@/hooks/use-mobile-performance";
import { useOffline } from "@/hooks/use-offline";

interface MobileSettingsProps {
  className?: string;
}

interface SettingsState {
  notifications: {
    push: boolean;
    email: boolean;
    sms: boolean;
    sound: boolean;
  };
  privacy: {
    analytics: boolean;
    location: boolean;
    contacts: boolean;
  };
  performance: {
    lowDataMode: boolean;
    offlineSync: boolean;
    autoUpdate: boolean;
  };
  display: {
    theme: "light" | "dark" | "system";
    fontSize: "small" | "medium" | "large";
    animations: boolean;
  };
}

const defaultSettings: SettingsState = {
  notifications: {
    push: true,
    email: true,
    sms: false,
    sound: true,
  },
  privacy: {
    analytics: true,
    location: false,
    contacts: false,
  },
  performance: {
    lowDataMode: false,
    offlineSync: true,
    autoUpdate: true,
  },
  display: {
    theme: "system",
    fontSize: "medium",
    animations: true,
  },
};

export function MobileSettings({ className }: MobileSettingsProps) {
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const { setTheme } = useTheme();
  const { loadingStrategy } = useNetworkAwareLoading();
  const { isOnline } = useOffline();

  const updateSetting = (
    section: keyof SettingsState,
    key: string,
    value: any,
  ) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const saveSettings = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
    // Show success toast
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  if (loadingStrategy === "minimal") {
    return (
      <div className="space-y-6 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-6 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mobile Settings</h1>
          <p className="text-sm text-muted-foreground">
            Customize your mobile experience
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={saveSettings}
            disabled={saving || !isOnline}
          >
            <Save className={`h-4 w-4 ${saving ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Notifications Settings */}
      <Card>
        <CardHeader
          className="cursor-pointer"
          onClick={() =>
            setActiveSection(
              activeSection === "notifications" ? null : "notifications",
            )
          }
        >
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <span>Notifications</span>
            </div>
            <ChevronRight
              className={`h-4 w-4 transition-transform ${
                activeSection === "notifications" ? "rotate-90" : ""
              }`}
            />
          </CardTitle>
        </CardHeader>
        {activeSection === "notifications" && (
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive push notifications
                </p>
              </div>
              <Switch
                checked={settings.notifications.push}
                onCheckedChange={(checked) =>
                  updateSetting("notifications", "push", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive email updates
                </p>
              </div>
              <Switch
                checked={settings.notifications.email}
                onCheckedChange={(checked) =>
                  updateSetting("notifications", "email", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive SMS alerts
                </p>
              </div>
              <Switch
                checked={settings.notifications.sms}
                onCheckedChange={(checked) =>
                  updateSetting("notifications", "sms", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Sound</Label>
                <p className="text-sm text-muted-foreground">
                  Play notification sounds
                </p>
              </div>
              <Switch
                checked={settings.notifications.sound}
                onCheckedChange={(checked) =>
                  updateSetting("notifications", "sound", checked)
                }
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader
          className="cursor-pointer"
          onClick={() =>
            setActiveSection(activeSection === "privacy" ? null : "privacy")
          }
        >
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <span>Privacy</span>
            </div>
            <ChevronRight
              className={`h-4 w-4 transition-transform ${
                activeSection === "privacy" ? "rotate-90" : ""
              }`}
            />
          </CardTitle>
        </CardHeader>
        {activeSection === "privacy" && (
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Analytics</Label>
                <p className="text-sm text-muted-foreground">
                  Share usage analytics
                </p>
              </div>
              <Switch
                checked={settings.privacy.analytics}
                onCheckedChange={(checked) =>
                  updateSetting("privacy", "analytics", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Location Services</Label>
                <p className="text-sm text-muted-foreground">
                  Allow location access
                </p>
              </div>
              <Switch
                checked={settings.privacy.location}
                onCheckedChange={(checked) =>
                  updateSetting("privacy", "location", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Contact Access</Label>
                <p className="text-sm text-muted-foreground">
                  Access device contacts
                </p>
              </div>
              <Switch
                checked={settings.privacy.contacts}
                onCheckedChange={(checked) =>
                  updateSetting("privacy", "contacts", checked)
                }
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Performance Settings */}
      <Card>
        <CardHeader
          className="cursor-pointer"
          onClick={() =>
            setActiveSection(
              activeSection === "performance" ? null : "performance",
            )
          }
        >
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Battery className="h-5 w-5" />
              <span>Performance</span>
            </div>
            <ChevronRight
              className={`h-4 w-4 transition-transform ${
                activeSection === "performance" ? "rotate-90" : ""
              }`}
            />
          </CardTitle>
        </CardHeader>
        {activeSection === "performance" && (
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Low Data Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Reduce data usage
                </p>
              </div>
              <Switch
                checked={settings.performance.lowDataMode}
                onCheckedChange={(checked) =>
                  updateSetting("performance", "lowDataMode", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Offline Sync</Label>
                <p className="text-sm text-muted-foreground">
                  Sync data when offline
                </p>
              </div>
              <Switch
                checked={settings.performance.offlineSync}
                onCheckedChange={(checked) =>
                  updateSetting("performance", "offlineSync", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Update</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically update app
                </p>
              </div>
              <Switch
                checked={settings.performance.autoUpdate}
                onCheckedChange={(checked) =>
                  updateSetting("performance", "autoUpdate", checked)
                }
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Display Settings */}
      <Card>
        <CardHeader
          className="cursor-pointer"
          onClick={() =>
            setActiveSection(activeSection === "display" ? null : "display")
          }
        >
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              <span>Display</span>
            </div>
            <ChevronRight
              className={`h-4 w-4 transition-transform ${
                activeSection === "display" ? "rotate-90" : ""
              }`}
            />
          </CardTitle>
        </CardHeader>
        {activeSection === "display" && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Theme</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={
                    settings.display.theme === "light" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => {
                    updateSetting("display", "theme", "light");
                    setTheme("light");
                  }}
                >
                  <Sun className="h-4 w-4 mr-1" />
                  Light
                </Button>
                <Button
                  variant={
                    settings.display.theme === "dark" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => {
                    updateSetting("display", "theme", "dark");
                    setTheme("dark");
                  }}
                >
                  <Moon className="h-4 w-4 mr-1" />
                  Dark
                </Button>
                <Button
                  variant={
                    settings.display.theme === "system" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => {
                    updateSetting("display", "theme", "system");
                    setTheme("system");
                  }}
                >
                  <Smartphone className="h-4 w-4 mr-1" />
                  Auto
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Font Size</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={
                    settings.display.fontSize === "small"
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => updateSetting("display", "fontSize", "small")}
                >
                  Small
                </Button>
                <Button
                  variant={
                    settings.display.fontSize === "medium"
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => updateSetting("display", "fontSize", "medium")}
                >
                  Medium
                </Button>
                <Button
                  variant={
                    settings.display.fontSize === "large"
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => updateSetting("display", "fontSize", "large")}
                >
                  Large
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Animations</Label>
                <p className="text-sm text-muted-foreground">
                  Enable UI animations
                </p>
              </div>
              <Switch
                checked={settings.display.animations}
                onCheckedChange={(checked) =>
                  updateSetting("display", "animations", checked)
                }
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <span>Account</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>

          <Button variant="outline" className="w-full justify-start">
            <Upload className="h-4 w-4 mr-2" />
            Import Settings
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={resetSettings}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>

          <Button variant="destructive" className="w-full justify-start">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Account
          </Button>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <span>System Info</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>App Version</span>
            <span>1.0.0</span>
          </div>

          <div className="flex justify-between text-sm">
            <span>Build</span>
            <span>2024.01.15</span>
          </div>

          <div className="flex justify-between text-sm">
            <span>Storage Used</span>
            <span>12.5 MB</span>
          </div>

          <div className="flex justify-between text-sm">
            <span>Network Status</span>
            <Badge variant={!isOnline ? "destructive" : "default"}>
              {!isOnline ? "Offline" : "Online"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default MobileSettings;
