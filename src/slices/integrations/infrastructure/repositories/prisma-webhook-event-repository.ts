import { injectable } from 'inversify';
import { PrismaClient } from '@prisma/client';
import { WebhookEvent } from '../../domain/entities/webhook-event';
import { WebhookEventId } from '../../domain/value-objects/webhook-event-id';
import type { IWebhookEventRepository } from '../../domain/repositories/webhook-event-repository';
import { prisma } from '@/lib/prisma';

/**
 * Prisma Webhook Event Repository
 * Implements webhook event data access using Prisma ORM
 */
@injectable()
export class PrismaWebhookEventRepository implements IWebhookEventRepository {
  constructor(private readonly prisma: PrismaClient = prisma) {}

  async save(event: WebhookEvent): Promise<void> {
    const data = event.toPersistence();

    await this.prisma.integrationLog.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        integrationId: data.integrationId,
        webhookId: data.webhookId,
        action: data.action,
        status: data.status,
        requestData: data.requestData,
        responseData: data.responseData,
        errorDetails: data.errorDetails,
        timestamp: data.timestamp,
        duration: data.duration,
        statusCode: data.statusCode,
      },
      update: {
        status: data.status,
        responseData: data.responseData,
        errorDetails: data.errorDetails,
        duration: data.duration,
        statusCode: data.statusCode,
      },
    });
  }

  async findById(id: WebhookEventId): Promise<WebhookEvent | null> {
    const record = await this.prisma.integrationLog.findUnique({
      where: { id: id.value },
    });

    if (!record) {
      return null;
    }

    return this.mapToDomain(record);
  }

  async findByWebhookId(
    webhookId: string,
    options?: {
      limit?: number;
      offset?: number;
      status?: string;
    }
  ): Promise<{ events: WebhookEvent[]; total: number }> {
    const where: any = { webhookId };

    if (options?.status) {
      where.status = options.status;
    }

    const [events, total] = await Promise.all([
      this.prisma.integrationLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: options?.offset ?? 0,
        take: options?.limit ?? 50,
      }),
      this.prisma.integrationLog.count({ where }),
    ]);

    return {
      events: events.map((e: any) => this.mapToDomain(e)),
      total,
    };
  }

  async findByIntegrationId(
    integrationId: string,
    options?: {
      limit?: number;
      offset?: number;
      status?: string;
    }
  ): Promise<{ events: WebhookEvent[]; total: number }> {
    const where: any = { integrationId };

    if (options?.status) {
      where.status = options.status;
    }

    const [events, total] = await Promise.all([
      this.prisma.integrationLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: options?.offset ?? 0,
        take: options?.limit ?? 50,
      }),
      this.prisma.integrationLog.count({ where }),
    ]);

    return {
      events: events.map((e: any) => this.mapToDomain(e)),
      total,
    };
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    options?: {
      webhookId?: string;
      integrationId?: string;
      limit?: number;
    }
  ): Promise<WebhookEvent[]> {
    const where: any = {
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (options?.webhookId) {
      where.webhookId = options.webhookId;
    }

    if (options?.integrationId) {
      where.integrationId = options.integrationId;
    }

    const events = await this.prisma.integrationLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: options?.limit ?? 1000,
    });

    return events.map((e: any) => this.mapToDomain(e));
  }

  async getStats(
    webhookId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    total: number;
    success: number;
    failed: number;
    pending: number;
  }> {
    const where = {
      webhookId,
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    };

    const [total, success, failed, pending] = await Promise.all([
      this.prisma.integrationLog.count({ where }),
      this.prisma.integrationLog.count({ where: { ...where, status: 'success' } }),
      this.prisma.integrationLog.count({ where: { ...where, status: 'failed' } }),
      this.prisma.integrationLog.count({ where: { ...where, status: 'pending' } }),
    ]);

    return { total, success, failed, pending };
  }

  async deleteOlderThan(date: Date): Promise<number> {
    const result = await this.prisma.integrationLog.deleteMany({
      where: {
        timestamp: {
          lt: date,
        },
      },
    });

    return result.count;
  }

  private mapToDomain(record: any): WebhookEvent {
    return WebhookEvent.reconstitute(
      WebhookEventId.fromValue(record.id),
      {
        integrationId: record.integrationId,
        webhookId: record.webhookId,
        action: record.action,
        status: record.status,
        requestData: record.requestData,
        responseData: record.responseData,
        errorDetails: record.errorDetails,
        timestamp: record.timestamp,
        duration: record.duration,
        retryCount: record.retryCount,
        statusCode: record.statusCode,
      }
    );
  }
}
