"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
}

/**
 * SEO-friendly breadcrumb navigation component
 * Provides structured navigation and JSON-LD data for search engines
 */
export default function Breadcrumb({
  items,
  className,
  showHome = true,
}: BreadcrumbProps) {
  // Add home item if not present and showHome is true
  const allItems =
    showHome && items[0]?.href !== "/"
      ? [{ label: "Home", href: "/" }, ...items]
      : items;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex items-center space-x-1 text-sm text-muted-foreground",
        className,
      )}
    >
      <ol className="flex items-center space-x-1">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const isHome = item.href === "/";

          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/50" />
              )}

              {isLast || !item.href ? (
                <span
                  className="font-medium text-foreground"
                  aria-current={isLast ? "page" : undefined}
                >
                  {isHome ? <Home className="h-4 w-4" /> : item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-foreground transition-colors"
                  title={`Go to ${item.label}`}
                >
                  {isHome ? <Home className="h-4 w-4" /> : item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
