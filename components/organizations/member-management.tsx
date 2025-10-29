"use client";

import { useState } from "react";
import {
  MoreHorizontal,
  UserPlus,
  Mail,
  Shield,
  Trash2,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  useOrganizationMembers,
  useUpdateMember,
  useRemoveMember,
  useCancelInvite,
} from "@/lib/hooks/use-organizations";
import { OrganizationRole } from "@/lib/types/organizations";
import { InviteDialog } from "./invite-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface MemberManagementProps {
  organizationId: string;
  currentUserRole: OrganizationRole;
  className?: string;
}

const roleColors = {
  owner: "bg-yellow-100 text-yellow-800 border-yellow-200",
  admin: "bg-blue-100 text-blue-800 border-blue-200",
  member: "bg-green-100 text-green-800 border-green-200",
  viewer: "bg-gray-100 text-gray-800 border-gray-200",
};

const roleIcons = {
  owner: Crown,
  admin: Shield,
  member: UserPlus,
  viewer: Mail,
};

export function MemberManagement({
  organizationId,
  currentUserRole,
  className,
}: MemberManagementProps) {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const { data, isLoading, error } = useOrganizationMembers(organizationId);
  const updateMember = useUpdateMember();
  const removeMember = useRemoveMember();
  const cancelInvite = useCancelInvite();

  const canManageMembers =
    currentUserRole === "owner" || currentUserRole === "admin";
  const canInviteMembers = canManageMembers;

  const handleUpdateRole = async (
    memberId: string,
    newRole: OrganizationRole,
  ) => {
    if (newRole === "owner") return; // Cannot change to owner via this interface

    updateMember.mutate({
      orgId: organizationId,
      memberId,
      data: { role: newRole },
    });
  };

  const handleRemoveMember = async (memberId: string) => {
    removeMember.mutate({
      orgId: organizationId,
      memberId,
    });
  };

  const handleCancelInvite = async (inviteId: string) => {
    cancelInvite.mutate({
      inviteId,
      orgId: organizationId,
    });
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-10 w-24" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <EmptyState
            title="Failed to load members"
            subtitle="There was an error loading the organization members."
            action={
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            }
          />
        </CardContent>
      </Card>
    );
  }

  const { members = [], invites = [] } = data || {};
  const hasMembers = members.length > 0 || invites.length > 0;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              Manage your organization&apos;s team members and their roles
            </CardDescription>
          </div>
          {canInviteMembers && (
            <Button onClick={() => setInviteDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Member
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!hasMembers ? (
          <EmptyState
            title="No team members yet"
            subtitle="Start building your team by inviting members to your organization."
            action={
              canInviteMembers ? (
                <Button onClick={() => setInviteDialogOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite First Member
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => {
                  const RoleIcon = roleIcons[member.role];
                  const canModifyMember =
                    canManageMembers && member.role !== "owner";

                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={member.user?.imageUrl || undefined}
                              alt={
                                member.user?.name ||
                                member.user?.email ||
                                "User"
                              }
                            />
                            <AvatarFallback>
                              {(member.user?.name || member.user?.email || "U")
                                .charAt(0)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {member.user?.name || "Unknown User"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {member.user?.email || "No email"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(roleColors[member.role])}
                        >
                          <RoleIcon className="mr-1 h-3 w-3" />
                          {member.role.charAt(0).toUpperCase() +
                            member.role.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          Active
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {canModifyMember && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {member.role !== "admin" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUpdateRole(member.id, "admin")
                                  }
                                >
                                  <Shield className="mr-2 h-4 w-4" />
                                  Make Admin
                                </DropdownMenuItem>
                              )}
                              {member.role !== "member" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUpdateRole(member.id, "member")
                                  }
                                >
                                  <UserPlus className="mr-2 h-4 w-4" />
                                  Make Member
                                </DropdownMenuItem>
                              )}
                              {member.role !== "viewer" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUpdateRole(member.id, "viewer")
                                  }
                                >
                                  <Mail className="mr-2 h-4 w-4" />
                                  Make Viewer
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleRemoveMember(member.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove Member
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}

                {invites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {invite.email.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">Pending Invite</div>
                          <div className="text-sm text-muted-foreground">
                            {invite.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(roleColors[invite.role])}
                      >
                        {invite.role.charAt(0).toUpperCase() +
                          invite.role.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-yellow-50 text-yellow-700 border-yellow-200"
                      >
                        Pending
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {canManageMembers && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleCancelInvite(invite.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Cancel Invite
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <InviteDialog
        organizationId={organizationId}
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
      />
    </Card>
  );
}
