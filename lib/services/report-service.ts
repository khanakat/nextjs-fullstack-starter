import { db } from '@/lib/db';
import { 
  ReportWithRelations, 
  CreateReportRequest, 
  UpdateReportRequest,
  ReportFilters,
  PaginatedReports,
  ReportPermissions
} from '@/lib/types/reports';

export class ReportService {
  // Get reports with pagination and filters
  static async getReports(
    userId: string,
    filters: ReportFilters = {},
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedReports> {
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      OR: [
        { createdBy: userId },
        { isPublic: true },
        {
          permissions: {
            some: {
              userId: userId,
              permission: {
                in: ['VIEW', 'EDIT', 'ADMIN']
              }
            }
          }
        }
      ]
    };

    if (filters.search) {
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } }
        ]
      });
    }

    if (filters.status) {
      where.AND = where.AND || [];
      where.AND.push({ status: filters.status });
    }

    if (filters.templateId) {
      where.AND = where.AND || [];
      where.AND.push({ templateId: filters.templateId });
    }

    if (filters.createdBy) {
      where.AND = where.AND || [];
      where.AND.push({ createdBy: filters.createdBy });
    }

    if (filters.dateRange) {
      where.AND = where.AND || [];
      where.AND.push({
        createdAt: {
          gte: filters.dateRange.from,
          lte: filters.dateRange.to
        }
      });
    }

    const [reports, total] = await Promise.all([
      db.report.findMany({
        where,
        include: {
          template: {
            include: {
              category: true
            }
          },
          permissions: true,
          exportJobs: {
            orderBy: { createdAt: 'desc' },
            take: 3
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit
      }),
      db.report.count({ where })
    ]);

    return {
      reports,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Get a single report by ID
  static async getReportById(reportId: string, userId: string): Promise<ReportWithRelations | null> {
    const report = await db.report.findFirst({
      where: {
        id: reportId,
        OR: [
          { createdBy: userId },
          { isPublic: true },
          {
            permissions: {
              some: {
                userId: userId,
                permissionType: {
                  in: ['VIEW', 'EDIT', 'ADMIN']
                }
              }
            }
          }
        ]
      },
      include: {
        template: {
          include: {
            category: true
          }
        },
        permissions: true,
        exportJobs: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (report) {
      // Update view count
      // Note: viewCount field doesn't exist in the schema, so we skip this update
      // await db.report.update({
      //   where: { id: reportId },
      //   data: { viewCount: { increment: 1 } }
      // });
    }

    return report;
  }

  // Create a new report
  static async createReport(userId: string, data: CreateReportRequest): Promise<ReportWithRelations> {
    // Verify template exists if provided
    if (data.templateId) {
      const template = await db.template.findUnique({
        where: { id: data.templateId }
      });
      
      if (!template) {
        throw new Error('Template not found');
      }

      // Check if user has access to template
      if (!template.isPublic && template.createdBy !== userId) {
        throw new Error('Access denied to template');
      }
    }

    const report = await db.report.create({
      data: {
        name: data.title,
        description: data.description,
        templateId: data.templateId,
        config: JSON.stringify(data.config),
        isPublic: data.isPublic || false,
        status: 'DRAFT',
        createdBy: userId
      },
      include: {
        template: {
          include: {
            category: true
          }
        },
        permissions: true,
        exportJobs: true
      }
    });

    return report;
  }

  // Update a report
  static async updateReport(
    reportId: string, 
    userId: string, 
    data: UpdateReportRequest
  ): Promise<ReportWithRelations> {
    // Check permissions
    const hasPermission = await this.checkReportPermission(reportId, userId, 'EDIT');
    if (!hasPermission) {
      throw new Error('Access denied');
    }

    const updateData: any = { ...data };
    if (updateData.config) {
      updateData.config = JSON.stringify(updateData.config);
    }
    if (updateData.title) {
      updateData.name = updateData.title;
      delete updateData.title;
    }

    const report = await db.report.update({
      where: { id: reportId },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: {
        template: {
          include: {
            category: true
          }
        },
        permissions: true,
        exportJobs: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    return report;
  }

  // Delete a report
  static async deleteReport(reportId: string, userId: string): Promise<void> {
    const report = await db.report.findUnique({
      where: { id: reportId }
    });

    if (!report) {
      throw new Error('Report not found');
    }

    // Only owner can delete
    if (report.createdBy !== userId) {
      throw new Error('Only the report owner can delete it');
    }

    // Delete related records first
    await db.$transaction([
      db.exportJob.deleteMany({ where: { reportId } }),
      db.reportPermission.deleteMany({ where: { reportId } }),
      db.report.delete({ where: { id: reportId } })
    ]);
  }

  // Check report permissions
  static async checkReportPermission(
    reportId: string, 
    userId: string, 
    requiredPermission: 'VIEW' | 'EDIT' | 'ADMIN'
  ): Promise<boolean> {
    const report = await db.report.findUnique({
      where: { id: reportId },
      include: {
        permissions: {
          where: { userId }
        }
      }
    });

    if (!report) {
      return false;
    }

    // Owner has all permissions
    if (report.createdBy === userId) {
      return true;
    }

    // Public reports can be viewed
    if (report.isPublic && requiredPermission === 'VIEW') {
      return true;
    }

    // Check explicit permissions
    const permission = report.permissions[0];
    if (!permission) {
      return false;
    }

    const permissionLevels = {
      'VIEW': ['VIEW', 'EDIT', 'ADMIN'],
      'EDIT': ['EDIT', 'ADMIN'],
      'ADMIN': ['ADMIN']
    };

    return permissionLevels[requiredPermission].includes(permission.permissionType);
  }

  // Get user permissions for a report
  static async getReportPermissions(reportId: string, userId: string): Promise<ReportPermissions> {
    const report = await db.report.findUnique({
      where: { id: reportId },
      include: {
        permissions: {
          where: { userId }
        }
      }
    });

    if (!report) {
      return {
        canView: false,
        canEdit: false,
        canDelete: false,
        canExport: false,
        canShare: false
      };
    }

    const isOwner = report.createdBy === userId;
    const isPublic = report.isPublic;
    const permission = report.permissions[0];

    if (isOwner) {
      return {
        canView: true,
        canEdit: true,
        canDelete: true,
        canExport: true,
        canShare: true
      };
    }

    if (isPublic) {
      return {
        canView: true,
        canEdit: false,
        canDelete: false,
        canExport: true,
        canShare: false
      };
    }

    if (!permission) {
      return {
        canView: false,
        canEdit: false,
        canDelete: false,
        canExport: false,
        canShare: false
      };
    }

    const permissionLevel = permission.permissionType;
    
    return {
      canView: ['VIEW', 'EDIT', 'ADMIN'].includes(permissionLevel),
      canEdit: ['EDIT', 'ADMIN'].includes(permissionLevel),
      canDelete: permissionLevel === 'ADMIN' && isOwner,
      canExport: ['VIEW', 'EDIT', 'ADMIN'].includes(permissionLevel),
      canShare: ['EDIT', 'ADMIN'].includes(permissionLevel)
    };
  }

  // Get recent reports for dashboard
  static async getRecentReports(userId: string, limit: number = 5): Promise<ReportWithRelations[]> {
    return db.report.findMany({
      where: {
        OR: [
          { createdBy: userId },
          { isPublic: true },
          {
            permissions: {
              some: {
                userId: userId,
                permissionType: {
                  in: ['VIEW', 'EDIT', 'ADMIN']
                }
              }
            }
          }
        ]
      },
      include: {
        template: {
          include: {
            category: true
          }
        },
        permissions: true,
        exportJobs: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: limit
    });
  }

  // Get report statistics
  static async getReportStats(userId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalReports,
      reportsThisMonth,
      reportsLastMonth,
      totalViews
    ] = await Promise.all([
      db.report.count({
        where: { createdBy: userId }
      }),
      db.report.count({
        where: {
          createdBy: userId,
          createdAt: { gte: startOfMonth }
        }
      }),
      db.report.count({
        where: {
          createdBy: userId,
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth
          }
        }
      }),
      // Note: viewCount field doesn't exist in the schema, so we return 0
      Promise.resolve({ _sum: { viewCount: 0 } })
    ]);

    return {
      totalReports,
      reportsCreatedThisMonth: reportsThisMonth,
      reportsCreatedLastMonth: reportsLastMonth,
      totalViews: totalViews._sum.viewCount || 0,
      averageViews: totalReports > 0 ? Math.round((totalViews._sum.viewCount || 0) / totalReports) : 0
    };
  }
}