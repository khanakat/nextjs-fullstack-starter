"use client";

import React from "react";
import Link from "next/link";
import { 
  ChevronRight, 
  Home, 
  Rocket, 
  Download, 
  Terminal, 
  Play, 
  CheckCircle,
  ExternalLink,
  Copy,
  ArrowRight,
  Zap,
  Code,
  Settings
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const steps = [
  {
    id: "prerequisites",
    title: "Prerequisites",
    description: "Make sure you have the required tools installed",
    icon: CheckCircle,
    items: [
      "Node.js 18+ installed",
      "npm or pnpm package manager",
      "Git for version control",
      "Code editor (VS Code recommended)"
    ]
  },
  {
    id: "installation",
    title: "Installation",
    description: "Clone and set up the project locally",
    icon: Download,
    code: `# Clone the repository
git clone https://github.com/khanakat/nextjs-fullstack-starter.git
cd nextjs-fullstack-starter

# Install dependencies
npm install
# or
pnpm install`
  },
  {
    id: "environment",
    title: "Environment Setup",
    description: "Configure your environment variables",
    icon: Settings,
    code: `# Copy the example environment file
cp .env.example .env.local

# Edit .env.local with your configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=your_database_url
NEXTAUTH_SECRET=your_secret_key`
  },
  {
    id: "development",
    title: "Start Development",
    description: "Run the development server",
    icon: Terminal,
    code: `# Start the development server
npm run dev
# or
pnpm dev

# Open http://localhost:3000 in your browser`
  }
];

const quickLinks = [
  {
    title: "Component Showcase",
    description: "Explore all available components",
    href: "/showcase/components/ui-elements",
    icon: Code
  },
  {
    title: "API Documentation",
    description: "Learn about the API endpoints",
    href: "/docs/api",
    icon: Zap
  },
  {
    title: "Architecture Guide",
    description: "Understand the project structure",
    href: "/docs/architecture",
    icon: Settings
  }
];

export default function GettingStartedPage() {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
          <span className="text-slate-900 dark:text-slate-200 font-medium">Getting Started</span>
        </nav>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-6">
            <Rocket className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Getting Started
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Get up and running with our Next.js fullstack starter in just a few minutes. 
            Follow this step-by-step guide to set up your development environment.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-8 mb-16">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            
            return (
              <Card key={step.id} className="border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white font-bold text-lg">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="flex items-center space-x-3">
                        <IconComponent className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        <span>{step.title}</span>
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {step.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {step.items && (
                    <ul className="space-y-2">
                      {step.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-center space-x-3">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span className="text-slate-700 dark:text-slate-300">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  
                  {step.code && (
                    <div className="relative">
                      <pre className="bg-slate-900 dark:bg-slate-950 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                        <code>{step.code}</code>
                      </pre>
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute top-2 right-2 bg-slate-800 border-slate-700 hover:bg-slate-700"
                        onClick={() => copyToClipboard(step.code!)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Success Message */}
        <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 mb-12">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 bg-green-500 rounded-full">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                  🎉 Congratulations!
                </h3>
                <p className="text-green-700 dark:text-green-300">
                  Your development environment is now ready. You can start building amazing applications!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            What's Next?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickLinks.map((link) => {
              const IconComponent = link.icon;
              
              return (
                <Card key={link.href} className="group hover:shadow-lg transition-all duration-300 border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg text-white">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <CardTitle className="text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {link.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      {link.description}
                    </CardDescription>
                    <Button size="sm" variant="ghost" asChild className="group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 p-0">
                      <Link href={link.href} className="flex items-center">
                        Learn more
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Help Section */}
        <Card className="border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
            <CardDescription>
              If you run into any issues during setup, here are some resources to help you out.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="outline" asChild>
                <Link href="https://github.com/khanakat" target="_blank" rel="noopener noreferrer">
                  GitHub Issues
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/docs">
                  Browse Documentation
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/showcase">
                  View Examples
                  <Play className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}