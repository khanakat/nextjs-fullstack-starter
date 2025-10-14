"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Globe, Share2, BarChart3 } from "lucide-react";
import { seoConfig, generateMetadata, structuredDataGenerators } from "@/lib/seo";
import { useSEO } from "@/hooks/use-seo";
import Breadcrumb from "@/components/breadcrumb";
import StructuredData from "@/components/structured-data";

export default function SEODemo() {
  const [activeTab, setActiveTab] = useState("metadata");
  const { breadcrumbs, canonicalUrl, pageType, structuredData } = useSEO();

  // Demo features showcase
  const features = [
    {
      icon: Search,
      title: "SEO Optimization",
      description: "Comprehensive metadata generation for search engines",
      color: "text-green-600"
    },
    {
      icon: Globe,
      title: "Open Graph",
      description: "Rich social media previews for Facebook, LinkedIn, etc.",
      color: "text-blue-600"
    },
    {
      icon: Share2,
      title: "Twitter Cards",
      description: "Optimized Twitter sharing with image previews",
      color: "text-purple-600"
    },
    {
      icon: BarChart3,
      title: "Structured Data",
      description: "JSON-LD markup for enhanced search results",
      color: "text-orange-600"
    }
  ];

  // Example metadata generation
  const exampleMetadata = generateMetadata({
    title: "SEO System Demo",
    description: "Comprehensive SEO and metadata management system for Next.js applications.",
    ogImage: "/demo-image.jpg",
    keywords: ["SEO", "Next.js", "React", "Metadata", "Open Graph"],
    authors: ["Your Name"],
    structuredData: structuredData
  });

  // Example structured data
  const exampleStructuredData = [
    structuredDataGenerators.organization(),
    structuredDataGenerators.website(),
    structuredDataGenerators.article({
      title: "SEO Best Practices",
      description: "Learn how to optimize your website for search engines",
      author: "SEO Expert",
      publishedTime: "2024-01-15T10:00:00Z",
      url: canonicalUrl
    })
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Search className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-xl">SEO & Metadata System</CardTitle>
              <p className="text-sm text-muted-foreground">
                Complete SEO optimization with dynamic metadata, Open Graph, and structured data
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Icon className={`h-5 w-5 ${feature.color} flex-shrink-0 mt-0.5`} />
                  <div>
                    <div className="font-medium text-sm">{feature.title}</div>
                    <div className="text-xs text-muted-foreground">{feature.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current Page Info */}
      <Card>
        <CardHeader>
          <CardTitle>Current Page SEO Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm font-medium mb-2">Breadcrumb Navigation</div>
              <Breadcrumb items={breadcrumbs} />
            </div>
            <div>
              <div className="text-sm font-medium mb-2">Page Details</div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>Type: <Badge variant="outline">{pageType}</Badge></div>
                <div>Canonical: <code className="text-xs">{canonicalUrl}</code></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demo Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>SEO Features Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
              <TabsTrigger value="opengraph">Open Graph</TabsTrigger>
              <TabsTrigger value="structured">Structured Data</TabsTrigger>
              <TabsTrigger value="tools">SEO Tools</TabsTrigger>
            </TabsList>

            <TabsContent value="metadata" className="mt-6">
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Dynamic Metadata Generation</h3>
                  <p className="text-sm text-muted-foreground">
                    Automatically generate comprehensive HTML metadata for better SEO
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm font-medium mb-2">Generated HTML Meta Tags:</div>
                  <pre className="text-xs bg-white p-3 rounded border overflow-auto">
{`<title>${exampleMetadata.title}</title>
<meta name="description" content="${exampleMetadata.description}" />
<meta name="robots" content="index,follow" />
<meta property="og:title" content="${exampleMetadata.title}" />
<meta property="og:description" content="${exampleMetadata.description}" />
<meta property="og:image" content="${seoConfig.siteUrl}/demo-image.jpg" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${exampleMetadata.title}" />
<link rel="canonical" href="${canonicalUrl}" />`}
                  </pre>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="opengraph" className="mt-6">
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Social Media Preview</h3>
                  <p className="text-sm text-muted-foreground">
                    Rich previews for Facebook, LinkedIn, and other social platforms
                  </p>
                </div>
                
                <div className="max-w-md mx-auto">
                  <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                    <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                      <div className="text-white text-center">
                        <Globe className="h-8 w-8 mx-auto mb-2" />
                        <div className="text-sm">Preview Image</div>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="text-sm font-medium mb-1">SEO System Demo | FullStack Template</div>
                      <div className="text-xs text-muted-foreground mb-2">
                        Comprehensive SEO and metadata management system for Next.js applications.
                      </div>
                      <div className="text-xs text-muted-foreground">{seoConfig.siteUrl}</div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="structured" className="mt-6">
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Structured Data (JSON-LD)</h3>
                  <p className="text-sm text-muted-foreground">
                    Enhanced search results with rich snippets and knowledge panels
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm font-medium mb-2">Generated JSON-LD:</div>
                  <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-64">
                    {JSON.stringify(exampleStructuredData[0], null, 2)}
                  </pre>
                </div>
                
                {/* Inject actual structured data */}
                <StructuredData data={exampleStructuredData} />
              </div>
            </TabsContent>

            <TabsContent value="tools" className="mt-6">
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">SEO Testing Tools</h3>
                  <p className="text-sm text-muted-foreground">
                    Links to validate and test your SEO implementation
                  </p>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Google Testing Tools</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start"
                        onClick={() => window.open('https://search.google.com/test/rich-results', '_blank')}
                      >
                        Rich Results Test
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start"
                        onClick={() => window.open('https://pagespeed.web.dev/', '_blank')}
                      >
                        PageSpeed Insights
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Social Media Testing</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start"
                        onClick={() => window.open('https://developers.facebook.com/tools/debug/', '_blank')}
                      >
                        Facebook Debugger
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start"
                        onClick={() => window.open('https://cards-dev.twitter.com/validator', '_blank')}
                      >
                        Twitter Card Validator
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Implementation Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Implementation Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium">Features Included</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Dynamic metadata generation with Next.js 14 Metadata API</li>
                <li>• Open Graph and Twitter Card optimization</li>
                <li>• Structured data (JSON-LD) for rich snippets</li>
                <li>• SEO-friendly breadcrumb navigation</li>
                <li>• Canonical URL management</li>
                <li>• Robots directives and indexing control</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Files Created</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <code>lib/seo.ts</code> - SEO utilities and config</li>
                <li>• <code>hooks/use-seo.ts</code> - SEO React hooks</li>
                <li>• <code>components/structured-data.tsx</code> - JSON-LD component</li>
                <li>• <code>components/breadcrumb.tsx</code> - Navigation component</li>
                <li>• <code>components/seo-demo.tsx</code> - Demo interface</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}