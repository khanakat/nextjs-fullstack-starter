import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ScheduledReportsDashboard } from "@/components/scheduled-reports/scheduled-reports-dashboard";
import { ScheduledReportsDashboardSkeleton } from "@/components/scheduled-reports/scheduled-reports-dashboard-skeleton";

export const metadata = {
  title: "Scheduled Reports",
  description: "Manage and monitor your scheduled reports",
};

// Check if Clerk is properly configured
const hasValidClerkKeys = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== "pk_test_development_key" &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_");

export default async function ScheduledReportsPage() {
  let userId = "demo-user";
  let orgId = "demo-org";

  // Only use Clerk auth if properly configured
  if (hasValidClerkKeys) {
    try {
      const authResult = await auth();
      
      if (!authResult.userId) {
        redirect("/sign-in");
      }

      if (!authResult.orgId) {
        redirect("/dashboard");
      }

      userId = authResult.userId;
      orgId = authResult.orgId;
    } catch (error) {
      console.warn("Clerk auth failed, using demo mode:", error);
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Scheduled Reports</h1>
        <p className="text-muted-foreground mt-2">
          Automate your reports with scheduled delivery to stakeholders
        </p>
      </div>

      <Suspense fallback={<ScheduledReportsDashboardSkeleton />}>
        <ScheduledReportsDashboard organizationId={orgId} />
      </Suspense>
    </div>
  );
}