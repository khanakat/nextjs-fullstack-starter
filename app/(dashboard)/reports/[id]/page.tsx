import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { ReportViewer } from "@/components/reports/report-viewer";
import { ReportViewerSkeleton } from "@/components/reports/report-viewer-skeleton";
import { ReportService } from "@/lib/services/report-service";

interface ReportPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: ReportPageProps) {
  try {
    const { userId } = await auth();
    if (!userId) return { title: "Report" };

    const report = await ReportService.getReportById(params.id, userId);

    return {
      title: report?.name || "Report",
      description: report?.description || "View report details",
    };
  } catch {
    return { title: "Report" };
  }
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Verify report exists and user has access
  try {
    const report = await ReportService.getReportById(params.id, userId);
    if (!report) {
      notFound();
    }
  } catch (error) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<ReportViewerSkeleton />}>
        <ReportViewer reportId={params.id} />
      </Suspense>
    </div>
  );
}
