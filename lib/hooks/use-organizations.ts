"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Organization,
  OrganizationMember,
  OrganizationInvite,
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
  InviteMemberRequest,
  UpdateMemberRequest,
  // OrganizationWithMembers, // Type doesn't exist in organizations types
  OrganizationContext,
} from "@/lib/types/organizations";

// Query keys
const QUERY_KEYS = {
  organizations: ["organizations"] as const,
  organization: (id: string) => ["organizations", id] as const,
  members: (orgId: string) => ["organizations", orgId, "members"] as const,
  invites: (orgId: string) => ["organizations", orgId, "invites"] as const,
};

// API functions
async function fetchOrganizations(): Promise<{
  organizations: (Organization & { role: string })[];
}> {
  const response = await fetch("/api/organizations");
  if (!response.ok) {
    throw new Error("Failed to fetch organizations");
  }
  return response.json();
}

async function fetchOrganization(
  id: string,
): Promise<Organization & { members: OrganizationMember[] }> {
  const response = await fetch(`/api/organizations/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch organization");
  }
  return response.json();
}

async function createOrganization(
  data: CreateOrganizationRequest,
): Promise<Organization> {
  const response = await fetch("/api/organizations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create organization");
  }
  return response.json();
}

async function updateOrganization(
  id: string,
  data: UpdateOrganizationRequest,
): Promise<Organization> {
  const response = await fetch(`/api/organizations/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update organization");
  }
  return response.json();
}

async function deleteOrganization(id: string): Promise<void> {
  const response = await fetch(`/api/organizations/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete organization");
  }
}

async function fetchMembers(orgId: string): Promise<{
  members: OrganizationMember[];
  invites: OrganizationInvite[];
}> {
  const response = await fetch(`/api/organizations/${orgId}/members`);
  if (!response.ok) {
    throw new Error("Failed to fetch members");
  }
  return response.json();
}

async function inviteMember(
  orgId: string,
  data: InviteMemberRequest,
): Promise<OrganizationInvite> {
  const response = await fetch(`/api/organizations/${orgId}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to invite member");
  }
  return response.json();
}

async function updateMember(
  orgId: string,
  memberId: string,
  data: UpdateMemberRequest,
): Promise<OrganizationMember> {
  const response = await fetch(
    `/api/organizations/${orgId}/members/${memberId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update member");
  }
  return response.json();
}

async function removeMember(orgId: string, memberId: string): Promise<void> {
  const response = await fetch(
    `/api/organizations/${orgId}/members/${memberId}`,
    {
      method: "DELETE",
    },
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to remove member");
  }
}

async function acceptInvite(inviteId: string): Promise<OrganizationMember> {
  const response = await fetch(`/api/organizations/invites/${inviteId}`, {
    method: "POST",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to accept invite");
  }
  return response.json();
}

async function cancelInvite(inviteId: string): Promise<void> {
  const response = await fetch(`/api/organizations/invites/${inviteId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to cancel invite");
  }
}

async function fetchInvite(token: string): Promise<OrganizationInvite> {
  const response = await fetch(`/api/organizations/invites/${token}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch invite");
  }
  return response.json();
}

async function declineInvite(inviteId: string): Promise<void> {
  const response = await fetch(
    `/api/organizations/invites/${inviteId}/decline`,
    {
      method: "POST",
    },
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to decline invite");
  }
}

// Custom hooks
export function useOrganizations() {
  return useQuery({
    queryKey: QUERY_KEYS.organizations,
    queryFn: fetchOrganizations,
    select: (data) => data.organizations,
  });
}

export function useOrganization(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.organization(id),
    queryFn: () => fetchOrganization(id),
    enabled: !!id,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOrganization,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.organizations });
      toast.success("Organization created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateOrganizationRequest;
    }) => updateOrganization(id, data),
    onSuccess: (updatedOrg) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.organizations });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.organization(updatedOrg.id),
      });
      toast.success("Organization updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteOrganization,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.organizations });
      toast.success("Organization deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useOrganizationMembers(orgId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.members(orgId),
    queryFn: () => fetchMembers(orgId),
    enabled: !!orgId,
  });
}

export function useOrganizationMembership(orgId: string) {
  return useQuery({
    queryKey: ["organization-membership", orgId],
    queryFn: async () => {
      const response = await fetch(`/api/organizations/${orgId}/membership`);
      if (!response.ok) {
        throw new Error("Failed to fetch membership");
      }
      return response.json();
    },
    enabled: !!orgId,
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orgId,
      data,
    }: {
      orgId: string;
      data: InviteMemberRequest;
    }) => inviteMember(orgId, data),
    onSuccess: (_, { orgId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.members(orgId) });
      toast.success("Member invited successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orgId,
      memberId,
      data,
    }: {
      orgId: string;
      memberId: string;
      data: UpdateMemberRequest;
    }) => updateMember(orgId, memberId, data),
    onSuccess: (_, { orgId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.members(orgId) });
      toast.success("Member updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, memberId }: { orgId: string; memberId: string }) =>
      removeMember(orgId, memberId),
    onSuccess: (_, { orgId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.members(orgId) });
      toast.success("Member removed successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useAcceptInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: acceptInvite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.organizations });
      toast.success("Invite accepted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useCancelInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ inviteId, orgId }: { inviteId: string; orgId?: string }) => {
      if (orgId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.members(orgId) });
      }
      return cancelInvite(inviteId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.organizations });
      toast.success("Invite cancelled successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useOrganizationInvite(token: string) {
  return useQuery({
    queryKey: ["organizationInvite", token],
    queryFn: () => fetchInvite(token),
    enabled: !!token,
  });
}

export function useDeclineInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: declineInvite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.organizations });
      toast.success("Invite declined successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Organization context hook
export function useOrganizationContext(): OrganizationContext {
  const [currentOrganization, setCurrentOrganization] =
    useState<Organization | null>(null);
  const { data: organizations } = useOrganizations();

  useEffect(() => {
    // Set default organization from localStorage or first available
    if (organizations && organizations.length > 0 && !currentOrganization) {
      const savedOrgId = localStorage.getItem("currentOrganizationId");
      const defaultOrg = savedOrgId
        ? organizations.find((org) => org.id === savedOrgId)
        : organizations[0];

      if (defaultOrg) {
        setCurrentOrganization(defaultOrg);
      }
    }
  }, [organizations, currentOrganization]);

  const switchOrganization = async (organizationId: string): Promise<void> => {
    const organization = organizations?.find(
      (org) => org.id === organizationId,
    );
    if (organization) {
      setCurrentOrganization(organization);
      localStorage.setItem("currentOrganizationId", organization.id);
    }
  };

  return {
    currentOrganization,
    organizations: organizations || [],
    switchOrganization,
    isLoading: !organizations,
    createOrganization: async (data: CreateOrganizationRequest) => {
      return await createOrganization(data);
    },
    updateOrganization: async (id: string, data: UpdateOrganizationRequest) => {
      return await updateOrganization(id, data);
    },
    deleteOrganization: async (id: string) => {
      await deleteOrganization(id);
    },
    leaveOrganization: async (id: string) => {
      // Implementation for leaving organization
      await deleteOrganization(id);
    },
  };
}
