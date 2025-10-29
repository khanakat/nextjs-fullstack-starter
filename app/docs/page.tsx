"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Search, 
  Grid3X3, 
  Palette, 
  Sparkles,
  Zap, 
  Users, 
  Workflow, 
  Link as LinkIcon, 
  Smartphone, 
  WifiOff,
  BookOpen,
  Code,
  Rocket,
  Settings,
  FileText,
  ArrowRight,
  ExternalLink,
  Command,
  Filter,
  Star,
  Clock,
  ChevronRight,
  Home,
  Github,
  Play
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface DocSection {
  id: string;
  title: string;
  description: string;
  category: "components" | "features" | "api" | "guides";
  status: "stable" | "beta" | "experimental";
  tags: string[];
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  featured?: boolean;
  lastUpdated?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
}

const docSections: DocSection[] = [
  // Components
  {
    id: "drag-drop",
    title: "Drag & Drop System",
    description: "Complete drag-and-drop implementation with sortable lists, Kanban boards, file uploads, and form builders",
    category: "components",
    status: "stable",
    tags: ["dnd-kit", "sortable", "kanban", "file-upload", "forms"],
    href: "/showcase/components/drag-drop",
    icon: Grid3X3,
    featured: true,
    lastUpdated: "2024-01-15",
    difficulty: "intermediate"
  },
  {
    id: "ui-elements",
    title: "UI Components",
    description: "Comprehensive collection of reusable UI components built with shadcn/ui and Tailwind CSS",
    category: "components",
    status: "stable",
    tags: ["shadcn", "tailwind", "components", "ui"],
    href: "/showcase/components/ui-elements",
    icon: Palette,
    featured: true,
    lastUpdated: "2024-01-10",
    difficulty: "beginner"
  },
  {
    id: "design-system",
    title: "Design System",
    description: "Complete design system with tokens, patterns, and guidelines for consistent UI development",
    category: "components",
    status: "stable",
    tags: ["design-tokens", "patterns", "guidelines"],
    href: "/showcase/components/design-system",
    icon: Sparkles,
    lastUpdated: "2024-01-08",
    difficulty: "intermediate"
  },
  
  // Features
  {
    id: "realtime",
    title: "Real-time Features",
    description: "Live notifications, SSE streaming, and real-time data synchronization capabilities",
    category: "features",
    status: "stable",
    tags: ["websockets", "sse", "notifications", "live-data"],
    href: "/showcase/features/realtime",
    icon: Zap,
    featured: true,
    lastUpdated: "2024-01-12",
    difficulty: "advanced"
  },
  {
    id: "collaboration",
    title: "Collaboration Tools",
    description: "Team presence, activity feeds, and collaborative editing features",
    category: "features",
    status: "beta",
    tags: ["presence", "activity", "team", "collaboration"],
    href: "/showcase/features/collaboration",
    icon: Users,
    lastUpdated: "2024-01-05",
    difficulty: "advanced"
  },
  {
    id: "workflows",
    title: "Workflow Engine",
    description: "Visual workflow builder with automation and process management capabilities",
    category: "features",
    status: "beta",
    tags: ["automation", "processes", "visual-builder"],
    href: "/showcase/features/workflows",
    icon: Workflow,
    lastUpdated: "2024-01-03",
    difficulty: "advanced"
  },
  {
    id: "integrations",
    title: "Third-party Integrations",
    description: "Connect with external services and APIs with built-in sync and monitoring",
    category: "features",
    status: "stable",
    tags: ["api", "sync", "monitoring", "webhooks"],
    href: "/showcase/features/integrations",
    icon: LinkIcon,
    lastUpdated: "2024-01-07",
    difficulty: "intermediate"
  },
  {
    id: "mobile",
    title: "Mobile Experience",
    description: "Progressive Web App features with offline support and mobile-optimized UI",
    category: "features",
    status: "stable",
    tags: ["pwa", "mobile", "responsive", "touch"],
    href: "/showcase/features/mobile",
    icon: Smartphone,
    lastUpdated: "2024-01-09",
    difficulty: "intermediate"
  },
  {
    id: "offline",
    title: "Offline Capabilities",
    description: "Service worker implementation with offline data sync and caching strategies",
    category: "features",
    status: "experimental",
    tags: ["service-worker", "offline", "sync", "cache"],
    href: "/showcase/features/offline",
    icon: WifiOff,
    lastUpdated: "2024-01-01",
    difficulty: "advanced"
  },

  // API Documentation
  {
    id: "api-reference",
    title: "API Reference",
    description: "Complete REST API documentation with endpoints, authentication, and examples",
    category: "api",
    status: "stable",
    tags: ["rest", "endpoints", "auth", "examples"],
    href: "/docs/api",
    icon: Code,
    featured: true,
    lastUpdated: "2024-01-14",
    difficulty: "intermediate"
  },

  // Guides
  {
    id: "getting-started",
    title: "Getting Started",
    description: "Quick start guide to set up your development environment and create your first project",
    category: "guides",
    status: "stable",
    tags: ["setup", "installation", "quickstart"],
    href: "/docs/getting-started",
    icon: Rocket,
    featured: true,
    lastUpdated: "2024-01-16",
    difficulty: "beginner"
  },
  {
    id: "architecture",
    title: "Architecture Overview",
    description: "Deep dive into the application architecture, patterns, and best practices",
    category: "guides",
    status: "stable",
    tags: ["architecture", "patterns", "best-practices"],
    href: "/docs/architecture",
    icon: Settings,
    lastUpdated: "2024-01-11",
    difficulty: "advanced"
  },
  {
    id: "deployment",
    title: "Deployment Guide",
    description: "Step-by-step deployment instructions for various platforms and environments",
    category: "guides",
    status: "stable",
    tags: ["deployment", "production", "hosting"],
    href: "/docs/deployment",
    icon: FileText,
    lastUpdated: "2024-01-13",
    difficulty: "intermediate"
  }
];

