import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Github, ExternalLink, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Component Showcase | Next.js Fullstack Starter",
  description: "Explore our comprehensive collection of components, features, and integrations for modern web applications.",
  keywords: ["components", "showcase", "react", "nextjs", "typescript", "ui", "features"],
  openGraph: {
    title: "Component Showcase",
    description: "Explore our comprehensive collection of components, features, and integrations for modern web applications.",
    type: "website",
    images: [
      {
        url: "/og-showcase.png",
        width: 1200,
        height: 630,
        alt: "Component Showcase",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Component Showcase",
    description: "Explore our comprehensive collection of components, features, and integrations for modern web applications.",
    images: ["/og-showcase.png"],
  },
};

interface ShowcaseLayoutProps {
  children: React.ReactNode;
}

export default function ShowcaseLayout({ children }: ShowcaseLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 dark:bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Left side - Back to main app */}
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to App
                </Button>
              </Link>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
              <Link href="/showcase" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-slate-900 dark:text-white">
                  Showcase
                </span>
              </Link>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="https://github.com/khanakat" target="_blank" rel="noopener noreferrer">
                  <Github className="w-4 h-4 mr-2" />
                  GitHub
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/docs" target="_blank" rel="noopener noreferrer">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Docs
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white dark:bg-slate-900 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-slate-900 dark:text-white">
                  Component Showcase
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 mb-4 max-w-md">
                A comprehensive collection of components, features, and integrations 
                for building modern web applications with Next.js and TypeScript.
              </p>
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" asChild>
                  <Link href="https://github.com/khanakat" target="_blank" rel="noopener noreferrer">
                    <Github className="w-4 h-4 mr-2" />
                    Star on GitHub
                  </Link>
                </Button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Components</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/showcase/components/drag-drop" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                    Drag & Drop
                  </Link>
                </li>
                <li>
                  <Link href="/showcase/components/ui-elements" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                    UI Elements
                  </Link>
                </li>
                <li>
                  <Link href="/showcase/components/design-system" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                    Design System
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Features</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/showcase/features/realtime" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                    Real-time
                  </Link>
                </li>
                <li>
                  <Link href="/showcase/features/collaboration" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                    Collaboration
                  </Link>
                </li>
                <li>
                  <Link href="/showcase/features/workflows" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                    Workflows
                  </Link>
                </li>
                <li>
                  <Link href="/showcase/features/integrations" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                    Integrations
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t pt-8 mt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                © 2024 Next.js Fullstack Starter. Built with ❤️ using Next.js, TypeScript, and Tailwind CSS.
              </p>
              <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Privacy
                </Link>
                <Link href="/terms" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Terms
                </Link>
                <Link href="/support" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}