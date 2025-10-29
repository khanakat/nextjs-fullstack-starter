// ============================================================================
// ORGANIZATION TYPES
// ============================================================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  website?: string;
  settings: string; // JSON string
  plan: OrganizationPlan;
  maxMembers: number;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;

  // Relations
  createdBy?: {
    id: string;
    name?: string;
    email: string;
    imageUrl?: string;
  };
  members?: OrganizationMember[];
  invites?: OrganizationInvite[];
  _count?: {
    members: number;
    invites: number;
    reports: number;
  };
}

export interface OrganizationMember {
  id: string;
  role: OrganizationRole;
  permissions: string; // JSON string
  joinedAt: Date;
  updatedAt: Date;
  userId: string;
  organizationId: string;

  // Relations
  user?: {
    id: string;
    name?: string;
    email: string;
    imageUrl?: string;
    username?: string;
  };
  organization?: Organization;
}

export interface OrganizationInvite {
  id: string;
  email: string;
  role: OrganizationRole;
  token: string;
  status: InviteStatus;
  createdAt: Date;
  expiresAt: Date;
  acceptedAt?: Date;
  invitedById: string;
  organizationId: string;

  // Relations
  invitedBy?: {
    id: string;
    name?: string;
    email: string;
    imageUrl?: string;
  };
  organization?: Organization;
}

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

export type OrganizationPlan = "free" | "pro" | "enterprise";

export type OrganizationRole = "owner" | "admin" | "member" | "viewer";

export const OrganizationRole = {
  OWNER: "owner" as const,
  ADMIN: "admin" as const,
  MEMBER: "member" as const,
  VIEWER: "viewer" as const,
} as const;

export type InviteStatus = "pending" | "accepted" | "expired" | "revoked";

export const ORGANIZATION_ROLES: Record<
  OrganizationRole,
  {
    label: string;
    description: string;
    permissions: string[];
  }
> = {
  owner: {
    label: "Owner",
    description: "Full access to organization settings and billing",
    permissions: ["*"],
  },
  admin: {
    label: "Admin",
    description: "Manage members and organization settings",
    permissions: [
      "organization:read",
      "organization:update",
      "members:read",
      "members:create",
      "members:update",
      "members:delete",
      "invites:read",
      "invites:create",
      "invites:delete",
      "reports:read",
      "reports:create",
      "reports:update",
      "reports:delete",
    ],
  },
  member: {
    label: "Member",
    description: "Create and manage own content",
    permissions: [
      "organization:read",
      "members:read",
      "reports:read",
      "reports:create",
      "reports:update:own",
      "reports:delete:own",
    ],
  },
  viewer: {
    label: "Viewer",
    description: "View organization content only",
    permissions: ["organization:read", "members:read", "reports:read"],
  },
};

export const ORGANIZATION_PLANS: Record<
  OrganizationPlan,
  {
    label: string;
    maxMembers: number;
    features: string[];
    price?: number;
  }
> = {
  free: {
    label: "Free",
    maxMembers: 5,
    features: ["Basic reports", "Up to 5 members", "Email support"],
  },
  pro: {
    label: "Pro",
    maxMembers: 25,
    features: [
      "Advanced reports",
      "Up to 25 members",
      "Priority support",
      "Custom branding",
    ],
    price: 29,
  },
  enterprise: {
    label: "Enterprise",
    maxMembers: -1, // Unlimited
    features: [
      "All features",
      "Unlimited members",
      "Dedicated support",
      "SSO",
      "Advanced security",
    ],
    price: 99,
  },
};

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateOrganizationRequest {
  name: string;
  slug: string;
  description?: string;
  website?: string;
}

export interface UpdateOrganizationRequest {
  name?: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  website?: string;
  settings?: Record<string, any>;
}

export interface InviteMemberRequest {
  email: string;
  role: OrganizationRole;
}

export interface UpdateMemberRequest {
  role: OrganizationRole;
  permissions?: Record<string, any>;
}

export interface OrganizationStats {
  totalMembers: number;
  totalInvites: number;
  totalReports: number;
  planUsage: {
    membersUsed: number;
    membersLimit: number;
    reportsUsed: number;
    storageUsed: number;
  };
}

// ============================================================================
// CONTEXT TYPES
// ============================================================================

export interface OrganizationContext {
  currentOrganization: Organization | null;
  organizations: Organization[];
  isLoading: boolean;
  switchOrganization: (organizationId: string) => Promise<void>;
  createOrganization: (
    data: CreateOrganizationRequest,
  ) => Promise<Organization>;
  updateOrganization: (
    id: string,
    data: UpdateOrganizationRequest,
  ) => Promise<Organization>;
  deleteOrganization: (id: string) => Promise<void>;
  leaveOrganization: (id: string) => Promise<void>;
}

export interface MembershipContext {
  members: OrganizationMember[];
  invites: OrganizationInvite[];
  isLoading: boolean;
  inviteMember: (data: InviteMemberRequest) => Promise<OrganizationInvite>;
  updateMember: (
    memberId: string,
    data: UpdateMemberRequest,
  ) => Promise<OrganizationMember>;
  removeMember: (memberId: string) => Promise<void>;
  cancelInvite: (inviteId: string) => Promise<void>;
  resendInvite: (inviteId: string) => Promise<OrganizationInvite>;
  acceptInvite: (token: string) => Promise<OrganizationMember>;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface OrganizationPermissions {
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canManageMembers: boolean;
  canManageInvites: boolean;
  canManageReports: boolean;
  canManageBilling: boolean;
}

export interface OrganizationSettings {
  branding?: {
    primaryColor?: string;
    logo?: string;
  };
  features?: {
    allowPublicReports?: boolean;
    requireApprovalForReports?: boolean;
  };
  notifications?: {
    emailNotifications?: boolean;
    slackWebhook?: string;
  };
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface OrganizationListResponse {
  organizations: Organization[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface MemberListResponse {
  members: OrganizationMember[];
  invites: OrganizationInvite[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface OrganizationStatsResponse {
  stats: OrganizationStats;
  usage: {
    current: number;
    limit: number;
    percentage: number;
  };
}