const statusColors = {
  stable: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
  beta: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
  experimental: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800"
};

const difficultyColors = {
  beginner: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
  intermediate: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800",
  advanced: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
};

const categoryIcons = {
  components: Palette,
  features: Zap,
  api: Code,
  guides: BookOpen
};

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "components" | "features" | "api" | "guides">("all");

  const filteredSections = useMemo(() => {
    return docSections.filter(section => {
      const matchesSearch = section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          section.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          section.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === "all" || section.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const featuredSections = docSections.filter(section => section.featured);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white dark:bg-slate-900 border-b">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400 mb-8">
            <Link href="/" className="hover:text-slate-900 dark:hover:text-slate-200 flex items-center">
              <Home className="w-4 h-4 mr-1" />
              Home
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-900 dark:text-slate-200 font-medium">Documentation</span>
          </nav>

          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Documentation</span> Hub
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto">
              Explore comprehensive guides, component documentation, API references, and interactive examples. 
              Everything you need to build amazing applications.
            </p>
            
            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" asChild>
                <Link href="#getting-started">
                  <Rocket className="w-5 h-5 mr-2" />
                  Get Started
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/showcase">
                  <Play className="w-5 h-5 mr-2" />
                  View Showcase
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="https://github.com/khanakat" target="_blank" rel="noopener noreferrer">
                  <Github className="w-5 h-5 mr-2" />
                  GitHub
                  <ExternalLink className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>

            {/* Search */}
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                placeholder="Search documentation... (Press / to focus)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-3 text-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <kbd className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 rounded border">
                  <Command className="w-3 h-3 inline mr-1" />
                  K
                </kbd>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Featured Sections */}
        {!searchQuery && selectedCategory === "all" && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  Featured Documentation
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Popular guides and components to get you started quickly
                </p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredSections.map((section) => {
                const IconComponent = section.icon;
                const CategoryIcon = categoryIcons[section.category];
                
                return (
                  <Card key={section.id} className="group hover:shadow-lg transition-all duration-300 border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg text-white">
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div>
                            <Badge variant="outline" className={statusColors[section.status]}>
                              {section.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 text-slate-400">
                          <CategoryIcon className="w-4 h-4" />
                          <span className="text-xs capitalize">{section.category}</span>
                        </div>
                      </div>
                      <CardTitle className="text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {section.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                        {section.description}
                      </CardDescription>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {section.difficulty && (
                            <Badge variant="outline" className={`text-xs ${difficultyColors[section.difficulty]}`}>
                              {section.difficulty}
                            </Badge>
                          )}
                          {section.lastUpdated && (
                            <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                              <Clock className="w-3 h-3 mr-1" />
                              {section.lastUpdated}
                            </div>
                          )}
                        </div>
                        <Button size="sm" variant="ghost" asChild className="group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20">
                          <Link href={section.href}>
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* Category Tabs */}
        <section>
          <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as any)} className="w-full">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  Browse Documentation
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Find exactly what you need with our organized documentation
                </p>
              </div>
              <TabsList className="grid w-full max-w-md grid-cols-5">
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="components" className="text-xs">Components</TabsTrigger>
                <TabsTrigger value="features" className="text-xs">Features</TabsTrigger>
                <TabsTrigger value="api" className="text-xs">API</TabsTrigger>
                <TabsTrigger value="guides" className="text-xs">Guides</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={selectedCategory} className="mt-0">
              {filteredSections.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    No documentation found
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    Try adjusting your search terms or browse different categories
                  </p>
                  <Button variant="outline" onClick={() => {setSearchQuery(""); setSelectedCategory("all");}}>
                    <Filter className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredSections.map((section) => {
                    const IconComponent = section.icon;
                    const CategoryIcon = categoryIcons[section.category];
                    
                    return (
                      <Card key={section.id} className="group hover:shadow-lg transition-all duration-300 border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-gradient-to-br from-slate-500 to-slate-600 rounded-lg text-white">
                                <IconComponent className="w-5 h-5" />
                              </div>
                              <div>
                                <Badge variant="outline" className={statusColors[section.status]}>
                                  {section.status}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1 text-slate-400">
                              <CategoryIcon className="w-4 h-4" />
                              <span className="text-xs capitalize">{section.category}</span>
                            </div>
                          </div>
                          <CardTitle className="text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {section.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-3">
                            {section.description}
                          </CardDescription>
                          
                          <div className="flex flex-wrap gap-1 mb-4">
                            {section.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {section.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{section.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {section.difficulty && (
                                <Badge variant="outline" className={`text-xs ${difficultyColors[section.difficulty]}`}>
                                  {section.difficulty}
                                </Badge>
                              )}
                              {section.lastUpdated && (
                                <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {section.lastUpdated}
                                </div>
                              )}
                            </div>
                            <Button size="sm" variant="ghost" asChild className="group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20">
                              <Link href={section.href}>
                                <ArrowRight className="w-4 h-4" />
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </section>

        {/* Quick Links */}
        <section className="mt-16 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-2xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Quick Links
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Jump to the most commonly accessed sections
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" size="lg" asChild className="h-auto p-4 flex-col space-y-2">
              <Link href="/showcase">
                <Play className="w-6 h-6" />
                <span>Live Demos</span>
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="h-auto p-4 flex-col space-y-2">
              <Link href="/docs/api">
                <Code className="w-6 h-6" />
                <span>API Docs</span>
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="h-auto p-4 flex-col space-y-2">
              <Link href="/docs/getting-started">
                <Rocket className="w-6 h-6" />
                <span>Quick Start</span>
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="h-auto p-4 flex-col space-y-2">
              <Link href="https://github.com/khanakat" target="_blank" rel="noopener noreferrer">
                <Github className="w-6 h-6" />
                <span>GitHub</span>
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}