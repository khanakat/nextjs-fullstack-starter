"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Building2, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useOrganizationInvite,
  useAcceptInvite,
  useDeclineInvite,
} from "@/lib/hooks/use-organizations";
import { OrganizationRole } from "@/lib/types/organizations";
import { toast } from "sonner";
import Link from "next/link";

export default function OrganizationInvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: invite, isLoading, error } = useOrganizationInvite(token);
  const acceptInvite = useAcceptInvite();
  const declineInvite = useDeclineInvite();

  const handleAccept = async () => {
    if (!invite) return;

    setIsProcessing(true);
    try {
      await acceptInvite.mutateAsync(token);
      toast.success(
        `Welcome to ${invite.organization?.name || "the organization"}!`,
      );
      router.push(`/organizations/${invite.organization?.id}`);
    } catch (error) {
      toast.error("Failed to accept invitation");
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!invite) return;

    setIsProcessing(true);
    try {
      await declineInvite.mutateAsync(token);
      toast.success("Invitation declined");
      router.push("/organizations");
    } catch (error) {
      toast.error("Failed to decline invitation");
      setIsProcessing(false);
    }
  };

  const getRoleColor = (role: OrganizationRole) => {
    switch (role) {
      case OrganizationRole.OWNER:
        return "default";
      case OrganizationRole.ADMIN:
        return "secondary";
      case OrganizationRole.MEMBER:
        return "outline";
      default:
        return "outline";
    }
  };

  const getRoleDescription = (role: OrganizationRole) => {
    switch (role) {
      case OrganizationRole.OWNER:
        return "Full access to all organization features and settings";
      case OrganizationRole.ADMIN:
        return "Manage members, settings, and most organization features";
      case OrganizationRole.MEMBER:
        return "Access to organization resources with limited permissions";
      default:
        return "Basic access to organization resources";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Loading invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <X className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Invalid Invitation</h3>
            <p className="text-muted-foreground mb-6">
              This invitation link is invalid, expired, or has already been
              used.
            </p>
            <Link href="/organizations">
              <Button>Go to Organizations</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invite.status !== "pending") {
    const statusMessage =
      invite.status === "accepted"
        ? "This invitation has already been accepted."
        : "This invitation has been declined.";

    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Invitation Already Processed
            </h3>
            <p className="text-muted-foreground mb-6">{statusMessage}</p>
            <Link href="/organizations">
              <Button>Go to Organizations</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Organization Invitation</CardTitle>
          <CardDescription>
            You've been invited to join an organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Organization Info */}
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold">
              {invite.organization?.name}
            </h3>
            {invite.organization?.description && (
              <p className="text-muted-foreground">
                {invite.organization.description}
              </p>
            )}
            {invite.organization?.website && (
              <a
                href={invite.organization.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                {invite.organization.website}
              </a>
            )}
          </div>

          {/* Invitation Details */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Invited by:</span>
              <span className="text-sm">
                {invite.invitedBy?.name || invite.invitedBy?.email}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Role:</span>
              <Badge variant={getRoleColor(invite.role)}>
                {invite.role.toLowerCase()}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Invited:</span>
              <span className="text-sm">
                {new Date(invite.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Role Description */}
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
            <h4 className="font-medium mb-2">Role Permissions</h4>
            <p className="text-sm text-muted-foreground">
              {getRoleDescription(invite.role)}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleAccept}
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Accept Invitation
            </Button>
            <Button
              variant="outline"
              onClick={handleDecline}
              disabled={isProcessing}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Decline
            </Button>
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              By accepting this invitation, you agree to join{" "}
              {invite.organization?.name}
              and will have access to organization resources based on your
              assigned role.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
