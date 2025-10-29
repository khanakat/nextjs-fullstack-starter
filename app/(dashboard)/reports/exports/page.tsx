import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ExportCenter } from "@/components/reports/export-center";
import { ExportCenterSkeleton } from "@/components/reports/export-center-skeleton";

export const metadata = {
  title: "Export Center",
  description: "Manage your report exports and download history",
};

interface ExportCenterPageProps {
  searchParams: {
    status?: string;
    format?: string;
    date?: string;
  };
}

export default async function ExportCenterPage({
  searchParams,
}: ExportCenterPageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Export Center</h1>
        <p className="text-muted-foreground mt-2">
          Monitor export jobs, download completed reports, and manage your
          export history
        </p>
      </div>

      <Suspense fallback={<ExportCenterSkeleton />}>
        <ExportCenter
          userId={userId}
          initialStatus={searchParams.status}
          initialFormat={searchParams.format}
          initialDate={searchParams.date}
        />
      </Suspense>
    </div>
  );
}
