"use client";

import React, { useState, useMemo } from "react";

import Link from "next/link";
import { 
  Search, 
  Grid3X3, 
  List, 
  Star, 
  Clock, 
  Palette, 
  Zap, 
  Users, 
  Workflow, 
  Link as LinkIcon, 
  Smartphone, 
  WifiOff,
  ChevronRight,
  Github,
  BookOpen,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ShowcaseItem {
  id: string;
  title: string;
  description: string;
  category: "components" | "features";
  subcategory: string;
  status: "stable" | "beta" | "experimental";
  tags: string[];
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  featured?: boolean;
  lastUpdated?: string;
}

const showcaseItems: ShowcaseItem[] = [
  {
    id: "drag-drop",
    title: "Drag & Drop System",
    description: "Complete drag-and-drop implementation with sortable lists, Kanban boards, file uploads, and form builders",
    category: "components",
    subcategory: "drag-drop",
    status: "stable",
    tags: ["dnd-kit", "sortable", "kanban", "file-upload", "forms"],
    href: "/showcase/components/drag-drop",
    icon: Grid3X3,
    featured: true,
    lastUpdated: "2024-01-15"
  },
  {
    id: "ui-elements",
    title: "UI Components",
    description: "Comprehensive collection of reusable UI components built with shadcn/ui and Tailwind CSS",
    category: "components",
    subcategory: "ui-elements",
    status: "stable",
    tags: ["shadcn", "tailwind", "components", "ui"],
    href: "/showcase/components/ui-elements",
    icon: Palette,
    featured: true,
    lastUpdated: "2024-01-10"
  },
  {
    id: "design-system",
    title: "Design System",
    description: "Complete design system with tokens, patterns, and guidelines for consistent UI development",
    category: "components",
    subcategory: "design-system",
    status: "stable",
    tags: ["design-tokens", "patterns", "guidelines"],
    href: "/showcase/components/design-system",
    icon: Sparkles,
    lastUpdated: "2024-01-08"
  },
  {
    id: "realtime",
    title: "Real-time Features",
    description: "Live notifications, SSE streaming, and real-time data synchronization capabilities",
    category: "features",
    subcategory: "realtime",
    status: "stable",
    tags: ["websockets", "sse", "notifications", "live-data"],
    href: "/showcase/features/realtime",
    icon: Zap,
    featured: true,
    lastUpdated: "2024-01-12"
  },
  {
    id: "collaboration",
    title: "Collaboration Tools",
    description: "Team presence, activity feeds, and collaborative editing features",
    category: "features",
    subcategory: "collaboration",
    status: "beta",
    tags: ["presence", "activity", "team", "collaboration"],
    href: "/showcase/features/collaboration",
    icon: Users,
    lastUpdated: "2024-01-05"
  },
  {
    id: "workflows",
    title: "Workflow Engine",
    description: "Visual workflow builder with automation and process management capabilities",
    category: "features",
    subcategory: "workflows",
    status: "beta",
    tags: ["automation", "processes", "visual-builder"],
    href: "/showcase/features/workflows",
    icon: Workflow,
    lastUpdated: "2024-01-03"
  },
  {
    id: "integrations",
    title: "Third-party Integrations",
    description: "Connect with external services and APIs with built-in sync and monitoring",
    category: "features",
    subcategory: "integrations",
    status: "stable",
    tags: ["api", "sync", "monitoring", "webhooks"],
    href: "/showcase/features/integrations",
    icon: LinkIcon,
    lastUpdated: "2024-01-07"
  },
  {
    id: "mobile",
    title: "Mobile Experience",
    description: "Progressive Web App features with offline support and mobile-optimized UI",
    category: "features",
    subcategory: "mobile",
    status: "stable",
    tags: ["pwa", "mobile", "responsive", "touch"],
    href: "/showcase/features/mobile",
    icon: Smartphone,
    lastUpdated: "2024-01-09"
  },
  {
    id: "offline",
    title: "Offline Capabilities",
    description: "Service worker implementation with offline data sync and caching strategies",
    category: "features",
    subcategory: "offline",
    status: "experimental",
    tags: ["service-worker", "offline", "sync", "cache"],
    href: "/showcase/features/offline",
    icon: WifiOff,
    lastUpdated: "2024-01-01"
  }
];

const statusColors = {
  stable: "bg-green-100 text-green-800 border-green-200",
  beta: "bg-yellow-100 text-yellow-800 border-yellow-200",
  experimental: "bg-purple-100 text-purple-800 border-purple-200"
};

export default function ShowcasePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "components" | "features">("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "stable" | "beta" | "experimental">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredItems = useMemo(() => {
    return showcaseItems.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      const matchesStatus = selectedStatus === "all" || item.status === selectedStatus;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [searchQuery, selectedCategory, selectedStatus]);

  const featuredItems = showcaseItems.filter(item => item.featured);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white dark:bg-slate-900 border-b">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6">
              Component <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Showcase</span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto">
              Explore our comprehensive collection of components, features, and integrations. 
              Everything you need to build modern, scalable applications.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <BookOpen className="w-5 h-5 mr-2" />
                Browse Components
              </Button>
              <Button size="lg" variant="outline">
                <Github className="w-5 h-5 mr-2" />
                View Source
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Featured Section */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <Star className="w-6 h-6 text-yellow-500" />
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Featured</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <Link key={item.id} href={item.href}>
                  <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-blue-200 dark:hover:border-blue-800">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                            <IconComponent className="w-6 h-6" />
                          </div>
                          <div>
                            <CardTitle className="text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {item.title}
                            </CardTitle>
                            <Badge className={statusColors[item.status]} variant="outline">
                              {item.status}
                            </Badge>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="mb-4">
                        {item.description}
                      </CardDescription>
                      <div className="flex flex-wrap gap-2">
                        {item.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {item.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{item.tags.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Search and Filters */}
        <section className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  placeholder="Search components, features, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as any)}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="components">Components</TabsTrigger>
                  <TabsTrigger value="features">Features</TabsTrigger>
                </TabsList>
              </Tabs>

              <Tabs value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as any)}>
                <TabsList>
                  <TabsTrigger value="all">All Status</TabsTrigger>
                  <TabsTrigger value="stable">Stable</TabsTrigger>
                  <TabsTrigger value="beta">Beta</TabsTrigger>
                  <TabsTrigger value="experimental">Experimental</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center border rounded-lg">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Results */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              All Components & Features
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} found
            </p>
          </div>

          {filteredItems.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No results found</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Try adjusting your search terms or filters
              </p>
            </div>
          ) : (
            <div className={viewMode === "grid" 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
              : "space-y-4"
            }>
              {filteredItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link key={item.id} href={item.href}>
                    <Card className={`group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${
                      viewMode === "list" ? "flex items-center" : ""
                    }`}>
                      <CardHeader className={viewMode === "list" ? "flex-shrink-0" : ""}>
                        <div className={`flex items-start ${viewMode === "list" ? "gap-4" : "justify-between"}`}>
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900 transition-colors">
                              <IconComponent className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                            </div>
                            <div>
                              <CardTitle className="text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {item.title}
                              </CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={statusColors[item.status]} variant="outline">
                                  {item.status}
                                </Badge>
                                <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                                  {item.category}
                                </span>
                              </div>
                            </div>
                          </div>
                          {viewMode === "grid" && (
                            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className={viewMode === "list" ? "flex-1" : ""}>
                        <CardDescription className="mb-4">
                          {item.description}
                        </CardDescription>
                        <div className="flex flex-wrap gap-2">
                          {item.tags.slice(0, viewMode === "list" ? 5 : 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {item.tags.length > (viewMode === "list" ? 5 : 3) && (
                            <Badge variant="secondary" className="text-xs">
                              +{item.tags.length - (viewMode === "list" ? 5 : 3)} more
                            </Badge>
                          )}
                        </div>
                        {viewMode === "list" && item.lastUpdated && (
                          <div className="flex items-center gap-2 mt-3 text-xs text-slate-500 dark:text-slate-400">
                            <Clock className="w-3 h-3" />
                            Updated {item.lastUpdated}
                          </div>
                        )}
                      </CardContent>
                      {viewMode === "list" && (
                        <div className="p-6 flex-shrink-0">
                          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                        </div>
                      )}
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}