import { Metadata } from "next";

/**
 * SEO Configuration and utilities for Next.js 14 Metadata API
 * Provides centralized SEO management with support for:
 * - Dynamic page metadata
 * - Open Graph (Facebook/LinkedIn)
 * - Twitter Cards
 * - Structured data (JSON-LD)
 * - Canonical URLs
 * - Robots directives
 */

// Base application configuration
export const seoConfig = {
  // Basic site information
  siteName: "FullStack Template",
  siteDescription:
    "Production-ready Next.js 14 fullstack template with TypeScript, PostgreSQL, Prisma, Clerk Auth, and more.",
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001",

  // Social media
  twitterHandle: "@yourtwitterhandle",

  // Default images
  defaultImage: "/og-image.png",
  logoUrl: "/logo.png",
  faviconUrl: "/favicon.ico",

  // Author information
  author: {
    name: "FullStack Template",
    url: "https://github.com/khanakat/nextjs-fullstack-starter",
    email: "contact@yourapp.com",
  },

  // Organization structured data
  organization: {
    name: "FullStack Template",
    url: "https://github.com/khanakat/nextjs-fullstack-starter",
    logo: "/logo.png",
    contactPoint: {
      telephone: "+1-555-0123",
      contactType: "customer service",
    },
  },
};

// SEO page types for consistent metadata
export type SEOPageType =
  | "website"
  | "article"
  | "product"
  | "profile"
  | "video"
  | "music"
  | "book";

// Comprehensive SEO options interface
export interface SEOOptions {
  title: string;
  description: string;

  // Optional overrides
  canonical?: string;
  noindex?: boolean;
  nofollow?: boolean;

  // Open Graph
  ogType?: SEOPageType;
  ogImage?: string;
  ogImageAlt?: string;

  // Twitter
  twitterCard?: "summary" | "summary_large_image" | "app" | "player";
  twitterImage?: string;

  // Article specific (for blogs/news)
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  section?: string;
  tags?: string[];

  // Structured data
  structuredData?: Record<string, any> | Record<string, any>[];

  // Additional meta tags
  keywords?: string[];
  language?: string;
}

/**
 * Generate comprehensive metadata for Next.js pages
 */
export function generateMetadata(options: SEOOptions): Metadata {
  const {
    title,
    description,
    canonical,
    noindex = false,
    nofollow = false,
    ogType = "website",
    ogImage,
    ogImageAlt,
    twitterCard = "summary_large_image",
    twitterImage,
    publishedTime,
    modifiedTime,
    authors,
    section,
    tags,
    keywords,
    language = "en",
  } = options;

  // Construct full title
  const fullTitle = title.includes(seoConfig.siteName)
    ? title
    : `${title} | ${seoConfig.siteName}`;

  // Resolve image URLs
  const resolvedOgImage = ogImage
    ? ogImage.startsWith("http")
      ? ogImage
      : `${seoConfig.siteUrl}${ogImage}`
    : `${seoConfig.siteUrl}${seoConfig.defaultImage}`;

  const resolvedTwitterImage = twitterImage
    ? twitterImage.startsWith("http")
      ? twitterImage
      : `${seoConfig.siteUrl}${twitterImage}`
    : resolvedOgImage;

  // Base metadata
  const metadata: Metadata = {
    title: fullTitle,
    description,

    // Language and charset
    ...(language && {
      alternates: {
        languages: {
          [language]: canonical || seoConfig.siteUrl,
        },
      },
    }),

    // Canonical URL
    ...(canonical && {
      alternates: {
        canonical: canonical.startsWith("http")
          ? canonical
          : `${seoConfig.siteUrl}${canonical}`,
      },
    }),

    // Robots directives
    robots: {
      index: !noindex,
      follow: !nofollow,
      googleBot: {
        index: !noindex,
        follow: !nofollow,
      },
    },

    // Keywords
    ...(keywords && { keywords: keywords.join(", ") }),

    // Authors
    ...(authors && { authors: authors.map((author) => ({ name: author })) }),

    // Open Graph
    openGraph: {
      type: ogType as any,
      siteName: seoConfig.siteName,
      title: fullTitle,
      description,
      url: canonical ? `${seoConfig.siteUrl}${canonical}` : seoConfig.siteUrl,
      images: [
        {
          url: resolvedOgImage,
          width: 1200,
          height: 630,
          alt: ogImageAlt || title,
        },
      ],
      locale: language,

      // Article specific
      ...(ogType === "article" && {
        publishedTime,
        modifiedTime,
        authors: authors,
        section,
        tags,
      }),
    },

    // Twitter
    twitter: {
      card: twitterCard,
      site: seoConfig.twitterHandle,
      creator: seoConfig.twitterHandle,
      title: fullTitle,
      description,
      images: [resolvedTwitterImage],
    },

    // Additional meta tags
    other: {
      // Prevent duplicate content
      ...(canonical && { "rel:canonical": canonical }),

      // Language
      "http-equiv": "Content-Language",
      content: language,

      // Mobile optimization
      viewport: "width=device-width, initial-scale=1",

      // Theme color
      "theme-color": "#000000",
      "msapplication-TileColor": "#000000",
    },
  };

  return metadata;
}

