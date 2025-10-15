import { db } from '@/lib/db';
import { 
  TemplateWithRelations, 
  CreateTemplateRequest,
  TemplateFilters,
  PaginatedTemplates,
  TemplatePermissions
} from '@/lib/types/reports';

export class TemplateService {
  // Get templates with pagination and filters
  static async getTemplates(
    userId: string,
    filters: TemplateFilters = {},
    page: number = 1,
    limit: number = 12
  ): Promise<PaginatedTemplates> {
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      OR: [
        { createdBy: userId },
        { isPublic: true }
      ]
    };

    if (filters.search) {
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } }
        ]
      });
    }

    if (filters.categoryId) {
      where.AND = where.AND || [];
      where.AND.push({ categoryId: filters.categoryId });
    }

    if (filters.isPublic !== undefined) {
      where.AND = where.AND || [];
      where.AND.push({ isPublic: filters.isPublic });
    }

    if (filters.createdBy) {
      where.AND = where.AND || [];
      where.AND.push({ createdBy: filters.createdBy });
    }

    const [templates, total] = await Promise.all([
      db.template.findMany({
        where,
        include: {
          category: true,
          reports: {
            select: {
              id: true,
              createdAt: true,
              updatedAt: true,
              name: true,
              status: true,
              description: true,
              templateId: true,
              config: true,
              createdBy: true,
              isPublic: true
            },
            take: 3,
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: [
          { updatedAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      db.template.count({ where })
    ]);

    return {
      templates,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Get a single template by ID
  static async getTemplateById(templateId: string, userId: string): Promise<TemplateWithRelations | null> {
    const template = await db.template.findFirst({
      where: {
        id: templateId,
        OR: [
          { createdBy: userId },
          { isPublic: true }
        ]
      },
      include: {
        category: true,
        reports: {
          select: {
            id: true,
            createdAt: true,
            updatedAt: true,
            name: true,
            status: true,
            description: true,
            templateId: true,
            config: true,
            createdBy: true,
            isPublic: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (template) {
      // Update usage count
      // Note: usageCount field doesn't exist in the schema, so we skip this update
      // await db.template.update({
      //   where: { id: templateId },
      //   data: { usageCount: { increment: 1 } }
      // });
    }

    return template;
  }

  // Create a new template
  static async createTemplate(userId: string, data: CreateTemplateRequest): Promise<TemplateWithRelations> {
    // Verify category exists if provided
    if (data.categoryId) {
      const category = await db.templateCategory.findUnique({
        where: { id: data.categoryId }
      });
      
      if (!category) {
        throw new Error('Category not found');
      }
    }

    const template = await db.template.create({
      data: {
        name: data.name,
        description: data.description,
        categoryId: data.categoryId,
        config: JSON.stringify(data.config),
        isPublic: data.isPublic || false,
        createdBy: userId
      },
      include: {
        category: true,
        reports: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            updatedAt: true,
            status: true,
            description: true,
            templateId: true,
            config: true,
            createdBy: true,
            isPublic: true
          },
          take: 3,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return template;
  }

  // Update a template
  static async updateTemplate(
    templateId: string, 
    userId: string, 
    data: Partial<CreateTemplateRequest>
  ): Promise<TemplateWithRelations> {
    const template = await db.template.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      throw new Error('Template not found');
    }

    // Only owner can edit
    if (template.createdBy !== userId) {
      throw new Error('Only the template owner can edit it');
    }

    // Verify category exists if provided
    if (data.categoryId) {
      const category = await db.templateCategory.findUnique({
        where: { id: data.categoryId }
      });
      
      if (!category) {
        throw new Error('Category not found');
      }
    }

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.config) updateData.config = JSON.stringify(data.config);
    if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;

    const updatedTemplate = await db.template.update({
      where: { id: templateId },
      data: updateData,
      include: {
        category: true,
        reports: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            updatedAt: true,
            status: true,
            description: true,
            templateId: true,
            config: true,
            createdBy: true,
            isPublic: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    return updatedTemplate;
  }

  // Delete a template
  static async deleteTemplate(templateId: string, userId: string): Promise<void> {
    const template = await db.template.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      throw new Error('Template not found');
    }

    // Only owner can delete
    if (template.createdBy !== userId) {
      throw new Error('Only the template owner can delete it');
    }

    // Check if template is being used by reports
    const reportsUsingTemplate = await db.report.count({
      where: { templateId }
    });

    if (reportsUsingTemplate > 0) {
      throw new Error('Cannot delete template that is being used by reports');
    }

    await db.template.delete({
      where: { id: templateId }
    });
  }

  // Use a template to create a new report
  static async useTemplate(
    templateId: string, 
    userId: string, 
    reportData: { title: string; description?: string }
  ) {
    const template = await db.template.findFirst({
      where: {
        id: templateId,
        OR: [
          { createdBy: userId },
          { isPublic: true }
        ]
      }
    });

    if (!template) {
      throw new Error('Template not found or access denied');
    }

    // Create report from template
    const report = await db.report.create({
      data: {
        name: reportData.title,
        description: reportData.description,
        templateId: templateId,
        config: template.config,
        isPublic: false,
        status: 'DRAFT',
        createdBy: userId
      },
      include: {
        template: {
          include: {
            category: true
          }
        }
      }
    });

    // Note: usageCount field doesn't exist in schema, skipping increment

    return report;
  }

  // Get user permissions for a template
  static async getTemplatePermissions(templateId: string, userId: string): Promise<TemplatePermissions> {
    const template = await db.template.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      return {
        canView: false,
        canUse: false,
        canEdit: false,
        canDelete: false
      };
    }

    const isOwner = template.createdBy === userId;
    const isPublic = template.isPublic;

    if (isOwner) {
      return {
        canView: true,
        canUse: true,
        canEdit: true,
        canDelete: true
      };
    }

    if (isPublic) {
      return {
        canView: true,
        canUse: true,
        canEdit: false,
        canDelete: false
      };
    }

    return {
      canView: false,
      canUse: false,
      canEdit: false,
      canDelete: false
    };
  }

  // Get popular templates
  static async getPopularTemplates(userId: string, limit: number = 6): Promise<TemplateWithRelations[]> {
    return db.template.findMany({
      where: {
        OR: [
          { createdBy: userId },
          { isPublic: true }
        ]
      },
      include: {
        category: true,
        reports: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            updatedAt: true,
            status: true,
            description: true,
            templateId: true,
            config: true,
            createdBy: true,
            isPublic: true
          },
          take: 3,
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: [
        { createdAt: 'desc' }
      ],
      take: limit
    });
  }

  // Get templates by category
  static async getTemplatesByCategory(
    categoryId: string, 
    userId: string, 
    limit?: number
  ): Promise<TemplateWithRelations[]> {
    return db.template.findMany({
      where: {
        categoryId,
        OR: [
          { createdBy: userId },
          { isPublic: true }
        ]
      },
      include: {
        category: true,
        reports: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            updatedAt: true,
            status: true,
            description: true,
            templateId: true,
            config: true,
            createdBy: true,
            isPublic: true
          },
          take: 3,
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: [
        { updatedAt: 'desc' }
      ],
      take: limit
    });
  }

  // Search templates
  static async searchTemplates(
    query: string, 
    userId: string, 
    limit: number = 10
  ): Promise<TemplateWithRelations[]> {
    return db.template.findMany({
      where: {
        AND: [
          {
            OR: [
              { createdBy: userId },
              { isPublic: true }
            ]
          },
          {
            OR: [
              { name: { contains: query } },
              { description: { contains: query } }
            ]
          }
        ]
      },
      include: {
        category: true,
        reports: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            updatedAt: true,
            status: true,
            description: true,
            templateId: true,
            config: true,
            createdBy: true,
            isPublic: true
          },
          take: 3,
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: [
        { updatedAt: 'desc' }
      ],
      take: limit
    });
  }

  // Get template statistics
  static async getTemplateStats(userId: string) {
    const [
      totalTemplates,
      publicTemplates,
      totalUsage
    ] = await Promise.all([
      db.template.count({
        where: { createdBy: userId }
      }),
      db.template.count({
        where: { 
          createdBy: userId,
          isPublic: true 
        }
      }),
      Promise.resolve({ _sum: { usageCount: 0 } })
    ]);

    return {
      totalTemplates,
      publicTemplates,
      privateTemplates: totalTemplates - publicTemplates,
      totalUsage: totalUsage._sum.usageCount || 0,
      averageUsage: totalTemplates > 0 ? Math.round((totalUsage._sum.usageCount || 0) / totalTemplates) : 0
    };
  }
}