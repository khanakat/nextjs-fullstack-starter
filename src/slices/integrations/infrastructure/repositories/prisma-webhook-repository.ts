import { injectable } from 'inversify';
import { PrismaClient } from '@prisma/client';
import { Webhook } from '../../domain/entities/webhook';
import { WebhookId } from '../../domain/value-objects/webhook-id';
import type { IWebhookRepository } from '../../domain/repositories/webhook-repository';
import { prisma } from '@/lib/prisma';

/**
 * Prisma Webhook Repository
 * Implements webhook data access using Prisma ORM
 */
@injectable()
export class PrismaWebhookRepository implements IWebhookRepository {
  constructor(private readonly prisma: PrismaClient = prisma) {}

  async save(webhook: Webhook): Promise<void> {
    const data = webhook.toPersistence();

    await this.prisma.integrationWebhook.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        integrationId: data.integrationId,
        url: data.url,
        events: data.events,
        status: data.status,
        method: data.httpMethod,
        headers: data.headers,
        retryPolicy: data.retryConfig,
        isEnabled: data.isActive,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      } as any,
      update: {
        url: data.url,
        events: data.events,
        status: data.status,
        method: data.httpMethod,
        headers: data.headers,
        retryPolicy: data.retryConfig,
        isEnabled: data.isActive,
        updatedAt: data.updatedAt,
      },
    });
  }

  async findById(id: WebhookId): Promise<Webhook | null> {
    const record = await this.prisma.integrationWebhook.findUnique({
      where: { id: id.value },
    });

    if (!record) {
      return null;
    }

    return this.mapToDomain(record);
  }

  async findByIntegrationId(
    integrationId: string,
    options?: { includeInactive?: boolean }
  ): Promise<Webhook[]> {
    const where: any = { integrationId };

    if (options?.includeInactive === false) {
      where.isActive = true;
    }

    const webhooks = await this.prisma.integrationWebhook.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    return webhooks.map((w: any) => this.mapToDomain(w));
  }

  async findAll(options?: {
    integrationId?: string;
    status?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ webhooks: Webhook[]; total: number }> {
    const where: any = {};

    if (options?.integrationId) {
      where.integrationId = options.integrationId;
    }

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    const [webhooks, total] = await Promise.all([
      this.prisma.integrationWebhook.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip: options?.offset ?? 0,
        take: options?.limit ?? 50,
      }),
      this.prisma.integrationWebhook.count({ where }),
    ]);

    return {
      webhooks: webhooks.map((w: any) => this.mapToDomain(w)),
      total,
    };
  }

  async findActiveByIntegrationId(integrationId: string): Promise<Webhook[]> {
    const webhooks = await this.prisma.integrationWebhook.findMany({
      where: {
        integrationId,
        isEnabled: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return webhooks.map((w: any) => this.mapToDomain(w));
  }

  async delete(id: WebhookId): Promise<void> {
    await this.prisma.integrationWebhook.delete({
      where: { id: id.value },
    });
  }

  async exists(id: WebhookId): Promise<boolean> {
    const count = await this.prisma.integrationWebhook.count({
      where: { id: id.value },
    });
    return count > 0;
  }

  private mapToDomain(record: any): Webhook {
    return Webhook.reconstitute(
      WebhookId.fromValue(record.id),
      {
        integrationId: record.integrationId,
        url: record.url,
        events: record.events,
        status: record.status,
        httpMethod: record.httpMethod,
        headers: record.headers,
        retryConfig: record.retryConfig,
        isActive: record.isActive,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        createdBy: record.createdBy,
      }
    );
  }
}
