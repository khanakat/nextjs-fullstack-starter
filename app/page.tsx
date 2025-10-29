import { auth } from "@/lib/conditional-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { commonMetadata } from "@/lib/seo";
import StructuredData from "@/components/structured-data";
import { structuredDataGenerators } from "@/lib/seo";

// Generate homepage metadata
export const metadata = commonMetadata.homepage();

export default function HomePage() {
  const { userId } = auth();

  // Redirect authenticated users to dashboard
  if (userId) {
    redirect("/dashboard");
  }
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <div className="flex items-center justify-center">
          <span className="font-bold">FullStack Template</span>
        </div>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            href="/docs"
          >
            Docs
          </Link>
          {userId ? (
            <>
              <Link
                className="text-sm font-medium hover:underline underline-offset-4"
                href="/dashboard"
              >
                Dashboard
              </Link>
              <Link
                className="text-sm font-medium hover:underline underline-offset-4"
                href="/api/auth/signout"
              >
                Sign Out
              </Link>
            </>
          ) : (
            <>
              <Link
                className="text-sm font-medium hover:underline underline-offset-4"
                href="/sign-in"
              >
                Sign In
              </Link>
              <Link
                className="text-sm font-medium hover:underline underline-offset-4"
                href="/sign-up"
              >
                Sign Up
              </Link>
            </>
          )}
          {/* <ThemeToggle /> */}
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Modern FullStack Template
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Production-ready template with Next.js 14, TypeScript, Prisma,
                  and modern authentication. Perfect for building scalable web
                  applications.
                </p>
              </div>
              <div className="space-x-4">
                <Link
                  href={userId ? "/dashboard" : "/sign-up"}
                  className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                >
                  {userId ? "Go to Dashboard" : "Get Started"} →
                </Link>
                <Link
                  href="/docs"
                  className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                >
                  View Docs
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          id="features"
          className="w-full py-12 md:py-24 lg:py-32 bg-muted/50"
        >
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Key Features
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Everything you need to build modern, scalable applications
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="text-xl font-bold">Modern Stack</h3>
                <p className="text-sm text-muted-foreground">
                  Built with Next.js 14, TypeScript, and modern React patterns
                  for optimal performance.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🗄️</span>
                </div>
                <h3 className="text-xl font-bold">Database Ready</h3>
                <p className="text-sm text-muted-foreground">
                  Prisma ORM with PostgreSQL, MySQL, and SQLite support.
                  Includes migrations and seeding.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🔐</span>
                </div>
                <h3 className="text-xl font-bold">Authentication</h3>
                <p className="text-sm text-muted-foreground">
                  Multiple auth providers with Clerk and NextAuth.js. Social
                  login and more.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">
          © 2024 FullStack Template. Built with ❤️ for developers.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <a
            className="text-xs hover:underline underline-offset-4"
            href="/terms"
          >
            Terms of Service
          </a>
          <a
            className="text-xs hover:underline underline-offset-4"
            href="/privacy"
          >
            Privacy
          </a>
        </nav>
      </footer>

      {/* Structured Data for Homepage */}
      <StructuredData
        data={[
          structuredDataGenerators.organization(),
          structuredDataGenerators.website(),
        ]}
      />
    </div>
  );
}
