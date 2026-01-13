import { PrismaClient } from '@prisma/client';
import { IAuditLogRepository } from '../../domain/repositories/audit-log-repository';
import { AuditLog } from '../../domain/entities/audit-log';

/**
 * Prisma Audit Log Repository
 * Prisma implementation of audit log repository
 */
export class PrismaAuditLogRepository implements IAuditLogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<AuditLog | null> {
    const auditLog = await this.prisma.auditLog.findUnique({
      where: { id },
    });

    if (!auditLog) {
      return null;
    }

    return AuditLog.create({
      id: auditLog.id,
      action: auditLog.action,
      resource: auditLog.resource,
      resourceId: auditLog.resourceId ?? undefined,
      userId: auditLog.userId ?? undefined,
      organizationId: auditLog.organizationId ?? undefined,
      sessionId: auditLog.sessionId ?? undefined,
      ipAddress: auditLog.ipAddress ?? undefined,
      userAgent: auditLog.userAgent ?? undefined,
      endpoint: auditLog.endpoint ?? undefined,
      method: auditLog.method ?? undefined,
      oldValues: auditLog.oldValues ?? undefined,
      newValues: auditLog.newValues ?? undefined,
      metadata: auditLog.metadata,
      status: auditLog.status,
      severity: auditLog.severity,
      category: auditLog.category,
      retentionDate: auditLog.retentionDate ?? undefined,
      isArchived: auditLog.isArchived,
      createdAt: auditLog.createdAt,
    });
  }

  async findAll(): Promise<AuditLog[]> {
    const auditLogs = await this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return auditLogs.map(log =>
      AuditLog.create({
        id: log.id,
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId ?? undefined,
        userId: log.userId ?? undefined,
        organizationId: log.organizationId ?? undefined,
        sessionId: log.sessionId ?? undefined,
        ipAddress: log.ipAddress ?? undefined,
        userAgent: log.userAgent ?? undefined,
        endpoint: log.endpoint ?? undefined,
        method: log.method ?? undefined,
        oldValues: log.oldValues ?? undefined,
        newValues: log.newValues ?? undefined,
        metadata: log.metadata,
        status: log.status,
        severity: log.severity,
        category: log.category,
        retentionDate: log.retentionDate ?? undefined,
        isArchived: log.isArchived,
        createdAt: log.createdAt,
      }),
    );
  }

  async findByUserId(userId: string): Promise<AuditLog[]> {
    const auditLogs = await this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return auditLogs.map(log =>
      AuditLog.create({
        id: log.id,
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId ?? undefined,
        userId: log.userId ?? undefined,
        organizationId: log.organizationId ?? undefined,
        sessionId: log.sessionId ?? undefined,
        ipAddress: log.ipAddress ?? undefined,
        userAgent: log.userAgent ?? undefined,
        endpoint: log.endpoint ?? undefined,
        method: log.method ?? undefined,
        oldValues: log.oldValues ?? undefined,
        newValues: log.newValues ?? undefined,
        metadata: log.metadata,
        status: log.status,
        severity: log.severity,
        category: log.category,
        retentionDate: log.retentionDate ?? undefined,
        isArchived: log.isArchived,
        createdAt: log.createdAt,
      }),
    );
  }

  async findByOrganizationId(organizationId: string): Promise<AuditLog[]> {
    const auditLogs = await this.prisma.auditLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });

    return auditLogs.map(log =>
      AuditLog.create({
        id: log.id,
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId ?? undefined,
        userId: log.userId ?? undefined,
        organizationId: log.organizationId ?? undefined,
        sessionId: log.sessionId ?? undefined,
        ipAddress: log.ipAddress ?? undefined,
        userAgent: log.userAgent ?? undefined,
        endpoint: log.endpoint ?? undefined,
        method: log.method ?? undefined,
        oldValues: log.oldValues ?? undefined,
        newValues: log.newValues ?? undefined,
        metadata: log.metadata,
        status: log.status,
        severity: log.severity,
        category: log.category,
        retentionDate: log.retentionDate ?? undefined,
        isArchived: log.isArchived,
        createdAt: log.createdAt,
      }),
    );
  }

  async findByAction(action: string): Promise<AuditLog[]> {
    const auditLogs = await this.prisma.auditLog.findMany({
      where: { action },
      orderBy: { createdAt: 'desc' },
    });

    return auditLogs.map(log =>
      AuditLog.create({
        id: log.id,
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId ?? undefined,
        userId: log.userId ?? undefined,
        organizationId: log.organizationId ?? undefined,
        sessionId: log.sessionId ?? undefined,
        ipAddress: log.ipAddress ?? undefined,
        userAgent: log.userAgent ?? undefined,
        endpoint: log.endpoint ?? undefined,
        method: log.method ?? undefined,
        oldValues: log.oldValues ?? undefined,
        newValues: log.newValues ?? undefined,
        metadata: log.metadata,
        status: log.status,
        severity: log.severity,
        category: log.category,
        retentionDate: log.retentionDate ?? undefined,
        isArchived: log.isArchived,
        createdAt: log.createdAt,
      }),
    );
  }

  async findByResource(resource: string): Promise<AuditLog[]> {
    const auditLogs = await this.prisma.auditLog.findMany({
      where: { resource },
      orderBy: { createdAt: 'desc' },
    });

    return auditLogs.map(log =>
      AuditLog.create({
        id: log.id,
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId ?? undefined,
        userId: log.userId ?? undefined,
        organizationId: log.organizationId ?? undefined,
        sessionId: log.sessionId ?? undefined,
        ipAddress: log.ipAddress ?? undefined,
        userAgent: log.userAgent ?? undefined,
        endpoint: log.endpoint ?? undefined,
        method: log.method ?? undefined,
        oldValues: log.oldValues ?? undefined,
        newValues: log.newValues ?? undefined,
        metadata: log.metadata,
        status: log.status,
        severity: log.severity,
        category: log.category,
        retentionDate: log.retentionDate ?? undefined,
        isArchived: log.isArchived,
        createdAt: log.createdAt,
      }),
    );
  }

  async findByCategory(category: string): Promise<AuditLog[]> {
    const auditLogs = await this.prisma.auditLog.findMany({
      where: { category },
      orderBy: { createdAt: 'desc' },
    });

    return auditLogs.map(log =>
      AuditLog.create({
        id: log.id,
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId ?? undefined,
        userId: log.userId ?? undefined,
        organizationId: log.organizationId ?? undefined,
        sessionId: log.sessionId ?? undefined,
        ipAddress: log.ipAddress ?? undefined,
        userAgent: log.userAgent ?? undefined,
        endpoint: log.endpoint ?? undefined,
        method: log.method ?? undefined,
        oldValues: log.oldValues ?? undefined,
        newValues: log.newValues ?? undefined,
        metadata: log.metadata,
        status: log.status,
        severity: log.severity,
        category: log.category,
        retentionDate: log.retentionDate ?? undefined,
        isArchived: log.isArchived,
        createdAt: log.createdAt,
      }),
    );
  }

  async findBySeverity(severity: string): Promise<AuditLog[]> {
    const auditLogs = await this.prisma.auditLog.findMany({
      where: { severity },
      orderBy: { createdAt: 'desc' },
    });

    return auditLogs.map(log =>
      AuditLog.create({
        id: log.id,
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId ?? undefined,
        userId: log.userId ?? undefined,
        organizationId: log.organizationId ?? undefined,
        sessionId: log.sessionId ?? undefined,
        ipAddress: log.ipAddress ?? undefined,
        userAgent: log.userAgent ?? undefined,
        endpoint: log.endpoint ?? undefined,
        method: log.method ?? undefined,
        oldValues: log.oldValues ?? undefined,
        newValues: log.newValues ?? undefined,
        metadata: log.metadata,
        status: log.status,
        severity: log.severity,
        category: log.category,
        retentionDate: log.retentionDate ?? undefined,
        isArchived: log.isArchived,
        createdAt: log.createdAt,
      }),
    );
  }

  async findByFilters(filters: {
    userId?: string;
    organizationId?: string;
    action?: string;
    resource?: string;
    category?: string;
    severity?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: AuditLog[]; total: number }> {
    const where: any = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }
    if (filters.organizationId) {
      where.organizationId = filters.organizationId;
    }
    if (filters.action) {
      where.action = filters.action;
    }
    if (filters.resource) {
      where.resource = filters.resource;
    }
    if (filters.category) {
      where.category = filters.category;
    }
    if (filters.severity) {
      where.severity = filters.severity;
    }
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 100,
        skip: filters.offset || 0,
      }).then(logs =>
        logs.map(log =>
          AuditLog.create({
            id: log.id,
            action: log.action,
            resource: log.resource,
            resourceId: log.resourceId ?? undefined,
            userId: log.userId ?? undefined,
            organizationId: log.organizationId ?? undefined,
            sessionId: log.sessionId ?? undefined,
            ipAddress: log.ipAddress ?? undefined,
            userAgent: log.userAgent ?? undefined,
            endpoint: log.endpoint ?? undefined,
            method: log.method ?? undefined,
            oldValues: log.oldValues ?? undefined,
            newValues: log.newValues ?? undefined,
            metadata: log.metadata,
            status: log.status,
            severity: log.severity,
            category: log.category,
            retentionDate: log.retentionDate ?? undefined,
            isArchived: log.isArchived,
            createdAt: log.createdAt,
          }),
        ),
      ),
      this.prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
  }

  async save(auditLog: AuditLog): Promise<AuditLog> {
    const saved = await this.prisma.auditLog.create({
      data: {
        id: auditLog.getId(),
        action: auditLog.getAction(),
        resource: auditLog.getResource(),
        resourceId: auditLog.getResourceId(),
        userId: auditLog.getUserId(),
        organizationId: auditLog.getOrganizationId(),
        sessionId: auditLog.getSessionId(),
        ipAddress: auditLog.getIpAddress(),
        userAgent: auditLog.getUserAgent(),
        endpoint: auditLog.getEndpoint(),
        method: auditLog.getMethod(),
        oldValues: auditLog.getOldValues(),
        newValues: auditLog.getNewValues(),
        metadata: auditLog.getMetadata(),
        status: auditLog.getStatus(),
        severity: auditLog.getSeverity(),
        category: auditLog.getCategory(),
        retentionDate: auditLog.getRetentionDate(),
        isArchived: auditLog.isArchived(),
        createdAt: auditLog.getCreatedAt(),
      },
    });

    return AuditLog.create({
      id: saved.id,
      action: saved.action,
      resource: saved.resource,
      resourceId: saved.resourceId ?? undefined,
      userId: saved.userId ?? undefined,
      organizationId: saved.organizationId ?? undefined,
      sessionId: saved.sessionId ?? undefined,
      ipAddress: saved.ipAddress ?? undefined,
      userAgent: saved.userAgent ?? undefined,
      endpoint: saved.endpoint ?? undefined,
      method: saved.method ?? undefined,
      oldValues: saved.oldValues ?? undefined,
      newValues: saved.newValues ?? undefined,
      metadata: saved.metadata,
      status: saved.status,
      severity: saved.severity,
      category: saved.category,
      retentionDate: saved.retentionDate ?? undefined,
      isArchived: saved.isArchived,
      createdAt: saved.createdAt,
    });
  }

  async update(auditLog: AuditLog): Promise<AuditLog> {
    const updated = await this.prisma.auditLog.update({
      where: { id: auditLog.getId() },
      data: {
        status: auditLog.getStatus(),
        metadata: auditLog.getMetadata(),
        retentionDate: auditLog.getRetentionDate(),
        isArchived: auditLog.isArchived(),
      },
    });

    return AuditLog.create({
      id: updated.id,
      action: updated.action,
      resource: updated.resource,
      resourceId: updated.resourceId ?? undefined,
      userId: updated.userId ?? undefined,
      organizationId: updated.organizationId ?? undefined,
      sessionId: updated.sessionId ?? undefined,
      ipAddress: updated.ipAddress ?? undefined,
      userAgent: updated.userAgent ?? undefined,
      endpoint: updated.endpoint ?? undefined,
      method: updated.method ?? undefined,
      oldValues: updated.oldValues ?? undefined,
      newValues: updated.newValues ?? undefined,
      metadata: updated.metadata,
      status: updated.status,
      severity: updated.severity,
      category: updated.category,
      retentionDate: updated.retentionDate ?? undefined,
      isArchived: updated.isArchived,
      createdAt: updated.createdAt,
    });
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await this.prisma.auditLog.delete({
      where: { id },
    });

    return (deleted as any).count > 0;
  }

  async deleteByUserId(userId: string): Promise<number> {
    const deleted = await this.prisma.auditLog.deleteMany({
      where: { userId },
    });

    return deleted.count;
  }

  async deleteByOrganizationId(organizationId: string): Promise<number> {
    const deleted = await this.prisma.auditLog.deleteMany({
      where: { organizationId },
    });

    return deleted.count;
  }

  async archive(id: string): Promise<AuditLog | null> {
    const auditLog = await this.findById(id);

    if (!auditLog) {
      return null;
    }

    const archived = auditLog.archive();
    return await this.update(archived);
  }

  async archiveByRetentionDate(retentionDate: Date): Promise<number> {
    const archived = await this.prisma.auditLog.updateMany({
      where: {
        retentionDate: {
          lte: retentionDate,
        },
        isArchived: false,
      },
      data: {
        isArchived: true,
      },
    });

    return archived.count;
  }

  async count(filters?: {
    userId?: string;
    organizationId?: string;
    action?: string;
    resource?: string;
    category?: string;
    severity?: string;
    isArchived?: boolean;
  }): Promise<number> {
    const where: any = {};

    if (filters?.userId) {
      where.userId = filters.userId;
    }
    if (filters?.organizationId) {
      where.organizationId = filters.organizationId;
    }
    if (filters?.action) {
      where.action = filters.action;
    }
    if (filters?.resource) {
      where.resource = filters.resource;
    }
    if (filters?.category) {
      where.category = filters.category;
    }
    if (filters?.severity) {
      where.severity = filters.severity;
    }
    if (filters?.isArchived !== undefined) {
      where.isArchived = filters.isArchived;
    }

    return this.prisma.auditLog.count({ where });
  }
}

/**
 * Factory function to create PrismaAuditLogRepository
 */
export function createPrismaAuditLogRepository(prisma: PrismaClient): PrismaAuditLogRepository {
  return new PrismaAuditLogRepository(prisma);
}
