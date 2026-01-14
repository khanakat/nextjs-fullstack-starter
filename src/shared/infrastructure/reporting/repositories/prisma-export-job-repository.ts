import { ExportJob, ExportJobStatus, ExportFormat } from '../../../../slices/reporting/domain/entities/export-job';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { IExportJobRepository } from '../../../../slices/reporting/domain/repositories/export-job-repository';
import { PrismaClient } from '@prisma/client';

export class PrismaExportJobRepository implements IExportJobRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(exportJob: ExportJob): Promise<void> {
    const data = exportJob.toPrimitives();

    await this.prisma.exportJob.upsert({
      where: { id: data.id },
      update: {
        status: data.status,
        filePath: data.filePath,
        downloadUrl: data.downloadUrl,
        fileUrl: data.fileUrl,
        fileSize: data.fileSize,
        errorMessage: data.errorMessage,
        queueJobId: data.queueJobId,
        completedAt: data.completedAt,
        updatedAt: new Date(),
      },
      create: {
        id: data.id,
        reportId: data.reportId,
        format: data.format,
        status: data.status,
        userId: data.userId,
        organizationId: data.organizationId,
        options: data.options,
        queueJobId: data.queueJobId,
      },
    });
  }

  async findById(id: UniqueId): Promise<ExportJob | null> {
    const record = await this.prisma.exportJob.findUnique({
      where: { id: id.toString() },
      include: {
        report: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    if (!record) {
      return null;
    }

    return this.toDomain(record);
  }

  async findByUserId(userId: string, filters?: {
    status?: ExportJobStatus;
    format?: ExportFormat;
    reportId?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ jobs: ExportJob[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;
    const sortBy = filters?.sortBy || 'createdAt';
    const sortOrder = filters?.sortOrder || 'desc';

    const where: any = { userId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.format) {
      where.format = filters.format;
    }

    if (filters?.reportId) {
      where.reportId = filters.reportId;
    }

    const [records, total] = await Promise.all([
      this.prisma.exportJob.findMany({
        where,
        include: {
          report: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.exportJob.count({ where }),
    ]);

    const jobs = records.map(record => this.toDomain(record));

    return { jobs, total };
  }

  async findByQueueJobId(queueJobId: string): Promise<ExportJob | null> {
    const record = await this.prisma.exportJob.findUnique({
      where: { queueJobId },
      include: {
        report: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    if (!record) {
      return null;
    }

    return this.toDomain(record);
  }

  async delete(id: UniqueId): Promise<void> {
    await this.prisma.exportJob.delete({
      where: { id: id.toString() },
    });
  }

  async deleteMany(ids: UniqueId[]): Promise<number> {
    const result = await this.prisma.exportJob.deleteMany({
      where: {
        id: { in: ids.map(id => id.toString()) },
      },
    });
    return result.count;
  }

  async countByUserId(userId: string): Promise<number> {
    return this.prisma.exportJob.count({ where: { userId } });
  }

  private toDomain(record: any): ExportJob {
    return ExportJob.create({
      id: UniqueId.create(record.id),
      reportId: record.reportId,
      format: record.format as ExportFormat,
      status: record.status as ExportJobStatus,
      userId: record.userId,
      organizationId: record.organizationId || undefined,
      options: record.options || undefined,
      filePath: record.filePath || undefined,
      downloadUrl: record.downloadUrl || undefined,
      fileUrl: record.fileUrl || undefined,
      fileSize: record.fileSize || undefined,
      errorMessage: record.errorMessage || undefined,
      queueJobId: record.queueJobId || undefined,
      completedAt: record.completedAt || undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
