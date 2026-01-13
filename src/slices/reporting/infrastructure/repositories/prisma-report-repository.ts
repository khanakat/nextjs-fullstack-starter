import { PrismaClient } from '@prisma/client';
import { IReportRepository } from '../../../../shared/domain/reporting/repositories/report-repository';
import { Report } from '../../../../shared/domain/reporting/entities/report';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { ReportStatus } from '../../../../shared/domain/reporting/value-objects/report-status';
import { ReportConfig } from '../../../../shared/domain/reporting/value-objects/report-config';
import { PaginatedResult } from '../../../../shared/application/base/paginated-result';

/**
 * Prisma implementation of the Report repository
 */
export class PrismaReportRepository implements IReportRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: UniqueId): Promise<Report | null> {
    const reportData = await this.prisma.report.findUnique({
      where: { id: id.id },
      include: {
        template: true,
        scheduledReports: true,
      },
    });

    if (!reportData) {
      return null;
    }

    return this.mapToDomain(reportData);
  }

  async findByTitle(title: string, organizationId?: string): Promise<Report | null> {
    const where: any = { name: title };
    if (organizationId) {
      where.organizationId = organizationId;
    }

    const reportData = await this.prisma.report.findFirst({
      where,
      include: {
        template: true,
        scheduledReports: true,
      },
    });

    if (!reportData) {
      return null;
    }

    return this.mapToDomain(reportData);
  }

  async findManyWithPagination(
    filters: Record<string, any>,
    page: number,
    limit: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  ): Promise<PaginatedResult<Report>> {
    const skip = (page - 1) * limit;
    const where = this.buildWhereClause(filters);
    const orderBy = sortBy ? this.buildOrderByClause(sortBy, sortOrder) : undefined;

    const [reports, totalCount] = await Promise.all([
      this.prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          template: true,
          scheduledReports: true,
        },
      }),
      this.prisma.report.count({ where }),
    ]);

    const domainReports = reports.map(report => this.mapToDomain(report));

    // Return PaginatedResult instance; tests can use getters for aliases
    return new PaginatedResult(domainReports, totalCount, page, limit);
  }

  async save(report: Report): Promise<void> {
    const data = this.mapToPersistence(report);

    await this.prisma.report.upsert({
      where: { id: report.id.id },
      update: {
        name: data.title,
        description: data.description,
        config: data.config,
        status: data.status,
        isPublic: data.isPublic,
        updatedAt: new Date(),
      },
      create: data,
    });
  }

  async delete(id: UniqueId): Promise<void> {
    await this.prisma.report.update({
      where: { id: id.id },
      data: {
        status: 'archived',
        updatedAt: new Date(),
      },
    });
  }

  async permanentlyDelete(id: UniqueId): Promise<void> {
    await this.prisma.report.delete({
      where: { id: id.id },
    });
  }

  async findByStatus(status: ReportStatus, options?: any): Promise<any> {
    const { limit = 20, offset = 0, sortBy = 'updatedAt', sortOrder = 'desc' } = options || {};
    
    const reports = await this.prisma.report.findMany({
      where: {
        status: status.value,
      },
      include: {
        template: true,
        scheduledReports: true,
      },
      take: limit,
      skip: offset,
      orderBy: this.buildOrderByClause(sortBy, sortOrder),
    });

    const total = await this.prisma.report.count({
      where: {
        status: status.value,
      },
    });

    return {
      reports: reports.map(report => this.mapToDomain(report)),
      total,
      hasMore: offset + limit < total,
    };
  }

  async findByCreator(createdBy: UniqueId, options?: any): Promise<any> {
    const { limit = 20, offset = 0, sortBy = 'createdAt', sortOrder = 'desc' } = options || {};
    
    const reports = await this.prisma.report.findMany({
      where: {
        createdBy: createdBy.id,
      },
      include: {
        template: true,
        scheduledReports: true,
      },
      take: limit,
      skip: offset,
      orderBy: this.buildOrderByClause(sortBy, sortOrder),
    });

    const total = await this.prisma.report.count({
      where: {
        createdBy: createdBy.id,
      },
    });

    return {
      reports: reports.map(report => this.mapToDomain(report)),
      total,
      hasMore: offset + limit < total,
    };
  }

  async findPublicReports(options?: any): Promise<any> {
    const { limit = 20, offset = 0, sortBy = 'createdAt', sortOrder = 'desc' } = options || {};
    
    const reports = await this.prisma.report.findMany({
      where: {
        isPublic: true,
        status: 'published',
      },
      include: {
        template: true,
        scheduledReports: true,
      },
      take: limit,
      skip: offset,
      orderBy: this.buildOrderByClause(sortBy, sortOrder),
    });

    const total = await this.prisma.report.count({
      where: {
        isPublic: true,
        status: 'published',
      },
    });

    return {
      reports: reports.map(report => this.mapToDomain(report)),
      total,
      hasMore: offset + limit < total,
    };
  }

  private mapToDomain(reportData: any): Report {
    // Parse config if stored as JSON string; throw on malformed JSON
    let parsedConfig: any = reportData.config;
    if (typeof reportData.config === 'string') {
      try {
        parsedConfig = JSON.parse(reportData.config);
      } catch (e) {
        throw e instanceof Error ? e : new Error('Invalid report config JSON');
      }
    }

    return Report.reconstitute(
      UniqueId.create(reportData.id),
      {
        title: reportData.name,
        description: reportData.description,
        config: ReportConfig.create(parsedConfig),
        status: ReportStatus.fromString(
          typeof reportData.status === 'string' ? reportData.status.toUpperCase() : reportData.status
        ),
        templateId: reportData.templateId ? UniqueId.create(reportData.templateId) : undefined,
        createdBy: UniqueId.create(reportData.createdBy),
        organizationId: reportData.organizationId ? UniqueId.create(reportData.organizationId) : undefined,
        isPublic: reportData.isPublic,
        createdAt: reportData.createdAt,
        updatedAt: reportData.updatedAt,
      }
    );
  }

  private mapToPersistence(report: Report): any {
    return {
      id: report.id.id,
      name: report.title,
      description: report.description,
      config: JSON.stringify(report.config.value),
      templateId: report.templateId?.id,
      status: report.status.value,
      isPublic: report.isPublic,
      createdBy: report.createdBy.id,
      organizationId: report.organizationId?.id,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    };
  }

  private buildWhereClause(filters: Record<string, any>): any {
    const where: any = {};

    if (filters.title) {
      where.name = { contains: filters.title, mode: 'insensitive' };
    }

    if (filters.description) {
      where.description = { contains: filters.description, mode: 'insensitive' };
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.isPublic !== undefined) {
      where.isPublic = filters.isPublic;
    }

    if (filters.createdBy) {
      where.createdBy = filters.createdBy;
    }

    if (filters.organizationId) {
      where.organizationId = filters.organizationId;
    }

    if (filters.templateId) {
      where.templateId = filters.templateId;
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
    const order = sortOrder || 'desc';
    
    switch (sortBy) {
      case 'title':
        return { name: order };
      case 'createdAt':
        return { createdAt: order };
      case 'updatedAt':
        return { updatedAt: order };
      default:
        return { createdAt: order };
    }
  }

  // Additional methods required by IReportRepository interface
  async findByIds(ids: UniqueId[]): Promise<Report[]> {
    const reports = await this.prisma.report.findMany({
      where: {
        id: { in: ids.map(id => id.id) },
      },
      include: {
        template: true,
        scheduledReports: true,
      },
    });

    return reports.map(report => this.mapToDomain(report));
  }

  async findByOrganization(organizationId: UniqueId, options?: any): Promise<any> {
    const { limit = 20, offset = 0, sortBy = 'createdAt', sortOrder = 'desc' } = options || {};
    
    const reports = await this.prisma.report.findMany({
      where: {
        organizationId: organizationId.id,
      },
      include: {
        template: true,
        scheduledReports: true,
      },
      take: limit,
      skip: offset,
      orderBy: this.buildOrderByClause(sortBy, sortOrder),
    });

    const total = await this.prisma.report.count({
      where: {
        organizationId: organizationId.id,
      },
    });

    return {
      reports: reports.map(report => this.mapToDomain(report)),
      total,
      hasMore: offset + limit < total,
    };
  }

  async findByTemplate(templateId: UniqueId, options?: any): Promise<any> {
    const { limit = 20, offset = 0, sortBy = 'createdAt', sortOrder = 'desc' } = options || {};
    
    const reports = await this.prisma.report.findMany({
      where: {
        templateId: templateId.id,
      },
      include: {
        template: true,
        scheduledReports: true,
      },
      take: limit,
      skip: offset,
      orderBy: this.buildOrderByClause(sortBy, sortOrder),
    });

    const total = await this.prisma.report.count({
      where: {
        templateId: templateId.id,
      },
    });

    return {
      reports: reports.map(report => this.mapToDomain(report)),
      total,
      hasMore: offset + limit < total,
    };
  }

  async search(criteria: any, options?: any): Promise<any> {
    const { limit = 20, offset = 0, sortBy = 'createdAt', sortOrder = 'desc' } = options || {};
    const where = this.buildSearchWhereClause(criteria);
    
    const reports = await this.prisma.report.findMany({
      where,
      include: {
        template: true,
        scheduledReports: true,
      },
      take: limit,
      skip: offset,
      orderBy: this.buildOrderByClause(sortBy, sortOrder),
    });

    const total = await this.prisma.report.count({ where });

    return {
      reports: reports.map(report => this.mapToDomain(report)),
      total,
      hasMore: offset + limit < total,
    };
  }

  async findReportsForArchival(olderThan: Date): Promise<Report[]> {
    const reports = await this.prisma.report.findMany({
      where: {
        updatedAt: { lt: olderThan },
        status: 'published',
      },
      include: {
        template: true,
        scheduledReports: true,
      },
    });

    return reports.map(report => this.mapToDomain(report));
  }

  async count(criteria?: any): Promise<number> {
    const where = criteria ? this.buildSearchWhereClause(criteria) : {};
    return this.prisma.report.count({ where });
  }

  async exists(id: UniqueId): Promise<boolean> {
    const count = await this.prisma.report.count({
      where: { id: id.id },
    });
    return count > 0;
  }

  async existsByTitle(title: string, createdBy: UniqueId, organizationId?: UniqueId): Promise<boolean> {
    const where: any = {
      name: title,
      createdBy: createdBy.id,
    };
    
    if (organizationId) {
      where.organizationId = organizationId.id;
    }

    const count = await this.prisma.report.count({ where });
    return count > 0;
  }

  async getPopularReports(limit: number = 10): Promise<Report[]> {
    // Mock implementation - in real scenario, this would use view counts or other metrics
    const reports = await this.prisma.report.findMany({
      where: {
        status: 'published',
        isPublic: true,
      },
      include: {
        template: true,
        scheduledReports: true,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return reports.map(report => this.mapToDomain(report));
  }

  async getRecentReports(limit: number = 10, organizationId?: UniqueId): Promise<Report[]> {
    const where: any = {};
    
    if (organizationId) {
      where.organizationId = organizationId.id;
    }

    const reports = await this.prisma.report.findMany({
      where,
      include: {
        template: true,
        scheduledReports: true,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return reports.map(report => this.mapToDomain(report));
  }

  async getReportsByTemplate(templateId: UniqueId, limit: number = 10): Promise<Report[]> {
    const reports = await this.prisma.report.findMany({
      where: {
        templateId: templateId.id,
      },
      include: {
        template: true,
        scheduledReports: true,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return reports.map(report => this.mapToDomain(report));
  }

  async bulkUpdate(reports: Report[]): Promise<void> {
    // Use transaction for bulk updates
    await this.prisma.$transaction(
      reports.map(report => 
        this.prisma.report.update({
          where: { id: report.id.id },
          data: this.mapToPersistence(report),
        })
      )
    );
  }

  async getReportStatistics(organizationId?: UniqueId): Promise<{
    totalReports: number;
    publishedReports: number;
    draftReports: number;
    archivedReports: number;
    reportsThisMonth: number;
    reportsThisWeek: number;
  }> {
    const where: any = {};
    if (organizationId) {
      where.organizationId = organizationId.id;
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));

    const [
      totalReports,
      publishedReports,
      draftReports,
      archivedReports,
      reportsThisMonth,
      reportsThisWeek,
    ] = await Promise.all([
      this.prisma.report.count({ where }),
      this.prisma.report.count({ where: { ...where, status: 'published' } }),
      this.prisma.report.count({ where: { ...where, status: 'draft' } }),
      this.prisma.report.count({ where: { ...where, status: 'archived' } }),
      this.prisma.report.count({ where: { ...where, createdAt: { gte: startOfMonth } } }),
      this.prisma.report.count({ where: { ...where, createdAt: { gte: startOfWeek } } }),
    ]);

    return {
      totalReports,
      publishedReports,
      draftReports,
      archivedReports,
      reportsThisMonth,
      reportsThisWeek,
    };
  }

  private buildSearchWhereClause(criteria: any): any {
    const where: any = {};

    if (criteria.title) {
      where.name = { contains: criteria.title, mode: 'insensitive' };
    }

    if (criteria.status) {
      where.status = criteria.status;
    }

    if (criteria.createdBy) {
      where.createdBy = criteria.createdBy.id || criteria.createdBy;
    }

    if (criteria.organizationId) {
      where.organizationId = criteria.organizationId.id || criteria.organizationId;
    }

    if (criteria.templateId) {
      where.templateId = criteria.templateId.id || criteria.templateId;
    }

    if (criteria.isPublic !== undefined) {
      where.isPublic = criteria.isPublic;
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