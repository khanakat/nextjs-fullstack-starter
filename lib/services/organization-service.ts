import { db } from "@/lib/db";
import { promises as fs } from "fs";
import path from "path";
import {
  Organization,
  OrganizationMember,
  OrganizationInvite,
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
  InviteMemberRequest,
  UpdateMemberRequest,
  OrganizationStats,
  OrganizationRole,
  InviteStatus,
} from "@/lib/types/organizations";
import { generateSlug } from "@/lib/utils";
import { EmailService } from "@/lib/services/email-service";
import crypto from "crypto";

// ============================================================================
// ORGANIZATION SERVICE
// ============================================================================

export class OrganizationService {
  /**
   * Get all organizations for a user with their role
   */
  static async getUserOrganizations(
    userId: string,
  ): Promise<(Organization & { role: string })[]> {
    const organizations = await db.organization.findMany({
      where: {
        OR: [
          { createdById: userId },
          {
            members: {
              some: { userId },
            },
          },
        ],
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true,
          },
        },
        members: {
          where: { userId },
          select: { role: true },
        },
        _count: {
          select: {
            members: true,
            invites: true,
            reports: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return organizations.map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      description: org.description || undefined,
      imageUrl: org.imageUrl || undefined,
      website: org.website || undefined,
      settings: org.settings,
      plan: org.plan as "free" | "pro" | "enterprise",
      maxMembers: org.maxMembers,
      createdAt: new Date(org.createdAt),
      updatedAt: new Date(org.updatedAt),
      createdById: org.createdById,
      createdBy: org.createdBy
        ? {
            id: org.createdBy.id,
            name: org.createdBy.name || undefined,
            email: org.createdBy.email,
            imageUrl: org.createdBy.imageUrl || undefined,
          }
        : undefined,
      _count: org._count,
      role:
        org.createdById === userId ? "owner" : org.members[0]?.role || "member",
    }));
  }

