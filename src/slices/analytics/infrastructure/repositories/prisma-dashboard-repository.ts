import { Dashboard, DashboardStatus } from '../../domain/entities/dashboard';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import type { IDashboardRepository } from '../../domain/repositories/dashboard-repository';
import { prisma } from '@/lib/prisma';

/**
 * Prisma implementation of IDashboardRepository
 * Handles dashboard persistence using Prisma ORM
 * 
 * Note: The Prisma AnalyticsDashboard model does not have slug or status fields.
 * Status is stored in the settings JSON field as a nested property.
 */
export class PrismaDashboardRepository implements IDashboardRepository {
  /**
   * Convert Prisma model to domain entity
   */
  private toDomain(prismaDashboard: any): Dashboard {
    // Parse settings to extract status
    const settings = JSON.parse(prismaDashboard.settings || '{}');
    const status = this.mapStatus(settings.status || 'ACTIVE');

    return Dashboard.reconstitute(
      UniqueId.create(prismaDashboard.id),
      {
        name: prismaDashboard.name,
        description: prismaDashboard.description,
        layout: prismaDashboard.layout,
        settings: prismaDashboard.settings,
        isPublic: prismaDashboard.isPublic,
        isTemplate: prismaDashboard.isTemplate,
        tags: prismaDashboard.tags,
        organizationId: prismaDashboard.organizationId,
        createdBy: prismaDashboard.createdBy,
        status,
      }
    );
  }

  /**
   * Map status from string to enum
   */
  private mapStatus(status: string): DashboardStatus {
    switch (status) {
      case 'ACTIVE':
        return DashboardStatus.ACTIVE;
      case 'INACTIVE':
        return DashboardStatus.INACTIVE;
      case 'ARCHIVED':
        return DashboardStatus.ARCHIVED;
      default:
        return DashboardStatus.ACTIVE;
    }
  }

  /**
   * Convert domain entity to Prisma model
   */
  private toPrisma(dashboard: Dashboard): any {
    // Parse existing settings and update with status
    const settings = JSON.parse(dashboard.settings || '{}');
    settings.status = dashboard.status;

    return {
      id: dashboard.id.value,
      name: dashboard.name,
      description: dashboard.description,
      layout: dashboard.layout,
      settings: JSON.stringify(settings),
      isPublic: dashboard.isPublic,
      isTemplate: dashboard.isTemplate,
      tags: dashboard.tags,
      organizationId: dashboard.organizationId,
      createdBy: dashboard.createdBy,
    };
  }

  /**
   * Save a new dashboard
   */
  async save(dashboard: Dashboard): Promise<void> {
    const prismaDashboard = this.toPrisma(dashboard);
    await prisma.analyticsDashboard.create({
      data: prismaDashboard,
    });
  }

  /**
   * Update an existing dashboard
   */
  async update(dashboard: Dashboard): Promise<void> {
    const prismaDashboard = this.toPrisma(dashboard);
    await prisma.analyticsDashboard.update({
      where: { id: dashboard.id.value },
      data: prismaDashboard,
    });
  }

  /**
   * Delete a dashboard
   */
  async delete(id: UniqueId): Promise<void> {
    await prisma.analyticsDashboard.delete({
      where: { id: id.value },
    });
  }

  /**
   * Find dashboard by ID
   */
  async findById(id: UniqueId): Promise<Dashboard | null> {
    const prismaDashboard = await prisma.analyticsDashboard.findUnique({
      where: { id: id.value },
    });

    if (!prismaDashboard) {
      return null;
    }

    return this.toDomain(prismaDashboard);
  }

  /**
   * Find dashboards by organization ID
   */
  async findByOrganizationId(organizationId: string): Promise<Dashboard[]> {
    const prismaDashboards = await prisma.analyticsDashboard.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });

    return prismaDashboards.map((dash) => this.toDomain(dash));
  }

  /**
   * Find all dashboards
   */
  async findAll(): Promise<Dashboard[]> {
    const prismaDashboards = await prisma.analyticsDashboard.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return prismaDashboards.map((dash) => this.toDomain(dash));
  }

  /**
   * Find dashboards by creator ID
   */
  async findByCreatedBy(createdBy: string): Promise<Dashboard[]> {
    const prismaDashboards = await prisma.analyticsDashboard.findMany({
      where: { createdBy },
      orderBy: { createdAt: 'desc' },
    });

    return prismaDashboards.map((dash) => this.toDomain(dash));
  }

  /**
   * Find public dashboards
   */
  async findPublic(): Promise<Dashboard[]> {
    const prismaDashboards = await prisma.analyticsDashboard.findMany({
      where: { isPublic: true },
      orderBy: { viewCount: 'desc' },
    });

    return prismaDashboards.map((dash) => this.toDomain(dash));
  }

  /**
   * Find template dashboards
   */
  async findTemplates(): Promise<Dashboard[]> {
    const prismaDashboards = await prisma.analyticsDashboard.findMany({
      where: { isTemplate: true },
      orderBy: { viewCount: 'desc' },
    });

    return prismaDashboards.map((dash) => this.toDomain(dash));
  }

  /**
   * Find dashboards by status (filters by status in settings JSON)
   * Note: This is a client-side filter since Prisma doesn't support JSON filtering on all databases
   */
  async findByStatus(status: DashboardStatus): Promise<Dashboard[]> {
    const prismaDashboards = await prisma.analyticsDashboard.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Filter by status from settings JSON
    return prismaDashboards
      .map((dash) => this.toDomain(dash))
      .filter((dash) => dash.status === status);
  }

  /**
   * Count dashboards
   */
  async count(): Promise<number> {
    return prisma.analyticsDashboard.count();
  }

  /**
   * Find dashboards with pagination
   */
  async findPaginated(page: number, limit: number): Promise<{ dashboards: Dashboard[]; total: number }> {
    const skip = (page - 1) * limit;

    const [prismaDashboards, total] = await Promise.all([
      prisma.analyticsDashboard.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.analyticsDashboard.count(),
    ]);

    return {
      dashboards: prismaDashboards.map((dash) => this.toDomain(dash)),
      total,
    };
  }

  /**
   * Increment view count for a dashboard
   */
  async incrementViewCount(id: UniqueId): Promise<void> {
    await prisma.analyticsDashboard.update({
      where: { id: id.value },
      data: {
        viewCount: { increment: 1 },
        lastViewedAt: new Date(),
      },
    });
  }
}
