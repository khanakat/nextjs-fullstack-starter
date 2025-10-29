"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { seoConfig, structuredDataGenerators } from "@/lib/seo";

/**
 * Custom hook for generating dynamic SEO data on client-side
 * Useful for generating breadcrumbs, canonical URLs, and structured data
 */
export function useSEO() {
  const pathname = usePathname();

  // Generate breadcrumbs from pathname
  const breadcrumbs = useMemo(() => {
    const segments = pathname?.split("/").filter(Boolean) || [];

    const items = [{ label: "Home", href: "/" }];

    let currentPath = "";
    segments.forEach((segment) => {
      currentPath += `/${segment}`;
      const label = segment
        .replace(/-/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());

      items.push({
        label,
        href: currentPath,
      });
    });

    return items;
  }, [pathname]);

  // Generate canonical URL
  const canonicalUrl = useMemo(() => {
    return `${seoConfig.siteUrl}${pathname}`;
  }, [pathname]);

  // Page type detection
  const pageType = useMemo(() => {
    if (!pathname) return "page";
    if (pathname === "/") return "homepage";
    if (pathname.startsWith("/dashboard")) return "dashboard";
    if (pathname.startsWith("/blog/")) return "article";
    if (pathname.startsWith("/products/")) return "product";
    if (pathname === "/pricing") return "pricing";
    if (pathname === "/sign-in") return "auth";
    if (pathname === "/sign-up") return "auth";
    return "page";
  }, [pathname]);

  // Generate page-specific structured data
  const structuredData = useMemo(() => {
    const baseData = [
      structuredDataGenerators.organization(),
      structuredDataGenerators.website(),
    ];

    // Add breadcrumb structured data
    if (breadcrumbs.length > 1) {
      baseData.push(
        structuredDataGenerators.breadcrumb(
          breadcrumbs.map((item) => ({
            name: item.label,
            url: item.href,
          })),
        ) as any,
      );
    }

    return baseData;
  }, [breadcrumbs]);

  return {
    breadcrumbs,
    canonicalUrl,
    pageType,
    structuredData,
    pathname,

    // Utility functions
    generatePageTitle: (title: string) =>
      title.includes(seoConfig.siteName)
        ? title
        : `${title} | ${seoConfig.siteName}`,

    isPublicPage: () =>
      pathname
        ? !pathname.startsWith("/dashboard") && !pathname.startsWith("/admin")
        : true,

    shouldIndex: () =>
      pathname
        ? !pathname.startsWith("/dashboard") &&
          !pathname.startsWith("/admin") &&
          !pathname.includes("/private")
        : true,
  };
}

/**
 * Hook for tracking page views (useful for analytics)
 */
export function usePageView() {
  const pathname = usePathname();

  // This would integrate with your analytics service
  // For example: Google Analytics, PostHog, etc.
  const trackPageView = (title?: string) => {
    // Example implementation:
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("config", "GA_TRACKING_ID", {
        page_title: title,
        page_location: window.location.href,
      });
    }

    // PostHog example:
    if (typeof window !== "undefined" && (window as any).posthog) {
      (window as any).posthog.capture("$pageview", {
        $current_url: window.location.href,
        page_title: title,
      });
    }
  };

  return {
    pathname,
    trackPageView,
  };
}
