import { injectable } from 'inversify';
import { PrismaClient } from '@prisma/client';
import { IntegrationTemplate } from '../../domain/entities/integration-template';
import { IntegrationTemplateId } from '../../domain/value-objects/integration-template-id';
import type { IIntegrationTemplateRepository } from '../../domain/repositories/integration-template-repository';
import { prisma } from '@/lib/prisma';

/**
 * Prisma Integration Template Repository
 * Implements integration template data access using Prisma ORM
 */
@injectable()
export class PrismaIntegrationTemplateRepository implements IIntegrationTemplateRepository {
  constructor(private readonly prisma: PrismaClient = prisma) {}

  async save(template: IntegrationTemplate): Promise<void> {
    const data = template.toPersistence();

    await this.prisma.integrationTemplate.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        name: data.name,
        description: data.description,
        provider: data.provider,
        category: data.category,
        template: data.template,
        isBuiltIn: data.isBuiltIn,
        isPublic: data.isPublic,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      } as any,
      update: {
        name: data.name,
        description: data.description,
        template: data.template,
        updatedAt: data.updatedAt,
      },
    });
  }

  async findById(id: IntegrationTemplateId): Promise<IntegrationTemplate | null> {
    const record = await this.prisma.integrationTemplate.findUnique({
      where: { id: id.value },
    });

    if (!record) {
      return null;
    }

    return this.mapToDomain(record);
  }

  async findAll(options?: {
    organizationId?: string;
    provider?: string;
    category?: string;
    includeBuiltIn?: boolean;
    includePublic?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ templates: IntegrationTemplate[]; total: number }> {
    const where: any = {};

    if (options?.organizationId) {
      where.OR = [
        { organizationId: options.organizationId },
        { organizationId: null }, // Global templates
      ];
    } else {
      // If no organization specified, only show global templates
      where.organizationId = null;
    }

    if (options?.provider) {
      where.provider = options.provider;
    }

    if (options?.category) {
      where.category = options.category;
    }

    if (options?.includeBuiltIn !== undefined) {
      where.isBuiltIn = options.includeBuiltIn;
    }

    if (options?.includePublic !== undefined) {
      where.isPublic = options.includePublic;
    }

    const [templates, total] = await Promise.all([
      this.prisma.integrationTemplate.findMany({
        where,
        orderBy: [
          { isBuiltIn: 'desc' },
          { name: 'asc' },
        ],
        skip: options?.offset ?? 0,
        take: options?.limit ?? 20,
      }),
      this.prisma.integrationTemplate.count({ where }),
    ]);

    return {
      templates: templates.map((t: any) => this.mapToDomain(t)),
      total,
    };
  }

  async findByProvider(provider: string): Promise<IntegrationTemplate[]> {
    const templates = await this.prisma.integrationTemplate.findMany({
      where: { provider },
      orderBy: { name: 'asc' },
    });

    return templates.map((t: any) => this.mapToDomain(t));
  }

  async findByCategory(category: string): Promise<IntegrationTemplate[]> {
    const templates = await this.prisma.integrationTemplate.findMany({
      where: { category },
      orderBy: { name: 'asc' },
    });

    return templates.map((t: any) => this.mapToDomain(t));
  }

  async delete(id: IntegrationTemplateId): Promise<void> {
    await this.prisma.integrationTemplate.delete({
      where: { id: id.value },
    });
  }

  async exists(id: IntegrationTemplateId): Promise<boolean> {
    const count = await this.prisma.integrationTemplate.count({
      where: { id: id.value },
    });
    return count > 0;
  }

  private mapToDomain(record: any): IntegrationTemplate {
    return IntegrationTemplate.reconstitute(
      IntegrationTemplateId.fromValue(record.id),
      {
        name: record.name,
        description: record.description,
        provider: record.provider,
        category: record.category,
        template: record.template,
        organizationId: record.organizationId,
        isBuiltIn: record.isBuiltIn,
        isPublic: record.isPublic,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        createdBy: record.createdBy,
      }
    );
  }
}
