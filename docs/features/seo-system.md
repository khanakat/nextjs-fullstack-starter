# SEO & Metadata Management System

A comprehensive SEO optimization system for Next.js 14 with dynamic metadata, Open Graph support, structured data, and automated sitemap generation.

## 🌟 Features

### Metadata Management

- **Dynamic metadata generation** with Next.js 14 Metadata API
- **Title templates** with consistent branding
- **Description optimization** for search engines
- **Canonical URLs** to prevent duplicate content
- **Robots directives** for crawling control

### Social Media Optimization

- **Open Graph** for Facebook, LinkedIn, WhatsApp
- **Twitter Cards** for enhanced Twitter sharing
- **Dynamic image generation** for social previews
- **Structured social metadata** across all pages

### Search Engine Features

- **Structured data (JSON-LD)** for rich snippets
- **Breadcrumb navigation** with SEO markup
- **Automatic sitemap.xml** generation
- **Dynamic robots.txt** with proper directives
- **Schema.org markup** for better understanding

### Analytics & Tracking

- **Page view tracking** hooks
- **SEO performance monitoring**
- **Canonical URL management**
- **Index/noindex control** per page

## 🚀 Quick Start

### 1. Configuration

The SEO system uses centralized configuration in `lib/seo.ts`:

```typescript
export const seoConfig = {
  siteName: "Your App Name",
  siteDescription: "Your app description for search engines",
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001",

  // Social media
  twitterHandle: "@yourhandle",

  // Images
  defaultImage: "/og-image.png",
  logoUrl: "/logo.png",
  faviconUrl: "/favicon.ico",

  // Author/Organization
  author: {
    name: "Your Name",
    url: "https://yourwebsite.com",
    email: "contact@yourapp.com",
  },
};
```

### 2. Page Metadata

Use the `generateMetadata` function or pre-built configurations:

```typescript
import { generateMetadata, commonMetadata } from "@/lib/seo";

// Option 1: Pre-built metadata
export const metadata = commonMetadata.homepage();

// Option 2: Custom metadata
export const metadata = generateMetadata({
  title: "Your Page Title",
  description: "Page description for SEO",
  ogImage: "/custom-image.jpg",
  keywords: ["keyword1", "keyword2"],
  authors: ["Author Name"],
});
```

### 3. Structured Data

Add JSON-LD structured data to pages:

```tsx
import StructuredData from "@/components/structured-data";
import { structuredDataGenerators } from "@/lib/seo";

export default function ArticlePage() {
  const articleData = structuredDataGenerators.article({
    title: "Article Title",
    description: "Article description",
    author: "Author Name",
    publishedTime: "2024-01-15T10:00:00Z",
    url: "/article/slug",
  });

  return (
    <div>
      <h1>Article Content</h1>
      <StructuredData data={articleData} />
    </div>
  );
}
```

### 4. Breadcrumb Navigation

Add SEO-friendly breadcrumbs:

```tsx
import Breadcrumb from "@/components/breadcrumb";

const breadcrumbItems = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/products" },
  { label: "Product Name" }, // Current page (no href)
];

<Breadcrumb items={breadcrumbItems} />;
```

## 🔧 Components

### StructuredData

Injects JSON-LD structured data into pages:

```tsx
<StructuredData
  data={[
    structuredDataGenerators.organization(),
    structuredDataGenerators.website(),
  ]}
/>
```

### Breadcrumb

SEO-optimized navigation component:

```tsx
<Breadcrumb items={breadcrumbItems} showHome={true} className="my-4" />
```

### SEODemo

Complete demonstration of all SEO features:

```tsx
<SEODemo />
```

## 🔍 Structured Data Types

### Organization

```typescript
structuredDataGenerators.organization();
```

### Website

```typescript
structuredDataGenerators.website();
```

### Article/Blog Post

```typescript
structuredDataGenerators.article({
  title: "Article Title",
  description: "Article description",
  author: "Author Name",
  publishedTime: "2024-01-15T10:00:00Z",
  modifiedTime: "2024-01-16T10:00:00Z",
  image: "/article-image.jpg",
  url: "/articles/slug",
});
```

### Product (E-commerce)

```typescript
structuredDataGenerators.product({
  name: "Product Name",
  description: "Product description",
  image: "/product-image.jpg",
  price: 99.99,
  currency: "USD",
  availability: "InStock",
  brand: "Brand Name",
});
```

### FAQ Page

```typescript
structuredDataGenerators.faq([
  {
    question: "What is your return policy?",
    answer: "We offer 30-day returns on all products.",
  },
  {
    question: "Do you ship internationally?",
    answer: "Yes, we ship worldwide.",
  },
]);
```

### Breadcrumb

```typescript
structuredDataGenerators.breadcrumb([
  { name: "Home", url: "/" },
  { name: "Products", url: "/products" },
  { name: "Category", url: "/products/category" },
]);
```

