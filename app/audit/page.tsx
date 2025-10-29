import { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuditDashboard } from "@/components/audit/audit-dashboard";
import { hasPermission } from "@/lib/permissions";
import { getCurrentAuthenticatedUser } from "@/lib/auth-helpers";

export const metadata: Metadata = {
  title: "Audit Dashboard",
  description: "Monitor and analyze system activity and security events",
};

export default async function AuditPage() {
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
      <AuditDashboard />
    </div>
  );
}
