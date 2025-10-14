import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { QueryProvider } from "@/lib/react-query";
import { seoConfig } from "@/lib/seo";
import { Toaster } from "sonner";
// import { ThemeProvider } from "next-themes";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(seoConfig.siteUrl),
  title: {
    default: seoConfig.siteName,
    template: `%s | ${seoConfig.siteName}`,
  },
  description: seoConfig.siteDescription,
  keywords: [
    "Next.js", "TypeScript", "React", "TailwindCSS", "Prisma", "FullStack",
    "Stripe", "Clerk", "shadcn/ui", "PostgreSQL", "File Upload", "Email"
  ],
  authors: [{ name: seoConfig.author.name, url: seoConfig.author.url }],
  creator: seoConfig.author.name,
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
    icon: seoConfig.faviconUrl,
    apple: seoConfig.logoUrl,
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
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#000000',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head />
        <body className={inter.className}>
          <QueryProvider>
            {children}
          </QueryProvider>
          <Toaster richColors />
        </body>
      </html>
    </ClerkProvider>
  );
}