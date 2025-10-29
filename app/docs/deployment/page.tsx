"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  ChevronRight, 
  Home, 
  FileText, 
  Cloud, 
  Server, 
  Globe, 
  Settings,
  Copy,
  CheckCircle,
  AlertTriangle,
  Info,
  ArrowRight,
  Terminal,
  Zap,
  Shield,
  Database,
  ExternalLink
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface DeploymentPlatform {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  difficulty: "Easy" | "Medium" | "Advanced";
  features: string[];
  steps: string[];
  envVars: string[];
  buildCommand: string;
  outputDirectory: string;
}

const platforms: DeploymentPlatform[] = [
  {
    id: "vercel",
    name: "Vercel",
    description: "The easiest way to deploy Next.js applications with zero configuration",
    icon: Zap,
    difficulty: "Easy",
    features: [
      "Zero-config deployment",
      "Automatic HTTPS",
      "Global CDN",
      "Serverless functions",
      "Preview deployments",
      "Analytics"
    ],
    steps: [
      "Connect your GitHub repository to Vercel",
      "Configure environment variables in Vercel dashboard",
      "Deploy automatically on every push to main branch",
      "Set up custom domain (optional)"
    ],
    envVars: [
      "NEXT_PUBLIC_APP_URL",
      "DATABASE_URL",
      "NEXTAUTH_SECRET",
      "NEXTAUTH_URL"
    ],
    buildCommand: "npm run build",
    outputDirectory: ".next"
  },
  {
    id: "netlify",
    name: "Netlify",
    description: "Deploy modern web applications with continuous deployment from Git",
    icon: Globe,
    difficulty: "Easy",
    features: [
      "Git-based deployment",
      "Form handling",
      "Split testing",
      "Edge functions",
      "Identity management",
      "Analytics"
    ],
    steps: [
      "Connect your repository to Netlify",
      "Configure build settings and environment variables",
      "Set up redirects for client-side routing",
      "Deploy and configure custom domain"
    ],
    envVars: [
      "NEXT_PUBLIC_APP_URL",
      "DATABASE_URL",
      "NEXTAUTH_SECRET",
      "NEXTAUTH_URL"
    ],
    buildCommand: "npm run build && npm run export",
    outputDirectory: "out"
  },
  {
    id: "aws",
    name: "AWS",
    description: "Deploy on Amazon Web Services with full control and scalability",
    icon: Cloud,
    difficulty: "Advanced",
    features: [
      "Full infrastructure control",
      "Auto-scaling",
      "Load balancing",
      "Multiple regions",
      "Advanced monitoring",
      "Cost optimization"
    ],
    steps: [
      "Set up AWS account and configure CLI",
      "Create S3 bucket for static assets",
      "Configure CloudFront distribution",
      "Set up Lambda functions for API routes",
      "Configure Route 53 for custom domain",
      "Set up monitoring and logging"
    ],
    envVars: [
      "AWS_ACCESS_KEY_ID",
      "AWS_SECRET_ACCESS_KEY",
      "AWS_REGION",
      "DATABASE_URL",
      "NEXTAUTH_SECRET"
    ],
    buildCommand: "npm run build",
    outputDirectory: ".next"
  },
  {
    id: "docker",
    name: "Docker",
    description: "Containerize your application for consistent deployment anywhere",
    icon: Server,
    difficulty: "Medium",
    features: [
      "Consistent environments",
      "Easy scaling",
      "Platform independent",
      "Version control",
      "Resource isolation",
      "Orchestration ready"
    ],
    steps: [
      "Create Dockerfile for the application",
      "Build Docker image",
      "Test container locally",
      "Push to container registry",
      "Deploy to container platform",
      "Set up monitoring and logging"
    ],
    envVars: [
      "NODE_ENV",
      "PORT",
      "DATABASE_URL",
      "NEXTAUTH_SECRET",
      "NEXTAUTH_URL"
    ],
    buildCommand: "docker build -t app .",
    outputDirectory: "Container"
  }
];

const difficultyColors = {
  Easy: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
  Medium: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
  Advanced: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
};

