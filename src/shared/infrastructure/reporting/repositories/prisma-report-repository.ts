import { IReportRepository, ReportSearchCriteria, ReportSearchOptions, ReportSearchResult } from '../../../domain/reporting/repositories/report-repository';
import { Report, ReportStatus } from '../../../domain/reporting/entities/report';
import { UniqueId } from '../../../domain/value-objects/unique-id';
import { ReportConfig } from '../../../domain/reporting/value-objects/report-config';
import { prisma } from '@/lib/prisma';
import { Result } from '../../../application/base/result';

/**
 * Prisma implementation of IReportRepository
 * Handles data persistence for Report aggregate using Prisma ORM
 */
export class PrismaReportRepository implements IReportRepository {
  async save(report: Report): Promise<void> {
    const reportData = this.toPrismaModel(report);

    try {
      await prisma.report.upsert({
        where: { id: report.id.id },
        update: reportData,
        create: {
          id: report.id.id,
          ...reportData,
        },
      });
    } catch (error) {
      throw new Error(`Failed to save report: ${error}`);
    }
  }

  async findById(id: UniqueId): Promise<Report | null> {
    const model = await prisma.report.findUnique({
      where: { id: id.id },
    });

    if (!model) {
      return null;
    }

    return this.toDomainModel(model);
  }

  async findByIds(ids: UniqueId[]): Promise<Report[]> {
    const models = await prisma.report.findMany({
      where: {
        id: { in: ids.map((id) => id.id) },
      },
    });

    return Promise.all(models.map((model) => this.toDomainModel(model)));
  }