  /**
   * Get organization by ID with member check
   */
  static async getOrganization(
    id: string,
    userId: string,
  ): Promise<Organization | null> {
    const organization = await db.organization.findFirst({
      where: {
        id,
        OR: [
          { createdById: userId },
          {
            members: {
              some: { userId },
            },
          },
        ],
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                imageUrl: true,
                username: true,
              },
            },
          },
          orderBy: {
            joinedAt: "asc",
          },
        },
        invites: {
          where: {
            status: "pending",
            expiresAt: {
              gt: new Date(),
            },
          },
          include: {
            invitedBy: {
              select: {
                id: true,
                name: true,
                email: true,
                imageUrl: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            members: true,
            invites: true,
            reports: true,
          },
        },
      },
    });

    if (!organization) return null;

    return {
      ...organization,
      description: organization.description || undefined,
      imageUrl: organization.imageUrl || undefined,
      website: organization.website || undefined,
      plan: organization.plan as "free" | "pro" | "enterprise",
      createdBy: organization.createdBy
        ? {
            ...organization.createdBy,
            name: organization.createdBy.name || undefined,
            imageUrl: organization.createdBy.imageUrl || undefined,
          }
        : undefined,
      createdAt: new Date(organization.createdAt),
      updatedAt: new Date(organization.updatedAt),
      members: organization.members.map((member) => ({
        ...member,
        role: member.role as OrganizationRole,
        joinedAt: new Date(member.joinedAt),
        updatedAt: new Date(member.updatedAt),
        user: member.user
          ? {
              ...member.user,
              name: member.user.name || undefined,
              imageUrl: member.user.imageUrl || undefined,
              username: member.user.username || undefined,
            }
          : undefined,
      })),
      invites: organization.invites.map((invite) => ({
        ...invite,
        role: invite.role as OrganizationRole,
        status: invite.status as InviteStatus,
        createdAt: new Date(invite.createdAt),
        expiresAt: new Date(invite.expiresAt),
        acceptedAt: invite.acceptedAt ? new Date(invite.acceptedAt) : undefined,
        invitedBy: invite.invitedBy
          ? {
              ...invite.invitedBy,
              name: invite.invitedBy.name || undefined,
              imageUrl: invite.invitedBy.imageUrl || undefined,
            }
          : undefined,
      })),
    };
  }

  /**
   * Create a new organization
   */
  static async createOrganization(
    userId: string,
    data: CreateOrganizationRequest,
  ): Promise<Organization> {
    // Generate unique slug if not provided or already exists
    let slug = data.slug || generateSlug(data.name);
    const existingSlug = await db.organization.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    const organization = await db.organization.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        website: data.website,
        createdById: userId,
        members: {
          create: {
            userId,
            role: "owner",
          },
        },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true,
          },
        },
        _count: {
          select: {
            members: true,
            invites: true,
            reports: true,
          },
        },
      },
    });

    return {
      ...organization,
      description: organization.description || undefined,
      imageUrl: organization.imageUrl || undefined,
      website: organization.website || undefined,
      plan: organization.plan as "free" | "pro" | "enterprise",
      createdBy: organization.createdBy
        ? {
            ...organization.createdBy,
            name: organization.createdBy.name || undefined,
            imageUrl: organization.createdBy.imageUrl || undefined,
          }
        : undefined,
      createdAt: new Date(organization.createdAt),
      updatedAt: new Date(organization.updatedAt),
    };
  }

  /**
   * Update organization
   */
  static async updateOrganization(
    id: string,
    userId: string,
    data: UpdateOrganizationRequest,
  ): Promise<Organization> {
    // Check if user has permission to update
    const membership = await this.getUserMembership(id, userId);
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      throw new Error("Insufficient permissions to update organization");
    }

    // Handle slug update
    let updateData: any = { ...data };
    if (data.slug) {
      const existingSlug = await db.organization.findFirst({
        where: {
          slug: data.slug,
          id: { not: id },
        },
      });

      if (existingSlug) {
        throw new Error("Slug already exists");
      }
    }

    // Convert settings object to JSON string if provided
    if (data.settings) {
      updateData.settings = JSON.stringify(data.settings);
    }

    const organization = await db.organization.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true,
          },
        },
        _count: {
          select: {
            members: true,
            invites: true,
            reports: true,
          },
        },
      },
    });

    return {
      ...organization,
      description: organization.description || undefined,
      imageUrl: organization.imageUrl || undefined,
      website: organization.website || undefined,
      plan: organization.plan as "free" | "pro" | "enterprise",
      createdBy: organization.createdBy
        ? {
            ...organization.createdBy,
            name: organization.createdBy.name || undefined,
            imageUrl: organization.createdBy.imageUrl || undefined,
          }
        : undefined,
      createdAt: new Date(organization.createdAt),
      updatedAt: new Date(organization.updatedAt),
    };
  }

  /**
   * Delete organization
   */
  static async deleteOrganization(id: string, userId: string): Promise<void> {
    // Only owner can delete organization
    const membership = await this.getUserMembership(id, userId);
    if (!membership || membership.role !== "owner") {
      throw new Error("Only organization owner can delete the organization");
    }

    await db.organization.delete({
      where: { id },
    });
  }

  /**
   * Get organization statistics
   */
  static async getOrganizationStats(
    id: string,
    userId: string,
  ): Promise<OrganizationStats> {
    // Check if user has access
    const membership = await this.getUserMembership(id, userId);
    if (!membership) {
      throw new Error("Access denied");
    }

    const organization = await db.organization.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            members: true,
            invites: true,
            reports: true,
          },
        },
      },
    });

    if (!organization) {
      throw new Error("Organization not found");
    }

    return {
      totalMembers: organization._count.members,
      totalInvites: organization._count.invites,
      totalReports: organization._count.reports,
      planUsage: {
        membersUsed: organization._count.members,
        membersLimit: organization.maxMembers,
        reportsUsed: organization._count.reports,
        storageUsed: await this.calculateStorageUsed(id),
      },
    };
  }

  private static async calculateStorageUsed(
    organizationId: string,
  ): Promise<number> {
    // Estimate storage from files under storage/exports/<orgId> and storage/uploads/<orgId>
    const baseDirs = [
      path.join(process.cwd(), "storage", "exports", organizationId),
      path.join(process.cwd(), "storage", "uploads", organizationId),
    ];

    let total = 0;

    for (const dir of baseDirs) {
      total += await this.getDirectorySizeSafe(dir);
    }

    return total; // bytes
  }

  private static async getDirectorySizeSafe(dir: string): Promise<number> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      let size = 0;
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          size += await this.getDirectorySizeSafe(fullPath);
        } else if (entry.isFile()) {
          const stats = await fs.stat(fullPath);
          size += stats.size;
        }
      }
      return size;
    } catch (error) {
      // Directory may not exist yet; treat as zero
      return 0;
    }
  }

  /**
   * Get user's membership in organization
   */
  static async getUserMembership(
    organizationId: string,
    userId: string,
  ): Promise<OrganizationMember | null> {
    const membership = await db.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true,
            username: true,
          },
        },
        organization: true,
      },
    });

    if (!membership) return null;

    return {
      ...membership,
      role: membership.role as OrganizationRole,
      user: {
        ...membership.user,
        name: membership.user.name || undefined,
        imageUrl: membership.user.imageUrl || undefined,
        username: membership.user.username || undefined,
      },
      organization: {
        ...membership.organization,
        description: membership.organization.description || undefined,
        imageUrl: membership.organization.imageUrl || undefined,
        website: membership.organization.website || undefined,
        plan: membership.organization.plan as "free" | "pro" | "enterprise",
      },
      joinedAt: new Date(membership.joinedAt),
      updatedAt: new Date(membership.updatedAt),
    };
  }

  /**
   * Leave organization
   */
  static async leaveOrganization(
    organizationId: string,
    userId: string,
  ): Promise<void> {
    const membership = await this.getUserMembership(organizationId, userId);
    if (!membership) {
      throw new Error("You are not a member of this organization");
    }

    if (membership.role === "owner") {
      // Check if there are other owners
      const otherOwners = await db.organizationMember.count({
        where: {
          organizationId,
          role: "owner",
          userId: { not: userId },
        },
      });

      if (otherOwners === 0) {
        throw new Error(
          "Cannot leave organization as the only owner. Transfer ownership first.",
        );
      }
    }

    await db.organizationMember.delete({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });
  }
}

