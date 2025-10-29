"use client";

import { useParams } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MemberManagement } from "@/components/organizations/member-management";
import {
  useOrganization,
  useOrganizationMembership,
} from "@/lib/hooks/use-organizations";
import Link from "next/link";

export default function OrganizationMembersPage() {
  const params = useParams();
  const organizationId = params?.id as string;
  const { data: organization, isLoading } = useOrganization(organizationId);
  const { data: membership } = useOrganizationMembership(organizationId);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-10 w-10 bg-muted rounded animate-pulse"></div>
          <div>
            <div className="h-8 bg-muted rounded w-48 mb-2 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
          </div>
        </div>
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted rounded w-32 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-48 animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 border rounded"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-muted rounded-full animate-pulse"></div>
                    <div>
                      <div className="h-4 bg-muted rounded w-24 mb-1 animate-pulse"></div>
                      <div className="h-3 bg-muted rounded w-32 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="h-6 bg-muted rounded w-16 animate-pulse"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="container mx-auto py-8">
        <Card className="text-center py-12">
          <CardContent>
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Organization not found
            </h3>
            <p className="text-muted-foreground mb-4">
              The organization you're looking for doesn't exist or you don't
              have access to it.
            </p>
            <Link href="/organizations">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Organizations
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/organizations">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{organization.name}</h1>
            <p className="text-muted-foreground">
              Manage team members and invitations
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Manage who has access to this organization and their roles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MemberManagement
            organizationId={organizationId}
            currentUserRole={membership?.role || "viewer"}
          />
        </CardContent>
      </Card>
    </div>
  );
}