  async findByCreator(
    createdBy: UniqueId,
    options?: ReportSearchOptions
  ): Promise<ReportSearchResult> {
    const { limit = 10, offset = 0, sortBy = 'createdAt', sortOrder = 'desc' } = options || {};

    const [models, total] = await Promise.all([
      prisma.report.findMany({
        where: { createdBy: createdBy.id },
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.report.count({ where: { createdBy: createdBy.id } }),
    ]);

    const reports = await Promise.all(models.map((model) => this.toDomainModel(model)));

    return {
      reports,
      total,
      hasMore: offset + limit < total,
    };
  }

  async findByOrganization(
    organizationId: UniqueId,
    options?: ReportSearchOptions
  ): Promise<ReportSearchResult> {
    const { limit = 10, offset = 0, sortBy = 'createdAt', sortOrder = 'desc' } = options || {};

    const [models, total] = await Promise.all([
      prisma.report.findMany({
        where: { organizationId: organizationId.id },
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.report.count({ where: { organizationId: organizationId.id } }),
    ]);

    const reports = await Promise.all(models.map((model) => this.toDomainModel(model)));

    return {
      reports,
      total,
      hasMore: offset + limit < total,
    };
  }

  async findByTemplate(
    templateId: UniqueId,
    options?: ReportSearchOptions
  ): Promise<ReportSearchResult> {
    const { limit = 10, offset = 0, sortBy = 'createdAt', sortOrder = 'desc' } = options || {};

    const [models, total] = await Promise.all([
      prisma.report.findMany({
        where: { templateId: templateId.id },
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.report.count({ where: { templateId: templateId.id } }),
    ]);

    const reports = await Promise.all(models.map((model) => this.toDomainModel(model)));

    return {
      reports,
      total,
      hasMore: offset + limit < total,
    };
  }

  async findPublicReports(options?: ReportSearchOptions): Promise<ReportSearchResult> {
    const { limit = 10, offset = 0, sortBy = 'createdAt', sortOrder = 'desc' } = options || {};

    const [models, total] = await Promise.all([
      prisma.report.findMany({
        where: { isPublic: true },
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.report.count({ where: { isPublic: true } }),
    ]);

    const reports = await Promise.all(models.map((model) => this.toDomainModel(model)));

    return {
      reports,
      total,
      hasMore: offset + limit < total,
    };
  }

  async search(criteria: ReportSearchCriteria, options?: ReportSearchOptions): Promise<ReportSearchResult> {
    const { limit = 10, offset = 0, sortBy = 'createdAt', sortOrder = 'desc' } = options || {};

    const where: any = {};

    if (criteria.title) {
      where.name = { contains: criteria.title, mode: 'insensitive' };
    }

    if (criteria.status) {
      where.status = criteria.status.value;
    }

    if (criteria.createdBy) {
      where.createdBy = criteria.createdBy.id;
    }

    if (criteria.organizationId) {
      where.organizationId = criteria.organizationId.id;
    }

    if (criteria.templateId) {
      where.templateId = criteria.templateId.id;
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

    const [models, total] = await Promise.all([
      prisma.report.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.report.count({ where }),
    ]);

    const reports = await Promise.all(models.map((model) => this.toDomainModel(model)));

    return {
      reports,
      total,
      hasMore: offset + limit < total,
    };
  }

  async findByStatus(status: ReportStatus, options?: ReportSearchOptions): Promise<ReportSearchResult> {
    const { limit = 10, offset = 0, sortBy = 'createdAt', sortOrder = 'desc' } = options || {};

    const [models, total] = await Promise.all([
      prisma.report.findMany({
        where: { status: status.value },
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.report.count({ where: { status: status.value } }),
    ]);

    const reports = await Promise.all(models.map((model) => this.toDomainModel(model)));

    return {
      reports,
      total,
      hasMore: offset + limit < total,
    };
  }

  async findReportsForArchival(olderThan: Date): Promise<Report[]> {
    const models = await prisma.report.findMany({
      where: {
        status: 'DRAFT',
        createdAt: { lt: olderThan },
      },
    });

    return Promise.all(models.map((model) => this.toDomainModel(model)));
  }

  async count(criteria?: ReportSearchCriteria): Promise<number> {
    const where: any = {};

    if (criteria?.createdBy) {
      where.createdBy = criteria.createdBy.id;
    }

    if (criteria?.organizationId) {
      where.organizationId = criteria.organizationId.id;
    }

    if (criteria?.status) {
      where.status = criteria.status.value;
    }

    return prisma.report.count({ where });
  }

  async exists(id: UniqueId): Promise<boolean> {
    const count = await prisma.report.count({
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

    const count = await prisma.report.count({ where });

    return count > 0;
  }

  async delete(id: UniqueId): Promise<void> {
    try {
      await prisma.report.delete({
        where: { id: id.id },
      });
    } catch (error) {
      throw new Error(`Failed to delete report: ${error}`);
    }
  }

  async permanentlyDelete(id: UniqueId): Promise<void> {
    await prisma.report.delete({
      where: { id: id.id },
    });
  }

  async getPopularReports(limit: number = 10): Promise<Report[]> {
    // Placeholder implementation - would need view/access tracking
    const models = await prisma.report.findMany({
      where: { isPublic: true },
      take: limit,
      orderBy: { updatedAt: 'desc' },
    });

    return Promise.all(models.map((model) => this.toDomainModel(model)));
  }

  async getRecentReports(limit: number = 10, organizationId?: UniqueId): Promise<Report[]> {
    const where: any = {};
    if (organizationId) {
      where.organizationId = organizationId.id;
    }

    const models = await prisma.report.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(models.map((model) => this.toDomainModel(model)));
  }

  async getReportsByTemplate(templateId: UniqueId, limit: number = 10): Promise<Report[]> {
    const models = await prisma.report.findMany({
      where: { templateId: templateId.id },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(models.map((model) => this.toDomainModel(model)));
  }

  async bulkUpdate(reports: Report[]): Promise<void> {
    const updatePromises = reports.map((report) => {
      const reportData = this.toPrismaModel(report);
      return prisma.report.update({
        where: { id: report.id.id },
        data: reportData,
      });
    });

    await Promise.all(updatePromises);
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

    const [total, published, draft, archived, thisMonth, thisWeek] = await Promise.all([
      prisma.report.count({ where }),
      prisma.report.count({ where: { ...where, status: 'PUBLISHED' } }),
      prisma.report.count({ where: { ...where, status: 'DRAFT' } }),
      prisma.report.count({ where: { ...where, status: 'ARCHIVED' } }),
      prisma.report.count({
        where: { ...where, createdAt: { gte: startOfMonth } },
      }),
      prisma.report.count({
        where: { ...where, createdAt: { gte: startOfWeek } },
      }),
    ]);

    return {
      totalReports: total,
      publishedReports: published,
      draftReports: draft,
      archivedReports: archived,
      reportsThisMonth: thisMonth,
      reportsThisWeek: thisWeek,
    };
  }

  /**
   * Convert domain model to Prisma model
   */
  private toPrismaModel(report: Report): any {
    return {
      name: report.title,
      description: report.description,
      config: JSON.stringify(report.config),
      content: report.content,
      status: report.status.value,
      isPublic: report.isPublic,
      templateId: report.templateId?.id,
      createdBy: report.createdBy.id,
      organizationId: report.organizationId?.id,
      metadata: report.metadata,
      publishedAt: report.publishedAt,
      archivedAt: report.archivedAt,
      updatedAt: report.updatedAt,
    };
  }

  /**
   * Convert Prisma model to domain model
   */
  private async toDomainModel(model: any): Promise<Report> {
    const config = ReportConfig.create(typeof model.config === 'string' ? JSON.parse(model.config) : model.config);

    return Report.reconstitute(
      UniqueId.create(model.id),
      {
        title: model.name,
        description: model.description,
        config,
        content: model.content,
        status: ReportStatus.fromString(model.status),
        isPublic: model.isPublic,
        templateId: model.templateId ? UniqueId.create(model.templateId) : undefined,
        createdBy: UniqueId.create(model.createdBy),
        organizationId: model.organizationId ? UniqueId.create(model.organizationId) : undefined,
        metadata: model.metadata,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt,
        publishedAt: model.publishedAt,
        archivedAt: model.archivedAt,
      }
    );
  }
}
