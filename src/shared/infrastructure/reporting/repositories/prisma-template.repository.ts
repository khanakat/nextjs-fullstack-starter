import { IReportTemplateRepository, TemplateSearchCriteria, TemplateSearchOptions, TemplateSearchResult } from '../../../domain/reporting/repositories/report-template-repository';
import { ReportTemplate } from '../../../domain/reporting/entities/report-template';
import { UniqueId } from '../../../domain/value-objects/unique-id';
import { prisma } from '@/lib/prisma';

/**
 * Prisma implementation of IReportTemplateRepository
 * Handles data persistence for ReportTemplate aggregate using Prisma ORM
 */
export class PrismaReportTemplateRepository implements IReportTemplateRepository {
  async save(template: ReportTemplate): Promise<void> {
    const templateData = this.toPrismaModel(template);

    try {
      await prisma.template.upsert({
        where: { id: template.id.id },
        update: templateData,
        create: {
          id: template.id.id,
          ...templateData,
        },
      });
    } catch (error) {
      throw new Error(`Failed to save template: ${error}`);
    }
  }

  async findById(id: UniqueId): Promise<ReportTemplate | null> {
    try {
      const model = await prisma.template.findUnique({
        where: { id: id.id },
      });

      if (!model) {
        return null;
      }

      return this.toDomainModel(model);
    } catch (error) {
      throw new Error(`Failed to find template: ${error}`);
    }
  }

  async findByIds(ids: UniqueId[]): Promise<ReportTemplate[]> {
    try {
      const models = await prisma.template.findMany({
        where: {
          id: { in: ids.map((id) => id.id) },
        },
      });

      return Promise.all(models.map((model) => this.toDomainModel(model)));
    } catch (error) {
      throw new Error(`Failed to find templates: ${error}`);
    }
  }

  async findByCreator(createdBy: UniqueId, options?: TemplateSearchOptions): Promise<TemplateSearchResult> {
    const { limit = 50, offset = 0, sortBy = 'createdAt', sortOrder = 'desc' } = options || {};

    try {
      const [models, total] = await Promise.all([
        prisma.template.findMany({
          where: { createdBy: createdBy.id },
          take: limit,
          skip: offset,
          orderBy: { [sortBy]: sortOrder },
        }),
        prisma.template.count({ where: { createdBy: createdBy.id } }),
      ]);

      const templates = await Promise.all(models.map((model) => this.toDomainModel(model)));

      return {
        templates,
        total,
        hasMore: offset + limit < total,
      };
    } catch (error) {
      throw new Error(`Failed to find templates by creator: ${error}`);
    }
  }

  async findByOrganization(organizationId: UniqueId, options?: TemplateSearchOptions): Promise<TemplateSearchResult> {
    // For now, this delegates to search with organization filter
    return this.search({ organizationId }, options);
  }

  async findSystemTemplates(options?: TemplateSearchOptions): Promise<TemplateSearchResult> {
    return this.search({ isSystem: true }, options);
  }

  async findActiveTemplates(options?: TemplateSearchOptions): Promise<TemplateSearchResult> {
    return this.search({}, options);
  }

  async findByType(type: any, options?: TemplateSearchOptions): Promise<TemplateSearchResult> {
    // Type is stored as category in the Prisma schema
    return this.search({ category: type }, options);
  }

  async findByCategory(category: any, options?: TemplateSearchOptions): Promise<TemplateSearchResult> {
    return this.search({ category }, options);
  }

