import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ReportsDashboard } from "@/components/reports/reports-dashboard";
import { ReportsDashboardSkeleton } from "@/components/reports/reports-dashboard-skeleton";

export const metadata = {
  title: "Reports Dashboard",
  description: "Manage and view your reports",
};

export default async function ReportsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Reports Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Create, manage, and analyze your reports
        </p>
      </div>

      <Suspense fallback={<ReportsDashboardSkeleton />}>
        <ReportsDashboard />
      </Suspense>
    </div>
  );
}