## 🛠️ Hooks

### useSEO

React hook for client-side SEO utilities:

```tsx
import { useSEO } from "@/hooks/use-seo";

function MyComponent() {
  const {
    breadcrumbs,
    canonicalUrl,
    pageType,
    generatePageTitle,
    shouldIndex,
  } = useSEO();

  return (
    <div>
      <h1>{generatePageTitle("Page Title")}</h1>
      <Breadcrumb items={breadcrumbs} />
      {shouldIndex() && <meta name="robots" content="index,follow" />}
    </div>
  );
}
```

### usePageView

Track page views for analytics:

```tsx
import { usePageView } from "@/hooks/use-seo";

function MyPage() {
  const { trackPageView } = usePageView();

  useEffect(() => {
    trackPageView("Page Title");
  }, []);

  return <div>Page content</div>;
}
```

## 📄 Automatic File Generation

### Sitemap (app/sitemap.ts)

Automatically generates XML sitemap:

```typescript
// Add custom routes to sitemap
export default function sitemap() {
  const routes = [
    {
      url: `${baseUrl}/custom-page`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
  ];

  return [...staticRoutes, ...routes];
}
```

### Robots.txt (app/robots.ts)

Dynamic robots.txt with proper directives:

```typescript
export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

## 🎯 Pre-built Metadata Configurations

### Homepage

```typescript
export const metadata = commonMetadata.homepage();
```

### Dashboard (Private)

```typescript
export const metadata = commonMetadata.dashboard();
```

### Authentication Pages

```typescript
export const metadata = commonMetadata.signIn();
export const metadata = commonMetadata.signUp();
```

### Pricing Page

```typescript
export const metadata = commonMetadata.pricing();
```

### 404 Error Page

```typescript
export const metadata = commonMetadata.notFound();
```

## 🔍 SEO Testing & Validation

### Testing Tools Integration

The SEO demo includes quick links to:

- **Google Rich Results Test**
- **PageSpeed Insights**
- **Facebook Sharing Debugger**
- **Twitter Card Validator**

### Local Testing

```bash
# Check generated metadata
curl -I http://localhost:3001

# View sitemap
curl http://localhost:3001/sitemap.xml

# Check robots.txt
curl http://localhost:3001/robots.txt
```

## 📊 Analytics Integration

### Google Analytics 4

```typescript
// In your layout or page
import { usePageView } from "@/hooks/use-seo";

export default function Page() {
  const { trackPageView } = usePageView();

  useEffect(() => {
    trackPageView("Page Title");
  }, []);
}
```

### Custom Analytics

```typescript
// Extend the usePageView hook
const trackCustomEvent = (eventName: string, properties: any) => {
  if (typeof window !== "undefined" && window.analytics) {
    window.analytics.track(eventName, properties);
  }
};
```

## 🚀 Production Optimization

### Environment Variables

```bash
# Required for production
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Optional (for verification)
GOOGLE_SITE_VERIFICATION=your-verification-code
BING_SITE_VERIFICATION=your-bing-code
```

### Performance Tips

- Use Next.js Image component for OG images
- Implement lazy loading for structured data
- Cache sitemap generation in production
- Optimize meta descriptions to 150-160 characters
- Use semantic HTML structure

### SEO Checklist

- ✅ Title tags under 60 characters
- ✅ Meta descriptions 150-160 characters
- ✅ H1 tag on every page
- ✅ Proper heading hierarchy (H1 → H2 → H3)
- ✅ Alt text for all images
- ✅ Canonical URLs set
- ✅ Structured data implemented
- ✅ Sitemap.xml generated
- ✅ Robots.txt configured
- ✅ Mobile-friendly viewport
- ✅ Page speed optimized

## 📚 Additional Resources

- [Next.js Metadata API](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Google Search Central](https://developers.google.com/search)
- [Schema.org Documentation](https://schema.org/)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Card Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)

## 🔄 Common Patterns

### Dynamic Product Pages

```typescript
export async function generateMetadata({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);

  return generateMetadata({
    title: product.name,
    description: product.description,
    ogImage: product.image,
    structuredData: structuredDataGenerators.product({
      name: product.name,
      description: product.description,
      image: product.image,
      price: product.price,
      currency: "USD",
      availability: product.inStock ? "InStock" : "OutOfStock",
    }),
  });
}
```

### Blog Articles

```typescript
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getPost(params.slug);

  return generateMetadata({
    title: post.title,
    description: post.excerpt,
    authors: [post.author.name],
    publishedTime: post.publishedAt,
    ogType: "article",
    structuredData: structuredDataGenerators.article({
      title: post.title,
      description: post.excerpt,
      author: post.author.name,
      publishedTime: post.publishedAt,
      url: `/blog/${post.slug}`,
    }),
  });
}
```