// ============================================================================
// MEMBERSHIP SERVICE
// ============================================================================

export class MembershipService {
  /**
   * Get organization members
   */
  static async getOrganizationMembers(
    organizationId: string,
    userId: string,
  ): Promise<{ members: OrganizationMember[]; invites: OrganizationInvite[] }> {
    // Check if user has access
    const membership = await OrganizationService.getUserMembership(
      organizationId,
      userId,
    );
    if (!membership) {
      throw new Error("Access denied");
    }

    const [members, invites] = await Promise.all([
      db.organizationMember.findMany({
        where: { organizationId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              imageUrl: true,
              username: true,
            },
          },
        },
        orderBy: {
          joinedAt: "asc",
        },
      }),
      db.organizationInvite.findMany({
        where: {
          organizationId,
          status: "pending",
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          invitedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              imageUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    return {
      members: members.map((member) => ({
        ...member,
        role: member.role as OrganizationRole,
        user: {
          ...member.user,
          name: member.user.name || undefined,
          imageUrl: member.user.imageUrl || undefined,
          username: member.user.username || undefined,
        },
        joinedAt: new Date(member.joinedAt),
        updatedAt: new Date(member.updatedAt),
      })),
      invites: invites.map((invite) => ({
        ...invite,
        role: invite.role as OrganizationRole,
        status: invite.status as InviteStatus,
        invitedBy: {
          ...invite.invitedBy,
          name: invite.invitedBy.name || undefined,
          imageUrl: invite.invitedBy.imageUrl || undefined,
        },
        createdAt: new Date(invite.createdAt),
        expiresAt: new Date(invite.expiresAt),
        acceptedAt: invite.acceptedAt ? new Date(invite.acceptedAt) : undefined,
      })),
    };
  }

  /**
   * Invite member to organization
   */
  static async inviteMember(
    organizationId: string,
    userId: string,
    data: InviteMemberRequest,
  ): Promise<OrganizationInvite> {
    // Check if user has permission to invite
    const membership = await OrganizationService.getUserMembership(
      organizationId,
      userId,
    );
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      throw new Error("Insufficient permissions to invite members");
    }

    // Check if user is already a member
    const existingMember = await db.organizationMember.findFirst({
      where: {
        organizationId,
        user: { email: data.email },
      },
    });

    if (existingMember) {
      throw new Error("User is already a member of this organization");
    }

    // Check if there's already a pending invite
    const existingInvite = await db.organizationInvite.findFirst({
      where: {
        organizationId,
        email: data.email,
        status: "pending",
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (existingInvite) {
      throw new Error("There is already a pending invite for this email");
    }

    // Check organization member limits
    const organization = await db.organization.findUnique({
      where: { id: organizationId },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    if (
      organization &&
      organization.maxMembers > 0 &&
      organization._count.members >= organization.maxMembers
    ) {
      throw new Error("Organization has reached its member limit");
    }

    // Generate invite token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const invite = await db.organizationInvite.create({
      data: {
        email: data.email,
        role: data.role,
        token,
        expiresAt,
        organizationId,
        invitedById: userId,
      },
      include: {
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true,
          },
        },
        organization: true,
      },
    });

    // ✅ Fixed: Send invitation email
    try {
      await EmailService.sendInvitationEmail({
        inviteeEmail: invite.email,
        inviteeName: invite.email.split("@")[0], // Use email prefix as name fallback
        inviterName: invite.invitedBy.name || "Team Member",
        organizationName: invite.organization.name,
        inviteToken: invite.token,
        role: invite.role,
        expiresAt: new Date(invite.expiresAt),
      });
    } catch (emailError) {
      // Log error but don't fail the resend
      console.error("Failed to resend invitation email:", emailError);
    }

    return {
      ...invite,
      role: invite.role as OrganizationRole,
      status: invite.status as InviteStatus,
      invitedBy: {
        ...invite.invitedBy,
        name: invite.invitedBy.name || undefined,
        imageUrl: invite.invitedBy.imageUrl || undefined,
      },
      organization: {
        ...invite.organization,
        description: invite.organization.description || undefined,
        imageUrl: invite.organization.imageUrl || undefined,
        website: invite.organization.website || undefined,
        plan: invite.organization.plan as "free" | "pro" | "enterprise",
      },
      createdAt: new Date(invite.createdAt),
      expiresAt: new Date(invite.expiresAt),
      acceptedAt: invite.acceptedAt ? new Date(invite.acceptedAt) : undefined,
    };
  }

  /**
   * Update member role/permissions
   */
  static async updateMember(
    organizationId: string,
    memberId: string,
    userId: string,
    data: UpdateMemberRequest,
  ): Promise<OrganizationMember> {
    // Check if user has permission to update members
    const membership = await OrganizationService.getUserMembership(
      organizationId,
      userId,
    );
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      throw new Error("Insufficient permissions to update members");
    }

    // Get the member being updated
    const targetMember = await db.organizationMember.findUnique({
      where: { id: memberId },
      include: { user: true },
    });

    if (!targetMember || targetMember.organizationId !== organizationId) {
      throw new Error("Member not found");
    }

    // Prevent non-owners from updating owners
    if (targetMember.role === "owner" && membership.role !== "owner") {
      throw new Error("Only owners can update other owners");
    }

    // Prevent owners from demoting themselves if they're the only owner
    if (
      targetMember.userId === userId &&
      targetMember.role === "owner" &&
      data.role !== "owner"
    ) {
      const otherOwners = await db.organizationMember.count({
        where: {
          organizationId,
          role: "owner",
          userId: { not: userId },
        },
      });

      if (otherOwners === 0) {
        throw new Error("Cannot demote yourself as the only owner");
      }
    }

    const updatedMember = await db.organizationMember.update({
      where: { id: memberId },
      data: {
        role: data.role,
        permissions: data.permissions
          ? JSON.stringify(data.permissions)
          : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true,
            username: true,
          },
        },
      },
    });

    return {
      ...updatedMember,
      role: updatedMember.role as OrganizationRole,
      user: {
        ...updatedMember.user,
        name: updatedMember.user.name || undefined,
        imageUrl: updatedMember.user.imageUrl || undefined,
        username: updatedMember.user.username || undefined,
      },
      joinedAt: new Date(updatedMember.joinedAt),
      updatedAt: new Date(updatedMember.updatedAt),
    };
  }

