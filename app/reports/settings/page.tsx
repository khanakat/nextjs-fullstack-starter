import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ReportSettings } from "@/components/reports/report-settings";
import { ReportSettingsSkeleton } from "@/components/reports/report-settings-skeleton";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Report Settings | Reports System",
  description:
    "Configure report permissions, user roles, export settings, and data sources",
};

export default async function ReportSettingsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Report Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage permissions, user roles, export configurations, and data
          sources
        </p>
      </div>

      <Suspense fallback={<ReportSettingsSkeleton />}>
        <ReportSettings />
      </Suspense>
    </div>
  );
}
