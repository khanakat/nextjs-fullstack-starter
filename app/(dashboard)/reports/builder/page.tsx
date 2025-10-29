import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ReportBuilder } from "@/components/reports/report-builder";
import { ReportBuilderSkeleton } from "@/components/reports/report-builder-skeleton";

export const metadata = {
  title: "Report Builder",
  description: "Create and customize your reports with drag-and-drop interface",
};

interface ReportBuilderPageProps {
  searchParams: {
    edit?: string;
    duplicate?: string;
    template?: string;
  };
}

export default async function ReportBuilderPage({
  searchParams,
}: ReportBuilderPageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto py-4">
          <h1 className="text-2xl font-bold tracking-tight">Report Builder</h1>
          <p className="text-muted-foreground">
            {searchParams.edit
              ? "Edit your report"
              : "Create a new report with drag-and-drop components"}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Suspense fallback={<ReportBuilderSkeleton />}>
          <ReportBuilder
            userId={userId}
            editReportId={searchParams.edit}
            duplicateReportId={searchParams.duplicate}
            templateId={searchParams.template}
          />
        </Suspense>
      </div>
    </div>
  );
}
