"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConditionalSignedIn, ConditionalSignedOut, ConditionalUserButton } from "@/components/conditional-clerk";
import { Button } from "@/components/ui/button";
import NotificationCenter from "@/components/notification-center";
import {
  Home,
  Upload,
  Mail,
  CreditCard,
  Search,
  BarChart3,
  Layers,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Showcase", href: "/showcase", icon: Layers },
  { name: "File Upload", href: "/upload", icon: Upload },
  { name: "Email Demo", href: "/email", icon: Mail },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "SEO Demo", href: "/seo", icon: Search },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-6 w-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded"></div>
            <span className="font-semibold">Fullstack Template</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${
                    isActive ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <ConditionalSignedIn>
            <NotificationCenter />
            <ConditionalUserButton afterSignOutUrl="/" />
          </ConditionalSignedIn>
          <ConditionalSignedOut>
            <Button asChild variant="ghost">
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">Sign Up</Link>
            </Button>
          </ConditionalSignedOut>
        </div>
      </div>
    </header>
  );
}