/**
 * Generate structured data (JSON-LD) script tag
 */
export function generateStructuredData(
  data: Record<string, any> | Record<string, any>[],
): string {
  const structuredData = Array.isArray(data) ? data : [data];

  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": structuredData,
  });
}

/**
 * Common structured data generators
 */
export const structuredDataGenerators = {
  // Website/Organization
  organization: () => ({
    "@type": "Organization",
    name: seoConfig.organization.name,
    url: seoConfig.organization.url,
    logo: `${seoConfig.siteUrl}${seoConfig.organization.logo}`,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: seoConfig.organization.contactPoint.telephone,
      contactType: seoConfig.organization.contactPoint.contactType,
    },
  }),

  // Website
  website: () => ({
    "@type": "WebSite",
    name: seoConfig.siteName,
    url: seoConfig.siteUrl,
    description: seoConfig.siteDescription,
    publisher: {
      "@type": "Organization",
      name: seoConfig.organization.name,
    },
  }),

  // Article/Blog post
  article: (options: {
    title: string;
    description: string;
    author: string;
    publishedTime: string;
    modifiedTime?: string;
    image?: string;
    url: string;
  }) => ({
    "@type": "Article",
    headline: options.title,
    description: options.description,
    author: {
      "@type": "Person",
      name: options.author,
    },
    publisher: {
      "@type": "Organization",
      name: seoConfig.organization.name,
      logo: {
        "@type": "ImageObject",
        url: `${seoConfig.siteUrl}${seoConfig.organization.logo}`,
      },
    },
    datePublished: options.publishedTime,
    dateModified: options.modifiedTime || options.publishedTime,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": options.url,
    },
    ...(options.image && {
      image: {
        "@type": "ImageObject",
        url: options.image.startsWith("http")
          ? options.image
          : `${seoConfig.siteUrl}${options.image}`,
      },
    }),
  }),

  // Product (for e-commerce)
  product: (options: {
    name: string;
    description: string;
    image: string;
    price: number;
    currency: string;
    availability: "InStock" | "OutOfStock" | "PreOrder";
    brand?: string;
  }) => ({
    "@type": "Product",
    name: options.name,
    description: options.description,
    image: options.image.startsWith("http")
      ? options.image
      : `${seoConfig.siteUrl}${options.image}`,
    offers: {
      "@type": "Offer",
      price: options.price,
      priceCurrency: options.currency,
      availability: `https://schema.org/${options.availability}`,
    },
    ...(options.brand && {
      brand: {
        "@type": "Brand",
        name: options.brand,
      },
    }),
  }),

  // FAQ
  faq: (questions: Array<{ question: string; answer: string }>) => ({
    "@type": "FAQPage",
    mainEntity: questions.map((qa) => ({
      "@type": "Question",
      name: qa.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: qa.answer,
      },
    })),
  }),

  // Breadcrumb
  breadcrumb: (items: Array<{ name: string; url: string }>) => ({
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http")
        ? item.url
        : `${seoConfig.siteUrl}${item.url}`,
    })),
  }),
};

/**
 * Pre-built metadata configurations for common pages
 */
export const commonMetadata = {
  // Homepage
  homepage: (): Metadata =>
    generateMetadata({
      title: seoConfig.siteName,
      description: seoConfig.siteDescription,
      structuredData: [
        structuredDataGenerators.organization(),
        structuredDataGenerators.website(),
      ],
    }),

  // Dashboard
  dashboard: (): Metadata =>
    generateMetadata({
      title: "Dashboard",
      description: "Manage your account, subscriptions, and settings.",
      noindex: true, // Private pages shouldn't be indexed
    }),

  // Auth pages
  signIn: (): Metadata =>
    generateMetadata({
      title: "Sign In",
      description:
        "Sign in to your account to access your dashboard and manage your settings.",
    }),

  signUp: (): Metadata =>
    generateMetadata({
      title: "Sign Up",
      description: "Create a new account to get started with our platform.",
    }),

  // Pricing
  pricing: (): Metadata =>
    generateMetadata({
      title: "Pricing Plans",
      description:
        "Choose the perfect plan for your needs. Free, Pro, and Enterprise options available.",
    }),

  // 404 Error
  notFound: (): Metadata =>
    generateMetadata({
      title: "Page Not Found",
      description: "The page you are looking for could not be found.",
      noindex: true,
    }),
};
