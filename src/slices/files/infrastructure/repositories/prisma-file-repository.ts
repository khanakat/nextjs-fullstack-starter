import { injectable } from 'inversify';
import { File } from '../../domain/entities/file';
import { FileId } from '../../domain/value-objects/file-id';
import type { IFileRepository } from '../../domain/repositories/file-repository';
import { prisma } from '@/lib/prisma';

/**
 * Prisma File Repository
 * Implements file repository using Prisma ORM
 */
@injectable()
export class PrismaFileRepository implements IFileRepository {
  constructor(private readonly prisma: any) {}

  async create(file: File): Promise<File> {
    const created = await this.prisma.media.create({
      data: {
        id: file.id.getValue(),
        filename: file.filename,
        originalName: file.originalName,
        mimeType: file.mimeType.getValue(),
        size: file.size,
        url: file.url,
        uploadedById: file.uploadedById,
        createdAt: file.createdAt,
      },
    });

    return File.fromPrisma(created);
  }

  async findById(id: FileId): Promise<File | null> {
    const found = await this.prisma.media.findUnique({
      where: { id: id.getValue() },
    });

    return found ? File.fromPrisma(found) : null;
  }

  async findByIds(ids: FileId[]): Promise<File[]> {
    const files = await this.prisma.media.findMany({
      where: {
        id: { in: ids.map(id => id.getValue()) },
      },
    });

    return files.map((file: any) => File.fromPrisma(file));
  }

  async findByUserId(userId: string): Promise<File[]> {
    const files = await this.prisma.media.findMany({
      where: { uploadedById: userId },
      orderBy: { createdAt: 'desc' },
    });

    return files.map((file: any) => File.fromPrisma(file));
  }

  async findByUserIdPaginated(
    userId: string,
    limit: number,
    offset: number
  ): Promise<{ files: File[]; total: number }> {
    const [files, total] = await Promise.all([
      this.prisma.media.findMany({
        where: { uploadedById: userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.media.count({ where: { uploadedById: userId } }),
    ]);

    return {
      files: files.map((file: any) => File.fromPrisma(file)),
      total,
    };
  }

  async findByMimeType(mimeType: string): Promise<File[]> {
    const files = await this.prisma.media.findMany({
      where: { mimeType },
      orderBy: { createdAt: 'desc' },
    });

    return files.map((file: any) => File.fromPrisma(file));
  }

  async findByUserIdAndMimeType(userId: string, mimeType: string): Promise<File[]> {
    const files = await this.prisma.media.findMany({
      where: {
        uploadedById: userId,
        mimeType,
      },
      orderBy: { createdAt: 'desc' },
    });

    return files.map((file: any) => File.fromPrisma(file));
  }

  async findByUserIdAndSizeRange(
    userId: string,
    minSize?: number,
    maxSize?: number
  ): Promise<File[]> {
    const files = await this.prisma.media.findMany({
      where: {
        uploadedById: userId,
        ...(minSize !== undefined && { size: { gte: minSize } }),
        ...(maxSize !== undefined && { size: { lte: maxSize } }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return files.map((file: any) => File.fromPrisma(file));
  }

  async findByUserIdAndDateRange(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<File[]> {
    const files = await this.prisma.media.findMany({
      where: {
        uploadedById: userId,
        ...(startDate !== undefined && { createdAt: { gte: startDate } }),
        ...(endDate !== undefined && { createdAt: { lte: endDate } }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return files.map((file: any) => File.fromPrisma(file));
  }

  async searchByFilename(userId: string, searchTerm: string): Promise<File[]> {
    const files = await this.prisma.media.findMany({
      where: {
        uploadedById: userId,
        OR: [
          { filename: { contains: searchTerm, mode: 'insensitive' } },
          { originalName: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    return files.map((file: any) => File.fromPrisma(file));
  }

  async updateUrl(id: FileId, url: string): Promise<File> {
    const updated = await this.prisma.media.update({
      where: { id: id.getValue() },
      data: { url },
    });

    return File.fromPrisma(updated);
  }

  async delete(id: FileId): Promise<void> {
    await this.prisma.media.delete({
      where: { id: id.getValue() },
    });
  }

  async deleteMany(ids: FileId[]): Promise<void> {
    await this.prisma.media.deleteMany({
      where: {
        id: { in: ids.map(id => id.getValue()) },
      },
    });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.prisma.media.deleteMany({
      where: { uploadedById: userId },
    });
  }

  async countByUserId(userId: string): Promise<number> {
    return this.prisma.media.count({
      where: { uploadedById: userId },
    });
  }

  async getTotalSizeByUserId(userId: string): Promise<number> {
    const result = await this.prisma.media.aggregate({
      where: { uploadedById: userId },
      _sum: { size: true },
    });

    return result._sum.size || 0;
  }

  async getStatistics(userId: string): Promise<{
    totalFiles: number;
    totalSize: number;
    byType: Record<string, number>;
  }> {
    const [files, totalSizeResult] = await Promise.all([
      this.prisma.media.findMany({
        where: { uploadedById: userId },
      }),
      this.prisma.media.aggregate({
        where: { uploadedById: userId },
        _sum: { size: true },
      }),
    ]);

    const byType: Record<string, number> = files.reduce(
      (acc: Record<string, number>, file: any) => {
        const type = file.mimeType;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalFiles: files.length,
      totalSize: totalSizeResult._sum.size || 0,
      byType,
    };
  }
}
