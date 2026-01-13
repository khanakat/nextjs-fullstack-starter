import { Organization, OrganizationStatus, OrganizationRole } from '../../domain/entities/organization';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { IOrganizationRepository } from '../../domain/repositories/organization-repository';
import { prisma } from '@/lib/prisma';

/**
 * Prisma implementation of IOrganizationRepository
 * Handles organization persistence using Prisma ORM
 */
export class PrismaOrganizationRepository implements IOrganizationRepository {
  /**
   * Convert Prisma model to domain entity
   */
  private toDomain(prismaOrganization: any): Organization {
    return Organization.reconstitute(
      UniqueId.create(prismaOrganization.id),
      {
        name: prismaOrganization.name,
        slug: prismaOrganization.slug,
        description: prismaOrganization.description,
        imageUrl: prismaOrganization.imageUrl,
        website: prismaOrganization.website,
        role: OrganizationRole.OWNER, // Default role for organization creator
        status: OrganizationStatus.ACTIVE, // Default status
        maxMembers: prismaOrganization.maxMembers,
        plan: prismaOrganization.plan,
        settings: prismaOrganization.settings,
      }
    );
  }

  /**
   * Convert domain entity to Prisma model
   */
  private toPrisma(organization: Organization): any {
    return {
      id: organization.id.value,
      name: organization.name,
      slug: organization.slug,
      description: organization.description,
      imageUrl: organization.imageUrl,
      website: organization.website,
      plan: organization.plan,
      maxMembers: organization.maxMembers,
      settings: organization.settings,
    };
  }

  /**
   * Save a new organization
   */
  async save(organization: Organization): Promise<void> {
    const prismaOrganization = this.toPrisma(organization);
    await prisma.organization.create({
      data: prismaOrganization,
    });
  }

  /**
   * Update an existing organization
   */
  async update(organization: Organization): Promise<void> {
    const prismaOrganization = this.toPrisma(organization);
    await prisma.organization.update({
      where: { id: organization.id.value },
      data: prismaOrganization,
    });
  }

  /**
   * Delete an organization
   */
  async delete(id: UniqueId): Promise<void> {
    await prisma.organization.delete({
      where: { id: id.value },
    });
  }

  /**
   * Find organization by ID
   */
  async findById(id: UniqueId): Promise<Organization | null> {
    const prismaOrganization = await prisma.organization.findUnique({
      where: { id: id.value },
    });

    if (!prismaOrganization) {
      return null;
    }

    return this.toDomain(prismaOrganization);
  }

  /**
   * Find organization by slug
   */
  async findBySlug(slug: string): Promise<Organization | null> {
    const prismaOrganization = await prisma.organization.findUnique({
      where: { slug },
    });

    if (!prismaOrganization) {
      return null;
    }

    return this.toDomain(prismaOrganization);
  }

  /**
   * Find organization by owner ID
   */
  async findByOwnerId(ownerId: string): Promise<Organization[]> {
    const prismaOrganizations = await prisma.organization.findMany({
      where: { createdById: ownerId },
    });

    return prismaOrganizations.map((org) => this.toDomain(org));
  }

  /**
   * Find all organizations
   */
  async findAll(): Promise<Organization[]> {
    const prismaOrganizations = await prisma.organization.findMany();

    return prismaOrganizations.map((org) => this.toDomain(org));
  }

  /**
   * Find organizations by status
   */
  async findByStatus(status: string): Promise<Organization[]> {
    // Note: Prisma schema doesn't have status field, so this returns all organizations
    // The status is managed in the domain layer
    const prismaOrganizations = await prisma.organization.findMany();

    // Filter by status in application layer
    return prismaOrganizations
      .map((org) => this.toDomain(org))
      .filter((org) => org.status === status);
  }

  /**
   * Check if slug exists
   */
  async existsBySlug(slug: string): Promise<boolean> {
    const count = await prisma.organization.count({
      where: { slug },
    });

    return count > 0;
  }

  /**
   * Count organizations
   */
  async count(): Promise<number> {
    return prisma.organization.count();
  }

  /**
   * Find organizations with pagination
   */
  async findPaginated(page: number, limit: number): Promise<{ organizations: Organization[]; total: number }> {
    const skip = (page - 1) * limit;

    const [prismaOrganizations, total] = await Promise.all([
      prisma.organization.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.organization.count(),
    ]);

    return {
      organizations: prismaOrganizations.map((org) => this.toDomain(org)),
      total,
    };
  }
}
