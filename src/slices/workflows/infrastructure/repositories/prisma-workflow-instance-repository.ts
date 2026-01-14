import { injectable } from 'inversify';
import {
  IWorkflowInstanceRepository,
  WorkflowInstance,
  WorkflowInstanceStatus,
  Priority,
} from '../../domain/repositories/workflow-instance-repository';
import { WorkflowInstanceId } from '../../domain/value-objects/workflow-instance-id';
import { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';

/**
 * Prisma Workflow Instance Repository
 * Implements workflow instance data access using Prisma ORM
 */
@injectable()
export class PrismaWorkflowInstanceRepository
  implements IWorkflowInstanceRepository
{
  constructor(private prisma: PrismaClient) {}

  async save(instance: WorkflowInstance): Promise<void> {
    const data = instance.toPersistence();

    // Use upsert to handle both create and update
    await this.prisma.workflowInstance.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        workflowId: data.workflowId,
        status: data.status,
        currentStepId: data.currentStepId,
        data: data.data,
        variables: data.variables,
        context: data.context,
        triggeredBy: data.triggeredBy,
        triggerType: data.triggerType,
        triggerData: data.triggerData,
        startedAt: data.startedAt,
        completedAt: data.completedAt,
        pausedAt: data.pausedAt,
        duration: data.duration,
        errorMessage: data.errorMessage,
        errorStep: data.errorStep,
        retryCount: data.retryCount,
        priority: data.priority,
        slaDeadline: data.slaDeadline,
      },
      update: {
        status: data.status,
        currentStepId: data.currentStepId,
        data: data.data,
        variables: data.variables,
        context: data.context,
        completedAt: data.completedAt,
        pausedAt: data.pausedAt,
        duration: data.duration,
        errorMessage: data.errorMessage,
        errorStep: data.errorStep,
        retryCount: data.retryCount,
        slaDeadline: data.slaDeadline,
      },
    });
  }

  async findById(id: WorkflowInstanceId): Promise<WorkflowInstance | null> {
    const record = await this.prisma.workflowInstance.findUnique({
      where: { id: id.value },
    });

    if (!record) {
      return null;
    }

    return this.mapToDomain(record);
  }

  async findByWorkflowId(
    workflowId: string,
    options?: {
      status?: WorkflowInstanceStatus;
      limit?: number;
      offset?: number;
    }
  ): Promise<WorkflowInstance[]> {
    const where: Prisma.WorkflowInstanceWhereInput = {
      workflowId,
      ...(options?.status && { status: options.status }),
    };

    const records = await this.prisma.workflowInstance.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: options?.limit,
      skip: options?.offset,
    });

    return records.map((r) => this.mapToDomain(r));
  }

  async findByStatus(
    status: WorkflowInstanceStatus,
    options?: {
      organizationId?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<WorkflowInstance[]> {
    const where: Prisma.WorkflowInstanceWhereInput = {
      status,
      ...(options?.organizationId && {
        workflow: { organizationId: options.organizationId },
      }),
    };

    const records = await this.prisma.workflowInstance.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: options?.limit,
      skip: options?.offset,
    });

    return records.map((r) => this.mapToDomain(r));
  }

  async findAll(options?: {
    workflowId?: string;
    status?: WorkflowInstanceStatus;
    organizationId?: string;
    triggeredBy?: string;
    priority?: Priority;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ instances: WorkflowInstance[]; total: number }> {
    const where: Prisma.WorkflowInstanceWhereInput = {
      ...(options?.workflowId && { workflowId: options.workflowId }),
      ...(options?.status && { status: options.status }),
      ...(options?.triggeredBy && { triggeredBy: options.triggeredBy }),
      ...(options?.priority && { priority: options.priority }),
      ...(options?.organizationId && {
        workflow: { organizationId: options.organizationId },
      }),
      ...(options?.startDate || options?.endDate
        ? {
            startedAt: {
              ...(options?.startDate && { gte: options.startDate }),
              ...(options?.endDate && { lte: options.endDate }),
            },
          }
        : {}),
    };

    const [records, total] = await Promise.all([
      this.prisma.workflowInstance.findMany({
        where,
        orderBy: {
          [options?.sortBy || 'startedAt']:
            options?.sortOrder || 'desc',
        },
        take: options?.limit || 20,
        skip: options?.offset || 0,
      }),
      this.prisma.workflowInstance.count({ where }),
    ]);

    return {
      instances: records.map((r) => this.mapToDomain(r)),
      total,
    };
  }

  async delete(id: WorkflowInstanceId): Promise<void> {
    await this.prisma.workflowInstance.delete({
      where: { id: id.value },
    });
  }

  async countByStatus(
    status?: WorkflowInstanceStatus,
    organizationId?: string
  ): Promise<number> {
    const where: Prisma.WorkflowInstanceWhereInput = {
      ...(status && { status }),
      ...(organizationId && {
        workflow: { organizationId },
      }),
    };

    return await this.prisma.workflowInstance.count({ where });
  }

  async findActive(
    organizationId?: string,
    limit?: number
  ): Promise<WorkflowInstance[]> {
    const where: Prisma.WorkflowInstanceWhereInput = {
      status: { in: ['running', 'paused'] as any[] },
      ...(organizationId && {
        workflow: { organizationId },
      }),
    };

    const records = await this.prisma.workflowInstance.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: limit,
    });

    return records.map((r) => this.mapToDomain(r));
  }

  async findFailedWithRetryCount(
    maxRetryCount: number,
    limit?: number
  ): Promise<WorkflowInstance[]> {
    const records = await this.prisma.workflowInstance.findMany({
      where: {
        status: 'failed',
        retryCount: { lt: maxRetryCount },
      },
      orderBy: { retryCount: 'asc' },
      take: limit,
    });

    return records.map((r) => this.mapToDomain(r));
  }

  async findExceedingSLA(limit?: number): Promise<WorkflowInstance[]> {
    const now = new Date();

    const records = await this.prisma.workflowInstance.findMany({
      where: {
        status: { in: ['running', 'paused'] as any[] },
        slaDeadline: { lt: now },
      },
      orderBy: { slaDeadline: 'asc' },
      take: limit,
    });

    return records.map((r) => this.mapToDomain(r));
  }

  async updateStatus(
    id: WorkflowInstanceId,
    status: WorkflowInstanceStatus
  ): Promise<void> {
    await this.prisma.workflowInstance.update({
      where: { id: id.value },
      data: { status },
    });
  }

  async exists(id: WorkflowInstanceId): Promise<boolean> {
    const count = await this.prisma.workflowInstance.count({
      where: { id: id.value },
    });
    return count > 0;
  }

  /**
   * Map Prisma record to domain entity
   */
  private mapToDomain(record: any): WorkflowInstance {
    return WorkflowInstance.reconstitute(
      WorkflowInstanceId.fromValue(record.id),
      {
        workflowId: record.workflowId,
        status: record.status as WorkflowInstanceStatus,
        currentStepId: record.currentStepId ?? undefined,
        data: record.data,
        variables: record.variables,
        context: record.context,
        triggeredBy: record.triggeredBy ?? undefined,
        triggerType: record.triggerType as any,
        triggerData: record.triggerData,
        startedAt: record.startedAt,
        completedAt: record.completedAt ?? undefined,
        pausedAt: record.pausedAt ?? undefined,
        duration: record.duration ?? undefined,
        errorMessage: record.errorMessage ?? undefined,
        errorStep: record.errorStep ?? undefined,
        retryCount: record.retryCount,
        priority: record.priority as Priority,
        slaDeadline: record.slaDeadline ?? undefined,
      }
    );
  }
}
