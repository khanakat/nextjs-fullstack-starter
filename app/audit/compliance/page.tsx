import { Metadata } from "next";
import { redirect } from "next/navigation";
import { ComplianceDashboard } from "@/components/audit/compliance-dashboard";
import { hasPermission } from "@/lib/permissions";
import { getCurrentAuthenticatedUser } from "@/lib/auth-helpers";

export const metadata: Metadata = {
  title: "Compliance Dashboard",
  description: "Monitor compliance status and regulatory requirements",
};

export default async function CompliancePage() {
  const user = await getCurrentAuthenticatedUser();

  if (!user) {
    redirect("/auth/signin");
  }

  // Check if user has permission to view audit logs
  const canViewAuditLogs = hasPermission(user, "read", "audit");

  if (!canViewAuditLogs) {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto py-6">
      <ComplianceDashboard organizationId={"org-id"} />
    </div>
  );
}
