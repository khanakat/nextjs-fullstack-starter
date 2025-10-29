"use client";

import React from "react";
import Link from "next/link";
import { 
  Zap, 
  Users, 
  Workflow, 
  Link as LinkIcon, 
  Smartphone, 
  WifiOff,
  Code, 
  Eye, 
  ExternalLink,
  ArrowLeft,
  Layers,
  Activity
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface FeatureItem {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  status: "stable" | "beta" | "experimental";
  tags: string[];
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  features: string[];
  techStack: string[];
  lastUpdated: string;
  demoCount: number;
  category: "real-time" | "collaboration" | "automation" | "integration" | "mobile" | "performance";
}

const featureItems: FeatureItem[] = [
  {
    id: "realtime",
    title: "Real-time Features",
    description: "Live notifications, SSE streaming, and real-time data synchronization capabilities",
    longDescription: "Comprehensive real-time functionality including Server-Sent Events (SSE), WebSocket connections, live notifications, and real-time data synchronization. Perfect for building collaborative applications, live dashboards, and interactive user experiences.",
    status: "stable",
    tags: ["websockets", "sse", "notifications", "live-data", "streaming"],
    href: "/showcase/features/realtime",
    icon: Zap,
    features: [
      "Server-Sent Events (SSE) streaming",
      "WebSocket real-time connections",
      "Live notification system",
      "Real-time data synchronization",
      "Connection state management",
      "Automatic reconnection handling"
    ],
    techStack: ["Server-Sent Events", "WebSockets", "React Query", "Zustand", "Node.js"],
    lastUpdated: "2024-01-12",
    demoCount: 4,
    category: "real-time"
  },
  {
    id: "collaboration",
    title: "Collaboration Tools",
    description: "Team presence, activity feeds, and collaborative editing features",
    longDescription: "Build collaborative applications with real-time presence indicators, activity feeds, team management, and collaborative editing capabilities. Includes user presence tracking, activity logging, and team communication features.",
    status: "beta",
    tags: ["presence", "activity", "team", "collaboration", "editing"],
    href: "/showcase/features/collaboration",
    icon: Users,
    features: [
      "Real-time user presence",
      "Activity feed system",
      "Team management",
      "Collaborative editing",
      "Comment system",
      "Permission management"
    ],
    techStack: ["WebSockets", "Supabase Realtime", "React", "TypeScript", "Zustand"],
    lastUpdated: "2024-01-05",
    demoCount: 6,
    category: "collaboration"
  },
  {
    id: "workflows",
    title: "Workflow Engine",
    description: "Visual workflow builder with automation and process management capabilities",
    longDescription: "A powerful workflow engine that allows users to create, manage, and execute automated processes. Features a visual workflow builder, process automation, task scheduling, and comprehensive workflow monitoring and analytics.",
    status: "beta",
    tags: ["automation", "processes", "visual-builder", "scheduling"],
    href: "/showcase/features/workflows",
    icon: Workflow,
    features: [
      "Visual workflow builder",
      "Process automation",
      "Task scheduling",
      "Workflow monitoring",
      "Analytics & reporting",
      "Custom trigger system"
    ],
    techStack: ["React Flow", "Node.js", "PostgreSQL", "Bull Queue", "Cron Jobs"],
    lastUpdated: "2024-01-03",
    demoCount: 5,
    category: "automation"
  },
  {
    id: "integrations",
    title: "Third-party Integrations",
    description: "Connect with external services and APIs with built-in sync and monitoring",
    longDescription: "Seamlessly integrate with popular third-party services and APIs. Includes authentication flows, data synchronization, webhook handling, API monitoring, and error handling for robust external service connections.",
    status: "stable",
    tags: ["api", "sync", "monitoring", "webhooks", "oauth"],
    href: "/showcase/features/integrations",
    icon: LinkIcon,
    features: [
      "OAuth authentication flows",
      "API data synchronization",
      "Webhook handling",
      "Rate limiting & retry logic",
      "Integration monitoring",
      "Error handling & logging"
    ],
    techStack: ["OAuth 2.0", "REST APIs", "Webhooks", "Redis", "Bull Queue"],
    lastUpdated: "2024-01-07",
    demoCount: 8,
    category: "integration"
  },
  {
    id: "mobile",
    title: "Mobile Experience",
    description: "Progressive Web App features with offline support and mobile-optimized UI",
    longDescription: "Create mobile-first experiences with Progressive Web App capabilities, offline functionality, push notifications, and mobile-optimized interfaces. Includes service worker implementation and native app-like features.",
    status: "stable",
    tags: ["pwa", "mobile", "responsive", "touch", "offline"],
    href: "/showcase/features/mobile",
    icon: Smartphone,
    features: [
      "Progressive Web App (PWA)",
      "Offline functionality",
      "Push notifications",
      "Touch-optimized UI",
      "App-like navigation",
      "Install prompts"
    ],
    techStack: ["Service Workers", "Web App Manifest", "Push API", "IndexedDB", "Workbox"],
    lastUpdated: "2024-01-09",
    demoCount: 7,
    category: "mobile"
  },
  {
    id: "offline",
    title: "Offline Capabilities",
    description: "Service worker implementation with offline data sync and caching strategies",
    longDescription: "Advanced offline capabilities with intelligent caching strategies, background sync, and offline-first data management. Ensures your application works seamlessly even without internet connectivity.",
    status: "experimental",
    tags: ["service-worker", "offline", "sync", "cache", "background"],
    href: "/showcase/features/offline",
    icon: WifiOff,
    features: [
      "Service worker implementation",
      "Offline data caching",
      "Background synchronization",
      "Cache management strategies",
      "Offline UI indicators",
      "Data conflict resolution"
    ],
    techStack: ["Service Workers", "IndexedDB", "Background Sync", "Cache API", "Workbox"],
    lastUpdated: "2024-01-01",
    demoCount: 3,
    category: "performance"
  }
];

const statusColors = {
  stable: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
  beta: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
  experimental: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800"
};

const categoryColors = {
  "real-time": "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  "collaboration": "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  "automation": "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
  "integration": "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
  "mobile": "bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400",
  "performance": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400"
};

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/showcase">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Showcase
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-blue-600 text-white">
              <Layers className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
                Features
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-300 mt-2">
                Advanced functionality and integrations for modern applications
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {featureItems.length}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Feature Categories
              </div>
            </div>
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {featureItems.reduce((sum, item) => sum + item.demoCount, 0)}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Live Demos
              </div>
            </div>
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {featureItems.filter(item => item.status === 'stable').length}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Production Ready
              </div>
            </div>
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                <Activity className="w-6 h-6 mx-auto mb-1" />
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Real-time Ready
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {featureItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Card key={item.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-blue-200 dark:hover:border-blue-800">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-blue-600 text-white group-hover:scale-110 transition-transform">
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div>
                        <CardTitle className="text-xl group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {item.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={statusColors[item.status]} variant="outline">
                            {item.status}
                          </Badge>
                          <Badge className={categoryColors[item.category]} variant="outline">
                            {item.category}
                          </Badge>
                          <span className="text-sm text-slate-500 dark:text-slate-400">
                            {item.demoCount} demos
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <CardDescription className="text-base leading-relaxed">
                    {item.longDescription}
                  </CardDescription>

                  {/* Features */}
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Key Features</h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {item.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Tech Stack */}
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Tech Stack</h4>
                    <div className="flex flex-wrap gap-2">
                      {item.techStack.map((tech) => (
                        <Badge key={tech} variant="secondary" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-4 border-t">
                    <Link href={item.href} className="flex-1">
                      <Button className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
                        <Eye className="w-4 h-4 mr-2" />
                        View Demos
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm">
                      <Code className="w-4 h-4 mr-2" />
                      Code
                    </Button>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Last Updated */}
                  <div className="text-xs text-slate-500 dark:text-slate-400 pt-2 border-t">
                    Last updated: {item.lastUpdated}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Coming Soon Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 text-center">
            Coming Soon
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "AI Integration", description: "Built-in AI capabilities with OpenAI and other providers" },
              { title: "Analytics Dashboard", description: "Comprehensive analytics and reporting features" },
              { title: "Multi-tenant Support", description: "Enterprise-grade multi-tenancy architecture" }
            ].map((item, index) => (
              <Card key={index} className="opacity-60">
                <CardHeader>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <Badge variant="outline" className="w-fit">Coming Soon</Badge>
                </CardHeader>
                <CardContent>
                  <CardDescription>{item.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}