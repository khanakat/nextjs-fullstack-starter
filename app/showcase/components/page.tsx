"use client";

import React from "react";
import Link from "next/link";
import { 
  Grid3X3, 
  Palette, 
  Sparkles, 
  Code, 
  Eye, 
  ExternalLink,
  ArrowLeft,
  Package
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ComponentItem {
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
}

const componentItems: ComponentItem[] = [
  {
    id: "drag-drop",
    title: "Drag & Drop System",
    description: "Complete drag-and-drop implementation with sortable lists, Kanban boards, file uploads, and form builders",
    longDescription: "A comprehensive drag-and-drop system built with @dnd-kit that provides smooth, accessible interactions across multiple use cases. Features include sortable lists with animations, Kanban board functionality, file upload zones, and dynamic form builders.",
    status: "stable",
    tags: ["dnd-kit", "sortable", "kanban", "file-upload", "forms", "accessibility"],
    href: "/showcase/components/drag-drop",
    icon: Grid3X3,
    features: [
      "Sortable Lists with smooth animations",
      "Kanban Board with column management",
      "File Upload with drag zones",
      "Form Builder with draggable fields",
      "Full accessibility support",
      "Touch device compatibility"
    ],
    techStack: ["@dnd-kit/core", "@dnd-kit/sortable", "@dnd-kit/utilities", "React", "TypeScript"],
    lastUpdated: "2024-01-15",
    demoCount: 5
  },
  {
    id: "ui-elements",
    title: "UI Components",
    description: "Comprehensive collection of reusable UI components built with shadcn/ui and Tailwind CSS",
    longDescription: "A complete library of production-ready UI components following modern design principles. Built on top of Radix UI primitives with shadcn/ui styling and full TypeScript support for type safety and developer experience.",
    status: "stable",
    tags: ["shadcn", "tailwind", "radix-ui", "components", "ui", "design-system"],
    href: "/showcase/components/ui-elements",
    icon: Palette,
    features: [
      "50+ Production-ready components",
      "Full TypeScript support",
      "Dark mode compatibility",
      "Customizable themes",
      "Accessibility built-in",
      "Responsive by default"
    ],
    techStack: ["shadcn/ui", "Radix UI", "Tailwind CSS", "React", "TypeScript"],
    lastUpdated: "2024-01-10",
    demoCount: 12
  },
  {
    id: "design-system",
    title: "Design System",
    description: "Complete design system with tokens, patterns, and guidelines for consistent UI development",
    longDescription: "A comprehensive design system that provides the foundation for consistent, scalable UI development. Includes design tokens, component patterns, usage guidelines, and tools for maintaining design consistency across your application.",
    status: "stable",
    tags: ["design-tokens", "patterns", "guidelines", "consistency", "branding"],
    href: "/showcase/components/design-system",
    icon: Sparkles,
    features: [
      "Design token system",
      "Component patterns library",
      "Usage guidelines & documentation",
      "Color palette management",
      "Typography scale",
      "Spacing & layout systems"
    ],
    techStack: ["CSS Custom Properties", "Tailwind CSS", "Figma Tokens", "Storybook"],
    lastUpdated: "2024-01-08",
    demoCount: 8
  }
];

const statusColors = {
  stable: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
  beta: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
  experimental: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800"
};

export default function ComponentsPage() {
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
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              <Package className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
                Components
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-300 mt-2">
                Reusable UI components and interactive elements
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {componentItems.length}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Component Categories
              </div>
            </div>
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {componentItems.reduce((sum, item) => sum + item.demoCount, 0)}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Live Demos
              </div>
            </div>
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                100%
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                TypeScript Coverage
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Components Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {componentItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Card key={item.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-blue-200 dark:hover:border-blue-800">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white group-hover:scale-110 transition-transform">
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
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
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
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
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
              { title: "Data Tables", description: "Advanced data tables with sorting, filtering, and pagination" },
              { title: "Charts & Graphs", description: "Interactive charts and data visualization components" },
              { title: "Animation Library", description: "Pre-built animations and micro-interactions" }
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