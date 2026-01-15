import { PrismaClient } from '@prisma/client';
import { IReportTemplateRepository, TemplateSearchOptions, TemplateSearchResult } from '../../../../shared/domain/reporting/repositories/report-template-repository';
import { ReportTemplate, TemplateCategory, TemplateType } from '../../../../shared/domain/reporting/entities/report-template';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { ReportConfig } from '../../../../shared/domain/reporting/value-objects/report-config';
import { ReportLayout } from '../../../../shared/domain/reporting/value-objects/report-layout';
import { ReportStyling } from '../../../../shared/domain/reporting/value-objects/report-styling';
import { PaginatedResult } from '../../../../shared/application/base/paginated-result';

/**
 * Prisma implementation of the Report Template repository
 */
export class PrismaReportTemplateRepository implements IReportTemplateRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: UniqueId): Promise<ReportTemplate | null> {
    const templateData = await this.prisma.template.findUnique({
      where: { id: id.id },
      include: {
        reports: true,
      },
    });

    if (!templateData) {
      return null;
    }

    return this.mapToDomain(templateData);
  }

  async findByName(name: string, organizationId?: string): Promise<ReportTemplate | null> {
    const where: any = { name };
    if (organizationId) {
      // organizationId is stored in config JSON
      where.config = {
        contains: `"organizationId":"${organizationId}"`,
      };
    }

    const templateData = await this.prisma.template.findFirst({
      where,
      include: {
        reports: true,
      },
    });

    if (!templateData) {
      return null;
    }

    return this.mapToDomain(templateData);
  }

  async findManyWithPagination(
    filters: Record<string, any>,
    page: number,
    limit: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  ): Promise<PaginatedResult<ReportTemplate>> {
    const skip = (page - 1) * limit;
    const where = this.buildWhereClause(filters);
    const orderBy = this.buildOrderByClause(sortBy, sortOrder);

    const [templates, totalCount] = await Promise.all([
      this.prisma.template.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          reports: true,
        },
      }),
      this.prisma.template.count({ where }),
    ]);

    const domainTemplates = templates.map(template => this.mapToDomain(template));

    return new PaginatedResult(domainTemplates, totalCount, page, limit);
  }

  async save(template: ReportTemplate): Promise<void> {
    const data = this.mapToPersistence(template);

    await this.prisma.template.upsert({
      where: { id: template.id.id },
      update: {
        name: data.name,
        description: data.description,
        categoryId: data.categoryId,
        config: data.config,
        previewUrl: data.previewUrl,
        isPublic: data.isPublic,
        isSystem: data.isSystem,
        updatedAt: new Date(),
      },
      create: {
        id: data.id,
        name: data.name,
        description: data.description,
        categoryId: data.categoryId,
        config: data.config,
        previewUrl: data.previewUrl,
        createdBy: data.createdBy,
        isPublic: data.isPublic,
        isSystem: data.isSystem,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
    });
  }

  async delete(id: UniqueId): Promise<void> {
    await this.prisma.template.delete({
      where: { id: id.id },
    });
  }

  async findByCategory(
    category: TemplateCategory,
    options?: TemplateSearchOptions
  ): Promise<TemplateSearchResult> {
    const { limit, offset } = options || {};
    const where: any = {
      isPublic: true,
      config: {
        contains: `"category":"${category}"`,
      },
    };

    const [templates, total] = await Promise.all([
      this.prisma.template.findMany({
        where,
        take: limit,
        skip: offset,
        include: { reports: true },
      }),
      this.prisma.template.count({ where }),
    ]);

    return {
      templates: templates.map(t => this.mapToDomain(t)),
      total,
      hasMore: (offset || 0) + (limit || 0) < total,
    };
  }

  async findActiveTemplates(options?: TemplateSearchOptions): Promise<TemplateSearchResult> {
    const { limit, offset } = options || {};
    const where: any = {
      isPublic: true,
      config: {
        contains: `"isActive":true`,
      },
    };

    const [templates, total] = await Promise.all([
      this.prisma.template.findMany({
        where,
        take: limit,
        skip: offset,
        include: { reports: true },
      }),
      this.prisma.template.count({ where }),
    ]);

    return {
      templates: templates.map(t => this.mapToDomain(t)),
      total,
      hasMore: (offset || 0) + (limit || 0) < total,
    };
  }

  async findPopularTemplates(limit: number = 10, organizationId?: UniqueId): Promise<ReportTemplate[]> {
    const where: any = {
      isPublic: true,
      config: {
        contains: `"usageCount":{`,
      },
    };

    if (organizationId) {
      where.config.contains += `"organizationId":"${organizationId.id}"`;
    }

    // Sort by usageCount from config (requires custom logic)
    const templates = await this.prisma.template.findMany({
      where,
      take: limit,
      include: { reports: true },
    });

    // Sort by usageCount from config JSON
    const sorted = templates
      .map(t => this.mapToDomain(t))
      .sort((a, b) => b.usageCount - a.usageCount);

    return sorted.slice(0, limit);
  }

  async incrementUsageCount(id: UniqueId): Promise<void> {
    // Get current template
    const template = await this.findById(id);
    if (!template) {
      throw new Error(`Template with ID ${id.id} not found`);
    }

    // Increment usage in domain
    template.incrementUsage();

    // Save updated template
    await this.save(template);
  }

  private mapToDomain(templateData: any): ReportTemplate {
    // Parse config JSON
    let configData: any = {};
    try {
      configData = typeof templateData.config === 'string'
        ? JSON.parse(templateData.config)
        : templateData.config || {};
    } catch (e) {
      configData = {};
    }

    // Extract fields from config if available, otherwise use defaults
    const type: TemplateType = Object.values(TemplateType).includes(configData.type)
      ? configData.type
      : TemplateType.ANALYTICS;
    const category: TemplateCategory = Object.values(TemplateCategory).includes(configData.category)
      ? configData.category
      : TemplateCategory.STANDARD;

    // Create ReportConfig
    let config: ReportConfig;
    try {
      config = ReportConfig.create(configData);
    } catch {
      config = ReportConfig.create({
        title: templateData.name || 'Default Report',
        description: templateData.description,
      });
    }

    // Create layout from config or default
    let layout: ReportLayout;
    try {
      layout = configData.layout instanceof ReportLayout
        ? configData.layout
        : ReportLayout.create(configData.layout || {});
    } catch {
      layout = ReportLayout.createDefault();
    }

    // Create styling from config or default
    let styling: ReportStyling;
    try {
      styling = configData.styling instanceof ReportStyling
        ? configData.styling
        : ReportStyling.create(configData.styling || {});
    } catch {
      styling = ReportStyling.createDefault();
    }

    return ReportTemplate.reconstitute(
      UniqueId.create(templateData.id),
      {
        name: templateData.name,
        description: templateData.description || undefined,
        type,
        category,
        config,
        layout,
        styling,
        isSystem: templateData.isSystem ?? false,
        isPublic: templateData.isPublic ?? true,
        isActive: configData.isActive ?? templateData.isPublic ?? true,
        tags: Array.isArray(configData.tags) ? configData.tags : [],
        previewImageUrl: templateData.previewUrl || configData.previewImageUrl,
        createdBy: UniqueId.create(templateData.createdBy),
        organizationId: configData.organizationId ? UniqueId.create(configData.organizationId) : undefined,
        createdAt: templateData.createdAt,
        updatedAt: templateData.updatedAt,
        usageCount: configData.usageCount ?? 0,
        lastUsedAt: configData.lastUsedAt,
      }
    );
  }

  private mapToPersistence(template: ReportTemplate): any {
    // Build config JSON with all domain fields
    const configValue = template.config.value;
    const configJson = {
      ...configValue,
      type: template.type,
      category: template.category,
      layout: template.layout?.value,
      styling: template.styling?.value,
      isActive: template.isActive,
      tags: template.tags,
      organizationId: template.organizationId?.id,
      usageCount: template.usageCount,
      lastUsedAt: template.lastUsedAt,
    };

    return {
      id: template.id.id,
      name: template.name,
      description: template.description,
      categoryId: null, // category is stored in config
      config: JSON.stringify(configJson),
      previewUrl: template.previewImageUrl,
      createdBy: (template.createdBy as any).value ?? template.createdBy.id,
      isPublic: template.isActive,
      isSystem: template.isSystem,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }

  private buildWhereClause(filters: Record<string, any>): any {
    const where: any = {};

    if (filters.name) {
      where.name = { contains: filters.name, mode: 'insensitive' };
    }

    if (filters.category) {
      where.config = {
        contains: `"category":"${filters.category}"`,
      };
    }

    if (filters.isActive !== undefined) {
      where.isPublic = filters.isActive;
    }

    if (filters.createdBy) {
      where.createdBy = filters.createdBy;
    }

    if (filters.organizationId) {
      where.config = {
        ...where.config,
        contains: `"organizationId":"${filters.organizationId}"`,
      };
    }

    // Date range filters
    if (filters.createdAt) {
      where.createdAt = filters.createdAt;
    }

    if (filters.updatedAt) {
      where.updatedAt = filters.updatedAt;
    }

    return where;
  }

  private buildOrderByClause(sortBy?: string, sortOrder?: 'asc' | 'desc'): any {
    if (!sortBy) {
      return { updatedAt: 'desc' };
    }

    const order = sortOrder || 'desc';

    switch (sortBy) {
      case 'name':
        return { name: order };
      case 'category':
        return { name: order }; // Use name as proxy since category is in config
      case 'createdAt':
        return { createdAt: order };
      case 'updatedAt':
        return { updatedAt: order };
      default:
        return { updatedAt: 'desc' };
    }
  }

  // Additional methods required by IReportTemplateRepository interface
  async findByIds(ids: UniqueId[]): Promise<ReportTemplate[]> {
    const templates = await this.prisma.template.findMany({
      where: {
        id: { in: ids.map(id => id.id) },
      },
      include: {
        reports: true,
      },
    });

    return templates.map(template => this.mapToDomain(template));
  }

  async findByCreator(createdBy: UniqueId, options?: any): Promise<any> {
    const { limit = 20, offset = 0, sortBy = 'createdAt', sortOrder = 'desc' } = options || {};

    const templates = await this.prisma.template.findMany({
      where: {
        createdBy: createdBy.id,
      },
      include: {
        reports: true,
      },
      take: limit,
      skip: offset,
      orderBy: this.buildOrderByClause(sortBy, sortOrder),
    });

    const total = await this.prisma.template.count({
      where: {
        createdBy: createdBy.id,
      },
    });

    return {
      templates: templates.map(template => this.mapToDomain(template)),
      total,
      hasMore: offset + limit < total,
    };
  }

  async findByOrganization(organizationId: UniqueId, options?: any): Promise<any> {
    const { limit = 20, offset = 0, sortBy = 'createdAt', sortOrder = 'desc' } = options || {};

    const templates = await this.prisma.template.findMany({
      where: {
        OR: [
          { isPublic: true },
          { isSystem: true },
        ],
        config: {
          contains: `"organizationId":"${organizationId.id}"`,
        },
      },
      include: {
        reports: true,
      },
      take: limit,
      skip: offset,
      orderBy: this.buildOrderByClause(sortBy, sortOrder),
    });

    const total = await this.prisma.template.count({
      where: {
        OR: [
          { isPublic: true },
          { isSystem: true },
        ],
        config: {
          contains: `"organizationId":"${organizationId.id}"`,
        },
      },
    });

    return {
      templates: templates.map(template => this.mapToDomain(template)),
      total,
      hasMore: offset + limit < total,
    };
  }

  async findSystemTemplates(options?: any): Promise<any> {
    const { limit = 20, offset = 0, sortBy = 'name', sortOrder = 'asc' } = options || {};

    const templates = await this.prisma.template.findMany({
      where: {
        isSystem: true,
        isPublic: true,
      },
      include: {
        reports: true,
      },
      take: limit,
      skip: offset,
      orderBy: this.buildOrderByClause(sortBy, sortOrder),
    });

    const total = await this.prisma.template.count({
      where: {
        isSystem: true,
        isPublic: true,
      },
    });

    return {
      templates: templates.map(template => this.mapToDomain(template)),
      total,
      hasMore: offset + limit < total,
    };
  }

  async findByType(type: any, options?: any): Promise<any> {
    const { limit = 20, offset = 0, sortBy = 'name', sortOrder = 'asc' } = options || {};

    const templates = await this.prisma.template.findMany({
      where: {
        isPublic: true,
        config: {
          contains: `"type":"${type}"`,
        },
      },
      include: {
        reports: true,
      },
      take: limit,
      skip: offset,
      orderBy: this.buildOrderByClause(sortBy, sortOrder),
    });

    const total = await this.prisma.template.count({
      where: {
        isPublic: true,
        config: {
          contains: `"type":"${type}"`,
        },
      },
    });

    return {
      templates: templates.map(template => this.mapToDomain(template)),
      total,
      hasMore: offset + limit < total,
    };
  }

  async search(criteria: any, options?: any): Promise<any> {
    const { limit = 20, offset = 0, sortBy = 'createdAt', sortOrder = 'desc' } = options || {};
    const where = this.buildSearchWhereClause(criteria);

    const templates = await this.prisma.template.findMany({
      where,
      include: {
        reports: true,
      },
      take: limit,
      skip: offset,
      orderBy: this.buildOrderByClause(sortBy, sortOrder),
    });

    const total = await this.prisma.template.count({ where });

    return {
      templates: templates.map(template => this.mapToDomain(template)),
      total,
      hasMore: offset + limit < total,
    };
  }

  async findRecentTemplates(limit: number = 10, organizationId?: UniqueId): Promise<ReportTemplate[]> {
    const where: any = {
      OR: [
        { isPublic: true },
        { isSystem: true },
      ]
    };

    if (organizationId) {
      where.config = {
        contains: `"organizationId":"${organizationId.id}"`,
      };
    }

    const templates = await this.prisma.template.findMany({
      where,
      include: {
        reports: true,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return templates.map(template => this.mapToDomain(template));
  }

  async count(criteria?: any): Promise<number> {
    const where = criteria ? this.buildSearchWhereClause(criteria) : {};
    return this.prisma.template.count({ where });
  }

  async exists(id: UniqueId): Promise<boolean> {
    const count = await this.prisma.template.count({
      where: { id: id.id },
    });
    return count > 0;
  }

  async existsByName(name: string, createdBy: UniqueId, organizationId?: UniqueId): Promise<boolean> {
    const where: any = {
      name,
      createdBy: createdBy.id,
    };

    if (organizationId) {
      where.config = {
        contains: `"organizationId":"${organizationId.id}"`,
      };
    }

    const count = await this.prisma.template.count({ where });
    return count > 0;
  }

  async permanentlyDelete(id: UniqueId): Promise<void> {
    await this.prisma.template.delete({
      where: { id: id.id },
    });
  }

  async getAvailableTemplates(userId: UniqueId, organizationId?: UniqueId, options?: any): Promise<any> {
    const { limit = 20, offset = 0, sortBy = 'name', sortOrder = 'asc' } = options || {};

    const where: any = {
      OR: [
        { createdBy: userId.id },
        { isSystem: true },
      ],
      isPublic: true,
    };

    if (organizationId) {
      where.OR.push({
        config: {
          contains: `"organizationId":"${organizationId.id}"`,
        },
      });
    }

    const templates = await this.prisma.template.findMany({
      where,
      include: {
        reports: true,
      },
      take: limit,
      skip: offset,
      orderBy: this.buildOrderByClause(sortBy, sortOrder),
    });

    const total = await this.prisma.template.count({ where });

    return {
      templates: templates.map(template => this.mapToDomain(template)),
      total,
      hasMore: offset + limit < total,
    };
  }

  async getTemplateUsageStats(templateId: UniqueId): Promise<{
    totalUsage: number;
    usageThisMonth: number;
    usageThisWeek: number;
    lastUsedAt?: Date;
  }> {
    const template = await this.findById(templateId);

    if (!template) {
      throw new Error(`Template with ID ${templateId.id} not found`);
    }

    return {
      totalUsage: template.usageCount,
      usageThisMonth: 0, // Would need to track usage history
      usageThisWeek: 0, // Would need to track usage history
      lastUsedAt: template.lastUsedAt,
    };
  }

  async incrementUsage(templateId: UniqueId): Promise<void> {
    const template = await this.findById(templateId);
    if (!template) {
      throw new Error(`Template with ID ${templateId.id} not found`);
    }

    template.incrementUsage();
    await this.save(template);
  }

  async bulkUpdate(templates: ReportTemplate[]): Promise<void> {
    await this.prisma.$transaction(
      templates.map(template =>
        this.prisma.template.update({
          where: { id: template.id.id },
          data: this.mapToPersistence(template),
        })
      )
    );
  }

  async getTemplateStatistics(organizationId?: UniqueId): Promise<{
    totalTemplates: number;
    activeTemplates: number;
    systemTemplates: number;
    customTemplates: number;
    templatesThisMonth: number;
    templatesThisWeek: number;
    averageUsagePerTemplate: number;
  }> {
    const where: any = {};

    if (organizationId) {
      where.config = {
        contains: `"organizationId":"${organizationId.id}"`,
      };
    }

    const [total, system, publicTemplates] = await Promise.all([
      this.prisma.template.count({ where }),
      this.prisma.template.count({ where: { ...where, isSystem: true } }),
      this.prisma.template.count({ where: { ...where, isPublic: true } }),
    ]);

    const activeTemplates = publicTemplates; // isPublic = isActive
    const customTemplates = total - system;

    // Get templates to calculate average usage
    const templates = await this.prisma.template.findMany({
      where,
      take: 100, // Limit for performance
    });

    const totalUsage = templates.reduce((sum, t) => {
      try {
        const config = typeof t.config === 'string' ? JSON.parse(t.config) : t.config;
        return sum + (config.usageCount || 0);
      } catch {
        return sum;
      }
    }, 0);

    const averageUsagePerTemplate = templates.length > 0 ? totalUsage / templates.length : 0;

    return {
      totalTemplates: total,
      activeTemplates,
      systemTemplates: system,
      customTemplates,
      templatesThisMonth: 0, // Would need to track creation dates
      templatesThisWeek: 0, // Would need to track creation dates
      averageUsagePerTemplate,
    };
  }

  async findUnusedTemplates(unusedSince: Date, excludeSystem?: boolean): Promise<ReportTemplate[]> {
    const where: any = {
      createdAt: { lt: unusedSince },
    };

    if (excludeSystem) {
      where.isSystem = false;
    }

    const templates = await this.prisma.template.findMany({
      where,
      include: {
        reports: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return templates.map(template => this.mapToDomain(template));
  }

  async clone(templateId: UniqueId, newName: string, createdBy: UniqueId): Promise<ReportTemplate> {
    const originalTemplate = await this.findById(templateId);
    if (!originalTemplate) {
      throw new Error(`Template with ID ${templateId.id} not found`);
    }

    const clonedTemplate = ReportTemplate.create({
      name: newName,
      description: `Copy of ${originalTemplate.name}`,
      type: originalTemplate.type,
      category: originalTemplate.category,
      config: originalTemplate.config,
      isSystem: false,
      tags: [...originalTemplate.tags],
      previewImageUrl: originalTemplate.previewImageUrl,
      createdBy: createdBy,
      organizationId: originalTemplate.organizationId,
    });

    await this.save(clonedTemplate);
    return clonedTemplate;
  }

  private buildSearchWhereClause(criteria: any): any {
    const where: any = {};

    if (criteria.name) {
      where.name = { contains: criteria.name, mode: 'insensitive' };
    }

    if (criteria.type) {
      where.config = {
        ...where.config,
        contains: `"type":"${criteria.type}"`,
      };
    }

    if (criteria.category) {
      where.config = {
        ...where.config,
        contains: `"category":"${criteria.category}"`,
      };
    }

    if (criteria.createdBy) {
      where.createdBy = criteria.createdBy.id || criteria.createdBy;
    }

    if (criteria.organizationId) {
      where.config = {
        ...where.config,
        contains: `"organizationId":"${criteria.organizationId.id || criteria.organizationId}"`,
      };
    }

    if (criteria.isActive !== undefined) {
      where.isPublic = criteria.isActive;
    }

    if (criteria.isSystem !== undefined) {
      where.isSystem = criteria.isSystem;
    }

    if (criteria.tags && criteria.tags.length > 0) {
      where.config = {
        ...where.config,
        contains: `"tags":[`,
      };
      // Tags search is complex with JSON contains, simplified here
    }

    if (criteria.createdAfter) {
      where.createdAt = { ...where.createdAt, gte: criteria.createdAfter };
    }

    if (criteria.createdBefore) {
      where.createdAt = { ...where.createdAt, lte: criteria.createdBefore };
    }

    return where;
  }
}
