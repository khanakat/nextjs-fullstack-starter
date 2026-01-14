import { injectable } from 'inversify';
import {
  IWorkflowTemplateRepository,
  WorkflowTemplate,
} from '../../domain/repositories/workflow-template-repository';
import { WorkflowTemplateId } from '../../domain/value-objects/workflow-template-id';
import { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';

/**
 * Prisma Workflow Template Repository
 * Implements workflow template data access using Prisma ORM
 */
@injectable()
export class PrismaWorkflowTemplateRepository
  implements IWorkflowTemplateRepository
{
  constructor(private prisma: PrismaClient) {}

  async save(template: WorkflowTemplate): Promise<void> {
    const data = template.toPersistence();

    // Use upsert to handle both create and update
    await this.prisma.workflowTemplate.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        workflowId: data.workflowId,
        name: data.name,
        description: data.description,
        category: data.category,
        template: data.template,
        variables: data.variables,
        settings: data.settings,
        isBuiltIn: data.isBuiltIn,
        isPublic: data.isPublic,
        tags: data.tags,
        usageCount: data.usageCount,
        rating: data.rating,
        createdBy: data.createdBy,
        organizationId: data.organizationId,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
      update: {
        name: data.name,
        description: data.description,
        category: data.category,
        template: data.template,
        variables: data.variables,
        settings: data.settings,
        isPublic: data.isPublic,
        tags: data.tags,
        rating: data.rating,
        updatedAt: data.updatedAt,
      },
    });
  }

  async findById(id: WorkflowTemplateId): Promise<WorkflowTemplate | null> {
    const record = await this.prisma.workflowTemplate.findUnique({
      where: { id: id.value },
    });

    if (!record) {
      return null;
    }

    return this.mapToDomain(record);
  }

  async findByCategory(
    category: string,
    options?: {
      organizationId?: string;
      isBuiltIn?: boolean;
      isPublic?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<WorkflowTemplate[]> {
    const where: Prisma.WorkflowTemplateWhereInput = {
      category,
      ...(options?.organizationId !== undefined && {
        OR: [
          { organizationId: options.organizationId },
          { isPublic: true },
          { isBuiltIn: true },
        ],
      }),
      ...(options?.isBuiltIn !== undefined && { isBuiltIn: options.isBuiltIn }),
      ...(options?.isPublic !== undefined && { isPublic: options.isPublic }),
    };

    const records = await this.prisma.workflowTemplate.findMany({
      where,
      orderBy: { usageCount: 'desc' },
      take: options?.limit,
      skip: options?.offset,
    });

    return records.map((r) => this.mapToDomain(r));
  }

  async findByOrganization(
    organizationId: string,
    options?: {
      category?: string;
      isBuiltIn?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<WorkflowTemplate[]> {
    const where: Prisma.WorkflowTemplateWhereInput = {
      OR: [{ organizationId }, { isPublic: true }, { isBuiltIn: true }],
      ...(options?.category && { category: options.category }),
      ...(options?.isBuiltIn !== undefined && {
        isBuiltIn: options.isBuiltIn,
      }),
    };

    const records = await this.prisma.workflowTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit,
      skip: options?.offset,
    });

    return records.map((r) => this.mapToDomain(r));
  }

  async findByCreator(
    createdBy: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<WorkflowTemplate[]> {
    const records = await this.prisma.workflowTemplate.findMany({
      where: { createdBy },
      orderBy: { createdAt: 'desc' },
      take: options?.limit,
      skip: options?.offset,
    });

    return records.map((r) => this.mapToDomain(r));
  }

  async findByTags(
    tags: string[],
    options?: {
      organizationId?: string;
      isPublic?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<WorkflowTemplate[]> {
    const where: Prisma.WorkflowTemplateWhereInput = {
      ...(options?.organizationId !== undefined && {
        OR: [
          { organizationId: options.organizationId },
          { isPublic: true },
          { isBuiltIn: true },
        ],
      }),
      ...(options?.isPublic !== undefined && { isPublic: options.isPublic }),
    };

    const records = await this.prisma.workflowTemplate.findMany({
      where,
      orderBy: { usageCount: 'desc' },
      take: options?.limit,
      skip: options?.offset,
    });

    // Filter by tags in JavaScript (since Prisma doesn't support JSON array contains nicely)
    const filtered = records.filter((r) => {
      try {
        const recordTags = JSON.parse(r.tags);
        return tags.some((tag) => recordTags.includes(tag));
      } catch {
        return false;
      }
    });

    return filtered.map((r) => this.mapToDomain(r));
  }

  async findBuiltIn(options?: {
    limit?: number;
    offset?: number;
  }): Promise<WorkflowTemplate[]> {
    const records = await this.prisma.workflowTemplate.findMany({
      where: { isBuiltIn: true },
      orderBy: { usageCount: 'desc' },
      take: options?.limit,
      skip: options?.offset,
    });

    return records.map((r) => this.mapToDomain(r));
  }

  async findPublic(options?: {
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<WorkflowTemplate[]> {
    const where: Prisma.WorkflowTemplateWhereInput = {
      isPublic: true,
      ...(options?.category && { category: options.category }),
      ...(options?.search && {
        OR: [
          { name: { contains: options.search, mode: 'insensitive' } },
          { description: { contains: options.search, mode: 'insensitive' } },
        ],
      }),
    };

    const records = await this.prisma.workflowTemplate.findMany({
      where,
      orderBy: { usageCount: 'desc' },
      take: options?.limit,
      skip: options?.offset,
    });

    return records.map((r) => this.mapToDomain(r));
  }

  async findAll(options?: {
    workflowId?: string;
    organizationId?: string;
    category?: string;
    isBuiltIn?: boolean;
    isPublic?: boolean;
    search?: string;
    tags?: string[];
    createdBy?: string;
    minUsageCount?: number;
    minRating?: number;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ templates: WorkflowTemplate[]; total: number }> {
    const where: Prisma.WorkflowTemplateWhereInput = {
      ...(options?.workflowId && { workflowId: options.workflowId }),
      ...(options?.organizationId && {
        OR: [
          { organizationId: options.organizationId },
          { isPublic: true },
          { isBuiltIn: true },
        ],
      }),
      ...(options?.category && { category: options.category }),
      ...(options?.isBuiltIn !== undefined && {
        isBuiltIn: options.isBuiltIn,
      }),
      ...(options?.isPublic !== undefined && { isPublic: options.isPublic }),
      ...(options?.search && {
        OR: [
          { name: { contains: options.search, mode: 'insensitive' } },
          { description: { contains: options.search, mode: 'insensitive' } },
        ],
      }),
      ...(options?.createdBy && { createdBy: options.createdBy }),
      ...(options?.minUsageCount && {
        usageCount: { gte: options.minUsageCount },
      }),
      ...(options?.minRating && { rating: { gte: options.minRating } }),
    };

    const [records, total] = await Promise.all([
      this.prisma.workflowTemplate.findMany({
        where,
        orderBy: {
          [options?.sortBy || 'createdAt']:
            options?.sortOrder || 'desc',
        },
        take: options?.limit || 20,
        skip: options?.offset || 0,
      }),
      this.prisma.workflowTemplate.count({ where }),
    ]);

    // Filter by tags in JavaScript if specified
    let filtered = records;
    if (options?.tags && options.tags.length > 0) {
      filtered = records.filter((r) => {
        try {
          const recordTags = JSON.parse(r.tags);
          return options.tags!.some((tag) => recordTags.includes(tag));
        } catch {
          return false;
        }
      });
    }

    return {
      templates: filtered.map((r) => this.mapToDomain(r)),
      total,
    };
  }

  async search(
    query: string,
    options?: {
      organizationId?: string;
      category?: string;
      isPublic?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ templates: WorkflowTemplate[]; total: number }> {
    const where: Prisma.WorkflowTemplateWhereInput = {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { category: { contains: query, mode: 'insensitive' } },
      ],
      ...(options?.organizationId && {
        OR: [
          { organizationId: options.organizationId },
          { isPublic: true },
          { isBuiltIn: true },
        ],
      }),
      ...(options?.category && { category: options.category }),
      ...(options?.isPublic !== undefined && { isPublic: options.isPublic }),
    };

    const [records, total] = await Promise.all([
      this.prisma.workflowTemplate.findMany({
        where,
        orderBy: { usageCount: 'desc' },
        take: options?.limit || 20,
        skip: options?.offset || 0,
      }),
      this.prisma.workflowTemplate.count({ where }),
    ]);

    return {
      templates: records.map((r) => this.mapToDomain(r)),
      total,
    };
  }

  async delete(id: WorkflowTemplateId): Promise<void> {
    await this.prisma.workflowTemplate.delete({
      where: { id: id.value },
    });
  }

  async countByCategory(
    category: string,
    organizationId?: string
  ): Promise<number> {
    const where: Prisma.WorkflowTemplateWhereInput = {
      category,
      ...(organizationId && {
        OR: [
          { organizationId },
          { isPublic: true },
          { isBuiltIn: true },
        ],
      }),
    };

    return await this.prisma.workflowTemplate.count({ where });
  }

  async countByOrganization(organizationId: string): Promise<number> {
    return await this.prisma.workflowTemplate.count({
      where: { organizationId },
    });
  }

  async findPopular(options?: {
    organizationId?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<WorkflowTemplate[]> {
    const where: Prisma.WorkflowTemplateWhereInput = {
      ...(options?.organizationId && {
        OR: [
          { organizationId: options.organizationId },
          { isPublic: true },
        ],
      }),
      ...(options?.category && { category: options.category }),
    };

    const records = await this.prisma.workflowTemplate.findMany({
      where,
      orderBy: { usageCount: 'desc' },
      take: options?.limit || 10,
      skip: options?.offset || 0,
    });

    return records.map((r) => this.mapToDomain(r));
  }

  async findTopRated(options?: {
    organizationId?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<WorkflowTemplate[]> {
    const where: Prisma.WorkflowTemplateWhereInput = {
      rating: { not: null },
      ...(options?.organizationId && {
        OR: [
          { organizationId: options.organizationId },
          { isPublic: true },
        ],
      }),
      ...(options?.category && { category: options.category }),
    };

    const records = await this.prisma.workflowTemplate.findMany({
      where,
      orderBy: { rating: 'desc' },
      take: options?.limit || 10,
      skip: options?.offset || 0,
    });

    return records.map((r) => this.mapToDomain(r));
  }

  async incrementUsageCount(id: WorkflowTemplateId): Promise<void> {
    await this.prisma.workflowTemplate.update({
      where: { id: id.value },
      data: {
        usageCount: { increment: 1 },
        updatedAt: new Date(),
      },
    });
  }

  async updateRating(
    id: WorkflowTemplateId,
    rating: number
  ): Promise<void> {
    await this.prisma.workflowTemplate.update({
      where: { id: id.value },
      data: {
        rating,
        updatedAt: new Date(),
      },
    });
  }

  async exists(id: WorkflowTemplateId): Promise<boolean> {
    const count = await this.prisma.workflowTemplate.count({
      where: { id: id.value },
    });
    return count > 0;
  }

  async findByWorkflowId(workflowId: string): Promise<WorkflowTemplate[]> {
    const records = await this.prisma.workflowTemplate.findMany({
      where: { workflowId },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((r) => this.mapToDomain(r));
  }

  /**
   * Map Prisma record to domain entity
   */
  private mapToDomain(record: any): WorkflowTemplate {
    return WorkflowTemplate.reconstitute(
      WorkflowTemplateId.fromValue(record.id),
      {
        workflowId: record.workflowId ?? undefined,
        name: record.name,
        description: record.description ?? undefined,
        category: record.category,
        template: record.template,
        variables: record.variables,
        settings: record.settings,
        isBuiltIn: record.isBuiltIn,
        isPublic: record.isPublic,
        tags: record.tags,
        usageCount: record.usageCount,
        rating: record.rating ?? undefined,
        createdBy: record.createdBy ?? undefined,
        organizationId: record.organizationId ?? undefined,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      }
    );
  }
}
