import { injectable } from 'inversify';
import { PrismaClient } from '@prisma/client';
import { Integration, IntegrationStatus } from '../../domain/entities/integration';
import { IntegrationId } from '../../domain/value-objects/integration-id';
import type { IIntegrationRepository } from '../../domain/repositories/integration-repository';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { prisma } from '@/lib/prisma';

/**
 * Prisma Integration Repository
 * Implements the integration repository using Prisma ORM
 */
@injectable()
export class PrismaIntegrationRepository implements IIntegrationRepository {
  constructor(private readonly prisma: PrismaClient = prisma) {}

  async save(integration: Integration): Promise<void> {
    const data = integration.toPersistence();

    await this.prisma.integration.upsert({
      where: { id: data.id },
      update: {
        name: data.name,
        type: data.type,
        provider: data.provider,
        config: data.config,
        organizationId: data.organizationId,
        status: data.status,
        lastSync: data.lastSync,
        lastError: data.lastError,
        category: data.category,
        description: data.description,
        settings: data.settings,
        isEnabled: data.isEnabled,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        createdBy: data.createdBy,
      },
      create: {
        id: data.id,
        name: data.name,
        type: data.type,
        provider: data.provider,
        config: data.config,
        organizationId: data.organizationId,
        status: data.status,
        lastSync: data.lastSync,
        lastError: data.lastError,
        category: data.category,
        description: data.description,
        settings: data.settings,
        isEnabled: data.isEnabled,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        createdBy: data.createdBy,
      },
    });
  }

  async findById(id: UniqueId): Promise<Integration | null> {
    const record = await this.prisma.integration.findUnique({
      where: { id: id.id },
    });

    if (!record) {
      return null;
    }

    return this.toDomain(record);
  }

  async findByOrganizationId(organizationId: UniqueId): Promise<Integration[]> {
    const records = await this.prisma.integration.findMany({
      where: { organizationId: organizationId.id },
      orderBy: { createdAt: 'desc' },
    });

    return records.map(record => this.toDomain(record));
  }

  async findByType(type: string): Promise<Integration[]> {
    const records = await this.prisma.integration.findMany({
      where: { type },
      orderBy: { createdAt: 'desc' },
    });

    return records.map(record => this.toDomain(record));
  }

  async findByProvider(provider: string): Promise<Integration[]> {
    const records = await this.prisma.integration.findMany({
      where: { provider },
      orderBy: { createdAt: 'desc' },
    });

    return records.map(record => this.toDomain(record));
  }

  async findByStatus(status: IntegrationStatus): Promise<Integration[]> {
    const records = await this.prisma.integration.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
    });

    return records.map(record => this.toDomain(record));
  }

  async findAll(options?: {
    limit?: number;
    offset?: number;
    organizationId?: string;
    type?: string;
    provider?: string;
    status?: IntegrationStatus;
  }): Promise<Integration[]> {
    const where: any = {};

    if (options?.organizationId) {
      where.organizationId = options.organizationId;
    }

    if (options?.type) {
      where.type = options.type;
    }

    if (options?.provider) {
      where.provider = options.provider;
    }

    if (options?.status) {
      where.status = options.status;
    }

    const records = await this.prisma.integration.findMany({
      where,
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
      orderBy: { createdAt: 'desc' },
    });

    return records.map(record => this.toDomain(record));
  }

  async count(options?: {
    organizationId?: string;
    type?: string;
    provider?: string;
    status?: IntegrationStatus;
  }): Promise<number> {
    const where: any = {};

    if (options?.organizationId) {
      where.organizationId = options.organizationId;
    }

    if (options?.type) {
      where.type = options.type;
    }

    if (options?.provider) {
      where.provider = options.provider;
    }

    if (options?.status) {
      where.status = options.status;
    }

    return await this.prisma.integration.count({ where });
  }

  async delete(id: UniqueId): Promise<void> {
    await this.prisma.integration.delete({
      where: { id: id.id },
    });
  }

  async exists(id: UniqueId): Promise<boolean> {
    const record = await this.prisma.integration.findUnique({
      where: { id: id.id },
      select: { id: true },
    });

    return record !== null;
  }

  async findByName(organizationId: UniqueId, name: string): Promise<Integration | null> {
    const record = await this.prisma.integration.findFirst({
      where: {
        organizationId: organizationId.id,
        name,
      },
    });

    if (!record) {
      return null;
    }

    return this.toDomain(record);
  }

  /**
   * Convert Prisma record to domain entity
   * Note: Prisma model has additional fields (category, description, settings, isEnabled, createdAt, updatedAt, createdBy)
   * that are not in domain entity. These fields are handled but not mapped to domain.
   */
  private toDomain(record: any): Integration {
    return Integration.reconstitute(
      IntegrationId.fromValue(record.id),
      {
        name: record.name,
        type: record.type,
        provider: record.provider,
        config: record.config,
        organizationId: record.organizationId,
        status: record.status as IntegrationStatus,
        lastSync: record.lastSync,
        lastError: record.lastError,
        category: record.category,
        description: record.description,
        settings: record.settings,
        isEnabled: record.isEnabled,
        createdAt: record.createdAt ? new Date(record.createdAt) : undefined,
        updatedAt: record.updatedAt ? new Date(record.updatedAt) : undefined,
        createdBy: record.createdBy,
      }
    );
  }
}
