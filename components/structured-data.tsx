"use client";

import { generateStructuredData } from '@/lib/seo';

interface StructuredDataProps {
  data: Record<string, any> | Record<string, any>[];
}

/**
 * Component to inject structured data (JSON-LD) into the page
 * This helps search engines understand your content better
 */
export default function StructuredData({ data }: StructuredDataProps) {
  const jsonLd = generateStructuredData(data);
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLd }}
    />
  );
}