  async search(criteria: TemplateSearchCriteria = {}, options: TemplateSearchOptions = {}): Promise<TemplateSearchResult> {
    const { limit = 50, offset = 0, sortBy = 'createdAt', sortOrder = 'desc' } = options;

    const where: any = {};

    if (criteria.name) {
      where.OR = [
        { name: { contains: criteria.name, mode: 'insensitive' } },
        { description: { contains: criteria.name, mode: 'insensitive' } },
      ];
    }

    if (criteria.createdBy) {
      where.createdBy = criteria.createdBy.id;
    }

    if (criteria.organizationId) {
      where.organizationId = criteria.organizationId.id;
    }

    if (criteria.isActive !== undefined) {
      where.isActive = criteria.isActive;
    }

    if (criteria.isSystem !== undefined) {
      where.isSystem = criteria.isSystem;
    }

    if (criteria.category) {
      // Map category to Prisma schema if needed
      where.categoryId = criteria.category;
    }

    try {
      const [models, total] = await Promise.all([
        prisma.template.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { [sortBy]: sortOrder },
        }),
        prisma.template.count({ where }),
      ]);

      const templates = await Promise.all(models.map((model) => this.toDomainModel(model)));

      return {
        templates,
        total,
        hasMore: offset + limit < total,
      };
    } catch (error) {
      throw new Error(`Failed to search templates: ${error}`);
    }
  }

  async findPopularTemplates(limit: number = 10, organizationId?: UniqueId): Promise<ReportTemplate[]> {
    const where: any = {};
    if (organizationId) {
      where.organizationId = organizationId.id;
    }

    try {
      const models = await prisma.template.findMany({
        where,
        orderBy: { createdAt: 'desc' }, // Using createdAt as popularity proxy
        take: limit,
      });

      return Promise.all(models.map((model) => this.toDomainModel(model)));
    } catch (error) {
      throw new Error(`Failed to find popular templates: ${error}`);
    }
  }

  async findRecentTemplates(limit: number = 10, organizationId?: UniqueId): Promise<ReportTemplate[]> {
    return this.findPopularTemplates(limit, organizationId);
  }

  async count(criteria?: TemplateSearchCriteria): Promise<number> {
    const where: any = {};

    if (criteria?.name) {
      where.OR = [
        { name: { contains: criteria.name, mode: 'insensitive' } },
      ];
    }

    if (criteria?.isActive !== undefined) {
      where.isActive = criteria.isActive;
    }

    if (criteria?.isSystem !== undefined) {
      where.isSystem = criteria.isSystem;
    }

    try {
      return await prisma.template.count({ where });
    } catch (error) {
      throw new Error(`Failed to count templates: ${error}`);
    }
  }

  async exists(id: UniqueId): Promise<boolean> {
    try {
      const count = await prisma.template.count({
        where: { id: id.id },
      });

      return count > 0;
    } catch (error) {
      return false;
    }
  }

  async existsByName(name: string, createdBy: UniqueId, organizationId?: UniqueId): Promise<boolean> {
    const where: any = { name, createdBy: createdBy.id };
    if (organizationId) {
      where.organizationId = organizationId.id;
    }

    try {
      const count = await prisma.template.count({ where });
      return count > 0;
    } catch (error) {
      return false;
    }
  }

  async delete(id: UniqueId): Promise<void> {
    try {
      await prisma.template.update({
        where: { id: id.id },
        data: { isPublic: false },
      });
    } catch (error) {
      throw new Error(`Failed to delete template: ${error}`);
    }
  }

  async permanentlyDelete(id: UniqueId): Promise<void> {
    try {
      await prisma.template.delete({
        where: { id: id.id },
      });
    } catch (error) {
      throw new Error(`Failed to permanently delete template: ${error}`);
    }
  }

  async getAvailableTemplates(userId: UniqueId, organizationId?: UniqueId, options?: TemplateSearchOptions): Promise<TemplateSearchResult> {
    // Get user's own templates + system templates + organization templates
    const where: any = {
      OR: [
        { createdBy: userId.id },
        { isSystem: true },
        { isPublic: true },
      ],
    };

    if (organizationId) {
      where.OR.push({ organizationId: organizationId.id });
    }

    // We need to use a direct Prisma query instead of search() since we're using Prisma-specific properties
    try {
      const models = await prisma.template.findMany({
        where,
        take: options?.limit || 10,
        skip: options?.offset || 0,
        orderBy: { createdAt: 'desc' },
      });

      const total = await prisma.template.count({ where });

      const templates = await Promise.all(models.map((model) => this.toDomainModel(model)));

      return {
        templates,
        total,
        hasMore: (options?.offset || 0) + (options?.limit || 10) < total,
      };
    } catch (error) {
      throw new Error(`Failed to get available templates: ${error}`);
    }
  }

  async getTemplateUsageStats(templateId: UniqueId): Promise<{
    totalUsage: number;
    usageThisMonth: number;
    usageThisWeek: number;
    lastUsedAt?: Date;
  }> {
    // Placeholder implementation
    return {
      totalUsage: 0,
      usageThisMonth: 0,
      usageThisWeek: 0,
    };
  }

  async incrementUsage(templateId: UniqueId): Promise<void> {
    try {
      await prisma.template.update({
        where: { id: templateId.id },
        data: { updatedAt: new Date() },
      });
    } catch (error) {
      throw new Error(`Failed to increment usage: ${error}`);
    }
  }

  async bulkUpdate(templates: ReportTemplate[]): Promise<void> {
    for (const template of templates) {
      await this.save(template);
    }
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
      where.organizationId = organizationId.id;
    }

    const [total, active, system] = await Promise.all([
      prisma.template.count({ where }),
      prisma.template.count({ where: { ...where, isPublic: true } }),
      prisma.template.count({ where: { ...where, isSystem: true } }),
    ]);

    return {
      totalTemplates: total,
      activeTemplates: active,
      systemTemplates: system,
      customTemplates: total - system,
      templatesThisMonth: 0,
      templatesThisWeek: 0,
      averageUsagePerTemplate: 0,
    };
  }

  async findUnusedTemplates(unusedSince: Date, excludeSystem: boolean = true): Promise<ReportTemplate[]> {
    const where: any = { isPublic: true };
    if (excludeSystem) {
      where.isSystem = false;
    }

    const models = await prisma.template.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return Promise.all(models.map((model) => this.toDomainModel(model)));
  }

  async clone(templateId: UniqueId, newName: string, createdBy: UniqueId): Promise<ReportTemplate> {
    const original = await this.findById(templateId);
    if (!original) {
      throw new Error('Template not found');
    }

    const cloned = ReportTemplate.create({
      name: newName,
      description: original.description,
      type: original.type,
      category: original.category,
      config: original.config,
      layout: original.layout,
      styling: original.styling,
      isSystem: false,
      isPublic: true,
      tags: original.tags,
      createdBy: createdBy.id,
      organizationId: original.organizationId?.id,
    });

    await this.save(cloned);
    return cloned;
  }

  /**
   * Convert domain model to Prisma model
   */
  private toPrismaModel(template: ReportTemplate): any {
    return {
      name: template.name,
      description: template.description,
      config: JSON.stringify(template.config.toJSON()),
      isPublic: template.isPublic,
      createdBy: template.createdBy.id,
      isSystem: template.isSystem,
      categoryId: template.category,
      organizationId: template.organizationId?.id,
      updatedAt: template.updatedAt,
    };
  }

  /**
   * Convert Prisma model to domain model
   */
  private async toDomainModel(model: any): Promise<ReportTemplate> {
    // Parse config from JSON
    let config;
    try {
      config = model.config ? JSON.parse(model.config) : {};
    } catch (e) {
      config = { title: model.name };
    }

    return ReportTemplate.reconstitute(
      UniqueId.create(model.id),
      {
        name: model.name,
        description: model.description,
        type: model.categoryId || 'CUSTOM',
        category: model.categoryId || 'STANDARD',
        config,
        layout: undefined, // Could parse from config if needed
        styling: undefined,
        isSystem: model.isSystem,
        isPublic: model.isActive || false,
        isActive: model.isActive || false,
        tags: [], // Tags would need to be stored separately
        createdBy: UniqueId.create(model.createdBy),
        organizationId: model.organizationId ? UniqueId.create(model.organizationId) : undefined,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt,
        usageCount: 0,
        lastUsedAt: undefined,
      }
    );
  }
}