export default function DeploymentPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState("vercel");

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const selectedPlatformData = platforms.find(p => p.id === selectedPlatform);

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
          <span className="text-slate-900 dark:text-slate-200 font-medium">Deployment</span>
        </nav>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-6">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Deployment Guide
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
            Deploy your Next.js fullstack application to production with step-by-step guides 
            for popular hosting platforms and deployment strategies.
          </p>
        </div>

        {/* Pre-deployment Checklist */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
            Pre-deployment Checklist
          </h2>
          <Card className="border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>Before You Deploy</span>
              </CardTitle>
              <CardDescription>
                Make sure your application is production-ready
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-900 dark:text-white">Code Quality</h4>
                  <ul className="space-y-2">
                    {[
                      "Run tests and ensure they pass",
                      "Fix TypeScript errors and warnings",
                      "Optimize images and assets",
                      "Remove console.log statements",
                      "Update dependencies to latest versions"
                    ].map((item, index) => (
                      <li key={index} className="flex items-center space-x-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-slate-700 dark:text-slate-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-900 dark:text-white">Configuration</h4>
                  <ul className="space-y-2">
                    {[
                      "Set up environment variables",
                      "Configure database connections",
                      "Set up authentication providers",
                      "Configure CORS settings",
                      "Set up monitoring and logging"
                    ].map((item, index) => (
                      <li key={index} className="flex items-center space-x-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-slate-700 dark:text-slate-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Platform Selection */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
            Choose Your Platform
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {platforms.map((platform) => {
              const IconComponent = platform.icon;
              const isSelected = selectedPlatform === platform.id;
              
              return (
                <Card 
                  key={platform.id} 
                  className={`cursor-pointer transition-all duration-300 border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:shadow-lg ${
                    isSelected ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''
                  }`}
                  onClick={() => setSelectedPlatform(platform.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg text-white">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <Badge className={difficultyColors[platform.difficulty]}>
                        {platform.difficulty}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{platform.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-sm line-clamp-2">
                      {platform.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Selected Platform Details */}
        {selectedPlatformData && (
          <section className="mb-12">
            <Card className="border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg text-white">
                    <selectedPlatformData.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{selectedPlatformData.name} Deployment</CardTitle>
                    <CardDescription className="text-base">
                      {selectedPlatformData.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="steps">Steps</TabsTrigger>
                    <TabsTrigger value="config">Configuration</TabsTrigger>
                    <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="mt-6">
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Key Features</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {selectedPlatformData.features.map((feature, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                              <span className="text-sm text-slate-700 dark:text-slate-300">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                          <h5 className="font-medium text-slate-900 dark:text-white mb-2">Build Command</h5>
                          <code className="text-sm text-slate-700 dark:text-slate-300">
                            {selectedPlatformData.buildCommand}
                          </code>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                          <h5 className="font-medium text-slate-900 dark:text-white mb-2">Output Directory</h5>
                          <code className="text-sm text-slate-700 dark:text-slate-300">
                            {selectedPlatformData.outputDirectory}
                          </code>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="steps" className="mt-6">
                    <div className="space-y-4">
                      {selectedPlatformData.steps.map((step, index) => (
                        <div key={index} className="flex items-start space-x-4">
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full font-semibold text-sm flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-slate-700 dark:text-slate-300">{step}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="config" className="mt-6">
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Required Environment Variables</h4>
                        <div className="space-y-2">
                          {selectedPlatformData.envVars.map((envVar, index) => (
                            <div key={index} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                              <code className="text-sm font-mono text-slate-900 dark:text-white">
                                {envVar}
                              </code>
                              <Badge variant="outline" className="text-xs">
                                Required
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {selectedPlatformData.id === "vercel" && (
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-white mb-3">vercel.json Configuration</h4>
                          <div className="relative">
                            <pre className="bg-slate-900 dark:bg-slate-950 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                              <code>{`{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    }
  ]
}`}</code>
                            </pre>
                            <Button
                              size="sm"
                              variant="outline"
                              className="absolute top-2 right-2 bg-slate-800 border-slate-700 hover:bg-slate-700"
                              onClick={() => copyToClipboard(`{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    }
  ]
}`, "vercel-config")}
                            >
                              {copiedCode === "vercel-config" ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {selectedPlatformData.id === "docker" && (
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Dockerfile</h4>
                          <div className="relative">
                            <pre className="bg-slate-900 dark:bg-slate-950 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                              <code>{`FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]`}</code>
                            </pre>
                            <Button
                              size="sm"
                              variant="outline"
                              className="absolute top-2 right-2 bg-slate-800 border-slate-700 hover:bg-slate-700"
                              onClick={() => copyToClipboard("Dockerfile content", "dockerfile")}
                            >
                              {copiedCode === "dockerfile" ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="troubleshooting" className="mt-6">
                    <div className="space-y-6">
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                              Common Issues
                            </h4>
                            <ul className="space-y-2 text-sm text-yellow-800 dark:text-yellow-200">
                              <li>• Build failures due to missing environment variables</li>
                              <li>• API routes not working in production</li>
                              <li>• Static file serving issues</li>
                              <li>• Database connection timeouts</li>
                              <li>• Authentication redirect problems</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                              Debugging Tips
                            </h4>
                            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                              <li>• Check deployment logs for error messages</li>
                              <li>• Verify all environment variables are set correctly</li>
                              <li>• Test API endpoints with curl or Postman</li>
                              <li>• Enable verbose logging in production</li>
                              <li>• Monitor performance and error rates</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Additional Resources */}
        <Card className="border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10">
          <CardHeader>
            <CardTitle>Additional Resources</CardTitle>
            <CardDescription>
              Helpful links and tools for deployment and monitoring
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" asChild>
                <Link href="/docs/getting-started">
                  <Terminal className="w-4 h-4 mr-2" />
                  Getting Started
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/docs/api">
                  <Database className="w-4 h-4 mr-2" />
                  API Documentation
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="https://github.com/khanakat" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  GitHub Repository
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}