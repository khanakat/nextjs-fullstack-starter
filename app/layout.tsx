import { ConditionalClerkProvider } from "@/components/conditional-clerk";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { QueryProvider } from "@/lib/react-query";
import { seoConfig } from "@/lib/seo";
import { Toaster } from "sonner";
// import { ThemeProvider } from "next-themes";
import "./globals.css";
import "./showcase/components/drag-drop/styles.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(seoConfig.siteUrl),
  title: {
    default: seoConfig.siteName,
    template: `%s | ${seoConfig.siteName}`,
  },
  description: seoConfig.siteDescription,
  keywords: [
    "Next.js",
    "TypeScript",
    "React",
    "TailwindCSS",
    "Prisma",
    "FullStack",
    "Stripe",
    "Clerk",
    "shadcn/ui",
    "PostgreSQL",
    "File Upload",
    "Email",
    "PWA",
    "Mobile",
    "Offline",
    "Progressive Web App",
  ],
  authors: [{ name: seoConfig.author.name, url: seoConfig.author.url }],
  creator: seoConfig.author.name,
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: seoConfig.siteUrl,
    title: seoConfig.siteName,
    description: seoConfig.siteDescription,
    siteName: seoConfig.siteName,
    images: [
      {
        url: seoConfig.defaultImage,
        width: 1200,
        height: 630,
        alt: seoConfig.siteName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: seoConfig.siteName,
    description: seoConfig.siteDescription,
    creator: seoConfig.twitterHandle,
    images: [seoConfig.defaultImage],
  },
  icons: {
    icon: [
      {
        url: "/icons/icon-192x192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
      {
        url: "/icons/icon-512x512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
    ],
    apple: [
      {
        url: "/icons/icon-152x152.svg",
        sizes: "152x152",
        type: "image/svg+xml",
      },
      {
        url: "/icons/icon-192x192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
    ],
    shortcut: "/icons/icon-96x96.svg",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: seoConfig.siteName,
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#000000",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <ConditionalClerkProvider>
      <html lang="en">
        <head>
          <link rel="icon" href="/favicon.ico" />
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#3b82f6" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta
            name="apple-mobile-web-app-status-bar-style"
            content="default"
          />
          <meta
            name="apple-mobile-web-app-title"
            content="NextJS Fullstack Starter"
          />
          <meta name="msapplication-TileColor" content="#3b82f6" />
          <meta name="msapplication-tap-highlight" content="no" />
          <link rel="apple-touch-icon" href="/icons/icon-152x152.png" />
          <link
            rel="apple-touch-startup-image"
            href="/icons/splash-640x1136.png"
            media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)"
          />
          <link
            rel="apple-touch-startup-image"
            href="/icons/splash-750x1334.png"
            media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)"
          />
          <link
            rel="apple-touch-startup-image"
            href="/icons/splash-1242x2208.png"
            media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)"
          />
          <link
            rel="mask-icon"
            href="/icons/icon-192x192.png"
            color="#3b82f6"
          />
        </head>
        <body className={inter.className}>
          <QueryProvider>{children}</QueryProvider>
          <Toaster richColors />
        </body>
      </html>
    </ConditionalClerkProvider>
  );
}
