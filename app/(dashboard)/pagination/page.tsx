import { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { PaginationDemo } from "@/components/pagination-demo";

export const metadata: Metadata = {
  title: "Pagination System | Fullstack Template",
  description: "Reusable pagination components and data tables demonstration."
};

export default function PaginationPage() {
  return (
    <Container className="py-6">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pagination System</h1>
          <p className="text-muted-foreground mt-2">
            Reusable pagination components for tables, lists, and data displays.
          </p>
        </div>
        
        <PaginationDemo />
      </div>
    </Container>
  );
}