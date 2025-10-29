"use client";

import React from "react";
import Link from "next/link";
import { 
  ChevronRight, 
  Home, 
  Settings, 
  Layers, 
  Database, 
  Globe, 
  Shield, 
  Zap,
  Code,
  FileText,
  Folder,
  ArrowRight,
  CheckCircle,
  Info
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const architectureLayers = [
  {
    id: "presentation",
    title: "Presentation Layer",
    description: "React components, pages, and user interface",
    icon: Globe,
    technologies: ["Next.js 14", "React 18", "Tailwind CSS", "shadcn/ui"],
    responsibilities: [
      "User interface rendering",
      "Client-side routing",
      "State management",
      "User interactions"
    ]
  },
  {
    id: "api",
    title: "API Layer",
    description: "Server-side logic and API endpoints",
    icon: Zap,
    technologies: ["Next.js API Routes", "TypeScript", "Middleware"],
    responsibilities: [
      "Request handling",
      "Business logic",
      "Data validation",
      "Authentication"
    ]
  },
  {
    id: "data",
    title: "Data Layer",
    description: "Database operations and data persistence",
    icon: Database,
    technologies: ["Supabase", "PostgreSQL", "Prisma ORM"],
    responsibilities: [
      "Data storage",
      "Query optimization",
      "Data relationships",
      "Migrations"
    ]
  },
  {
    id: "security",
    title: "Security Layer",
    description: "Authentication, authorization, and security",
    icon: Shield,
    technologies: ["NextAuth.js", "JWT", "RLS", "CORS"],
    responsibilities: [
      "User authentication",
      "Access control",
      "Data protection",
      "Security headers"
    ]
  }
];

const projectStructure = [
  {
    path: "app/",
    description: "Next.js 14 App Router directory",
    type: "folder",
    children: [
      { path: "api/", description: "API routes and endpoints", type: "folder" },
      { path: "docs/", description: "Documentation pages", type: "folder" },
      { path: "showcase/", description: "Component showcase pages", type: "folder" },
      { path: "globals.css", description: "Global styles and Tailwind imports", type: "file" },
      { path: "layout.tsx", description: "Root layout component", type: "file" },
      { path: "page.tsx", description: "Home page component", type: "file" }
    ]
  },
  {
    path: "components/",
    description: "Reusable React components",
    type: "folder",
    children: [
      { path: "ui/", description: "shadcn/ui components", type: "folder" },
      { path: "showcase/", description: "Showcase-specific components", type: "folder" }
    ]
  },
  {
    path: "lib/",
    description: "Utility functions and configurations",
    type: "folder",
    children: [
      { path: "utils.ts", description: "Common utility functions", type: "file" },
      { path: "supabase.ts", description: "Supabase client configuration", type: "file" }
    ]
  },
  {
    path: "public/",
    description: "Static assets and files",
    type: "folder"
  }
];

const designPatterns = [
  {
    title: "Component Composition",
    description: "Building complex UIs from simple, reusable components",
    example: "Card + CardHeader + CardContent pattern"
  },
  {
    title: "Server Components",
    description: "Leveraging Next.js 14 server components for performance",
    example: "Static data fetching in server components"
  },
  {
    title: "API Route Handlers",
    description: "RESTful API design with proper HTTP methods",
    example: "GET /api/users, POST /api/users"
  },
  {
    title: "Middleware Pattern",
    description: "Request/response processing pipeline",
    example: "Authentication, logging, CORS handling"
  }
];

export default function ArchitecturePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400 mb-8">
          <Link href="/" className="hover:text-slate-900 dark:hover:text-slate-200 flex items-center">
            <Home className="w-4 h-4 mr-1" />
            Home
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/docs" className="hover:text-slate-900 dark:hover:text-slate-200">
            Documentation
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-900 dark:text-slate-200 font-medium">Architecture</span>
        </nav>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-6">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Architecture Overview
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
            Understand the architectural decisions, patterns, and structure that make this 
            Next.js fullstack starter scalable, maintainable, and performant.
          </p>
        </div>

        {/* Architecture Layers */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
            System Architecture
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {architectureLayers.map((layer) => {
              const IconComponent = layer.icon;
              
              return (
                <Card key={layer.id} className="border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg text-white">
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{layer.title}</CardTitle>
                        <CardDescription>{layer.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Technologies</h4>
                        <div className="flex flex-wrap gap-2">
                          {layer.technologies.map((tech) => (
                            <Badge key={tech} variant="secondary" className="text-xs">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Responsibilities</h4>
                        <ul className="space-y-1">
                          {layer.responsibilities.map((responsibility, index) => (
                            <li key={index} className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                              <span>{responsibility}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Project Structure */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
            Project Structure
          </h2>
          <Card className="border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Folder className="w-5 h-5" />
                <span>Directory Structure</span>
              </CardTitle>
              <CardDescription>
                Overview of the main directories and their purposes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projectStructure.map((item) => (
                  <div key={item.path} className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <Folder className="w-5 h-5 text-blue-500" />
                      <div>
                        <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white">
                          {item.path}
                        </span>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    
                    {item.children && (
                      <div className="ml-8 space-y-2">
                        {item.children.map((child) => (
                          <div key={child.path} className="flex items-center space-x-3">
                            {child.type === "folder" ? (
                              <Folder className="w-4 h-4 text-slate-400" />
                            ) : (
                              <FileText className="w-4 h-4 text-slate-400" />
                            )}
                            <div>
                              <span className="font-mono text-xs text-slate-700 dark:text-slate-300">
                                {child.path}
                              </span>
                              <p className="text-xs text-slate-500 dark:text-slate-500">
                                {child.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Design Patterns */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
            Design Patterns
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {designPatterns.map((pattern, index) => (
              <Card key={index} className="border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">{pattern.title}</CardTitle>
                  <CardDescription>{pattern.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
                    <code className="text-sm text-slate-700 dark:text-slate-300">
                      {pattern.example}
                    </code>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Key Principles */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
            Key Principles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Layers className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle>Separation of Concerns</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Clear separation between presentation, business logic, and data layers 
                  for better maintainability and testing.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Code className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle>Type Safety</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Full TypeScript implementation across all layers to catch errors 
                  early and improve developer experience.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle>Performance First</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Optimized for performance with server components, static generation, 
                  and efficient data fetching patterns.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Next Steps */}
        <Card className="border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10">
          <CardHeader>
            <CardTitle>Ready to Dive Deeper?</CardTitle>
            <CardDescription>
              Explore specific aspects of the architecture in more detail
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild>
                <Link href="/docs/api">
                  <Code className="w-4 h-4 mr-2" />
                  API Documentation
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/showcase/components/ui-elements">
                  <Layers className="w-4 h-4 mr-2" />
                  Component Library
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/docs/deployment">
                  <Settings className="w-4 h-4 mr-2" />
                  Deployment Guide
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}