  /**
   * Remove member from organization
   */
  static async removeMember(
    organizationId: string,
    memberId: string,
    userId: string,
  ): Promise<void> {
    // Check if user has permission to remove members
    const membership = await OrganizationService.getUserMembership(
      organizationId,
      userId,
    );
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      throw new Error("Insufficient permissions to remove members");
    }

    // Get the member being removed
    const targetMember = await db.organizationMember.findUnique({
      where: { id: memberId },
    });

    if (!targetMember || targetMember.organizationId !== organizationId) {
      throw new Error("Member not found");
    }

    // Prevent non-owners from removing owners
    if (targetMember.role === "owner" && membership.role !== "owner") {
      throw new Error("Only owners can remove other owners");
    }

    // Prevent removing the last owner
    if (targetMember.role === "owner") {
      const otherOwners = await db.organizationMember.count({
        where: {
          organizationId,
          role: "owner",
          id: { not: memberId },
        },
      });

      if (otherOwners === 0) {
        throw new Error("Cannot remove the last owner");
      }
    }

    await db.organizationMember.delete({
      where: { id: memberId },
    });
  }

  /**
   * Cancel organization invite
   */
  static async cancelInvite(
    organizationId: string,
    inviteId: string,
    userId: string,
  ): Promise<void> {
    // Check if user has permission to cancel invites
    const membership = await OrganizationService.getUserMembership(
      organizationId,
      userId,
    );
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      throw new Error("Insufficient permissions to cancel invites");
    }

    const invite = await db.organizationInvite.findUnique({
      where: { id: inviteId },
    });

    if (!invite || invite.organizationId !== organizationId) {
      throw new Error("Invite not found");
    }

    await db.organizationInvite.update({
      where: { id: inviteId },
      data: { status: "revoked" },
    });
  }

  /**
   * Resend organization invite
   */
  static async resendInvite(
    organizationId: string,
    inviteId: string,
    userId: string,
  ): Promise<OrganizationInvite> {
    // Check if user has permission to resend invites
    const membership = await OrganizationService.getUserMembership(
      organizationId,
      userId,
    );
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      throw new Error("Insufficient permissions to resend invites");
    }

    const invite = await db.organizationInvite.findUnique({
      where: { id: inviteId },
      include: {
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true,
          },
        },
        organization: true,
      },
    });

    if (!invite || invite.organizationId !== organizationId) {
      throw new Error("Invite not found");
    }

    if (invite.status !== "pending") {
      throw new Error("Can only resend pending invites");
    }

    // Extend expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const updatedInvite = await db.organizationInvite.update({
      where: { id: inviteId },
      data: { expiresAt },
      include: {
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true,
          },
        },
        organization: true,
      },
    });

    // ✅ Fixed: Send invitation email
    try {
      await EmailService.sendInvitationEmail({
        inviteeEmail: updatedInvite.email,
        inviteeName: updatedInvite.email.split("@")[0], // Use email prefix as name fallback
        inviterName: updatedInvite.invitedBy.name || "Team Member",
        organizationName: updatedInvite.organization.name,
        inviteToken: updatedInvite.token,
        role: updatedInvite.role,
        expiresAt: new Date(updatedInvite.expiresAt),
      });
    } catch (emailError) {
      // Log error but don't fail the resend
      console.error("Failed to resend invitation email:", emailError);
    }

    return {
      ...updatedInvite,
      role: updatedInvite.role as OrganizationRole,
      status: updatedInvite.status as InviteStatus,
      invitedBy: {
        ...updatedInvite.invitedBy,
        name: updatedInvite.invitedBy.name || undefined,
        imageUrl: updatedInvite.invitedBy.imageUrl || undefined,
      },
      organization: {
        ...updatedInvite.organization,
        description: updatedInvite.organization.description || undefined,
        imageUrl: updatedInvite.organization.imageUrl || undefined,
        website: updatedInvite.organization.website || undefined,
        plan: updatedInvite.organization.plan as "free" | "pro" | "enterprise",
      },
      createdAt: new Date(updatedInvite.createdAt),
      expiresAt: new Date(updatedInvite.expiresAt),
      acceptedAt: updatedInvite.acceptedAt
        ? new Date(updatedInvite.acceptedAt)
        : undefined,
    };
  }

  /**
   * Check if user has access to organization
   */
  static async hasUserAccess(
    organizationId: string,
    userId: string,
  ): Promise<boolean> {
    const membership = await db.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    if (membership) return true;

    // Check if user is the creator
    const organization = await db.organization.findUnique({
      where: { id: organizationId },
      select: { createdById: true },
    });

    return organization?.createdById === userId;
  }

  /**
   * Accept organization invite
   */
  static async acceptInvite(
    token: string,
    userId: string,
  ): Promise<OrganizationMember> {
    const invite = await db.organizationInvite.findUnique({
      where: { token },
      include: { organization: true },
    });

    if (!invite) {
      throw new Error("Invalid invite token");
    }

    if (invite.status !== "pending") {
      throw new Error("Invite is no longer valid");
    }

    if (invite.expiresAt < new Date()) {
      throw new Error("Invite has expired");
    }

    // Get user email to verify
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user || user.email !== invite.email) {
      throw new Error("Invite email does not match your account");
    }

    // Check if user is already a member
    const existingMember = await db.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: invite.organizationId,
        },
      },
    });

    if (existingMember) {
      throw new Error("You are already a member of this organization");
    }

    // Check organization member limits
    const memberCount = await db.organizationMember.count({
      where: { organizationId: invite.organizationId },
    });

    if (
      invite.organization.maxMembers > 0 &&
      memberCount >= invite.organization.maxMembers
    ) {
      throw new Error("Organization has reached its member limit");
    }

    // Create membership and update invite
    const [member] = await db.$transaction([
      db.organizationMember.create({
        data: {
          userId,
          organizationId: invite.organizationId,
          role: invite.role,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              imageUrl: true,
              username: true,
            },
          },
        },
      }),
      db.organizationInvite.update({
        where: { id: invite.id },
        data: {
          status: "accepted",
          acceptedAt: new Date(),
        },
      }),
    ]);

    return {
      ...member,
      role: member.role as OrganizationRole,
      user: {
        ...member.user,
        name: member.user.name || undefined,
        imageUrl: member.user.imageUrl || undefined,
        username: member.user.username || undefined,
      },
      joinedAt: new Date(member.joinedAt),
      updatedAt: new Date(member.updatedAt),
    };
  }
}
