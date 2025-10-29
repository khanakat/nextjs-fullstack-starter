import { Metadata } from "next";
import SEODemo from "@/components/seo-demo";

export const metadata: Metadata = {
  title: "SEO System | Fullstack Template",
  description: "Dynamic metadata generation and SEO optimization features.",
};

export default function SEOPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">SEO System</h1>
          <p className="text-muted-foreground mt-2">
            Dynamic metadata generation, structured data, and SEO optimization.
          </p>
        </div>

        <SEODemo />
      </div>
    </div>
  );
}
