"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Smartphone,
  Download,
  WifiOff,
  Bell,
  Zap,
  Shield,
  Palette,
} from "lucide-react";
import { useServiceWorker } from "@/hooks/use-service-worker";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallPage() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installStep, setInstallStep] = useState(0);

  const { isSupported, isRegistered, register } = useServiceWorker();

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setIsInstallable(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    setInstallStep(1);

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        setInstallStep(2);
        setTimeout(() => {
          setIsInstalled(true);
          setInstallStep(0);
        }, 2000);
      } else {
        setInstallStep(0);
      }

      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error("Installation failed:", error);
      setInstallStep(0);
    }
  };

  const features = [
    {
      icon: WifiOff,
      title: "Offline Access",
      description: "Work seamlessly even without internet connection",
    },
    {
      icon: Bell,
      title: "Push Notifications",
      description: "Stay updated with real-time notifications",
    },
    {
      icon: Zap,
      title: "Fast Performance",
      description: "Lightning-fast loading with smart caching",
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your data is protected with enterprise-grade security",
    },
    {
      icon: Smartphone,
      title: "Mobile Optimized",
      description: "Perfect experience on all devices",
    },
    {
      icon: Palette,
      title: "Native Feel",
      description: "App-like experience with native interactions",
    },
  ];

  const installSteps = [
    "Tap the install button below",
    "Confirm installation in the browser prompt",
    "Find the app on your home screen",
    "Enjoy the full app experience!",
  ];

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Download className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">
              App Installed!
            </CardTitle>
            <CardDescription>
              The app has been successfully installed on your device
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              You can now find the app on your home screen and use it like any
              native app.
            </p>
            <Button
              onClick={() => (window.location.href = "/")}
              className="w-full"
            >
              Open App
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mx-auto w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mb-6">
            <Smartphone className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Install NextJS Fullstack Starter
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get the full app experience with offline access, push notifications,
            and native performance
          </p>
        </div>

        {/* Installation Status */}
        <div className="max-w-md mx-auto mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${isSupported ? "bg-green-500" : "bg-red-500"}`}
                />
                Installation Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">PWA Support</span>
                <Badge variant={isSupported ? "default" : "destructive"}>
                  {isSupported ? "Supported" : "Not Supported"}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Service Worker</span>
                <Badge variant={isRegistered ? "default" : "secondary"}>
                  {isRegistered ? "Active" : "Not Registered"}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Installable</span>
                <Badge variant={isInstallable ? "default" : "secondary"}>
                  {isInstallable ? "Ready" : "Not Ready"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Install Button */}
        <div className="max-w-md mx-auto mb-12">
          {isInstallable ? (
            <Button
              onClick={handleInstall}
              disabled={installStep > 0}
              className="w-full h-14 text-lg"
              size="lg"
            >
              {installStep === 0 && (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Install App
                </>
              )}
              {installStep === 1 && "Installing..."}
              {installStep === 2 && "Installation Complete!"}
            </Button>
          ) : (
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                {!isSupported
                  ? "Your browser doesn't support PWA installation"
                  : "Installation prompt will appear when available"}
              </p>
              {!isRegistered && (
                <Button onClick={register} variant="outline" className="mb-4">
                  Register Service Worker
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Installation Steps */}
        <div className="max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl font-bold text-center mb-8">
            How to Install
          </h2>
          <div className="grid gap-4">
            {installSteps.map((step, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm"
              >
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                  {index + 1}
                </div>
                <p className="text-gray-700">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Why Install?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Browser Instructions */}
        <div className="max-w-2xl mx-auto mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Browser-Specific Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Chrome/Edge (Desktop)</h4>
                <p className="text-sm text-gray-600">
                  Look for the install icon in the address bar or use the
                  three-dot menu &gt; Install app
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Safari (iOS)</h4>
                <p className="text-sm text-gray-600">
                  Tap the share button and select "Add to Home Screen"
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Chrome (Android)</h4>
                <p className="text-sm text-gray-600">
                  Tap the three-dot menu and select "Add to Home screen" or
                  "Install app"
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
