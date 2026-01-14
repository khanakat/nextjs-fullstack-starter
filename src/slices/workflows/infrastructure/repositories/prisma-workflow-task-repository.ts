import { injectable } from 'inversify';
import {
  IWorkflowTaskRepository,
  WorkflowTask,
  WorkflowTaskStatus,
  TaskType,
  Priority,
} from '../../domain/repositories/workflow-task-repository';
import { WorkflowTaskId } from '../../domain/value-objects/workflow-task-id';
import { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';

/**
 * Prisma Workflow Task Repository
 * Implements workflow task data access using Prisma ORM
 */
@injectable()
export class PrismaWorkflowTaskRepository implements IWorkflowTaskRepository {
  constructor(private prisma: PrismaClient) {}

  async save(task: WorkflowTask): Promise<void> {
    const data = task.toPersistence();

    // Use upsert to handle both create and update
    await this.prisma.workflowTask.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        instanceId: data.instanceId,
        stepId: data.stepId,
        name: data.name,
        description: data.description,
        taskType: data.taskType,
        status: data.status,
        priority: data.priority,
        assigneeId: data.assigneeId,
        assignedBy: data.assignedBy,
        assignmentType: data.assignmentType,
        formData: data.formData,
        attachments: data.attachments,
        comments: data.comments,
        createdAt: data.createdAt,
        assignedAt: data.assignedAt,
        startedAt: data.startedAt,
        completedAt: data.completedAt,
        dueDate: data.dueDate,
        slaHours: data.slaHours,
        slaDeadline: data.slaDeadline,
        result: data.result,
        completedBy: data.completedBy,
        rejectedBy: data.rejectedBy,
        rejectionReason: data.rejectionReason,
      },
      update: {
        status: data.status,
        assigneeId: data.assigneeId,
        assignedBy: data.assignedBy,
        assignedAt: data.assignedAt,
        startedAt: data.startedAt,
        completedAt: data.completedAt,
        formData: data.formData,
        attachments: data.attachments,
        comments: data.comments,
        result: data.result,
        completedBy: data.completedBy,
        rejectedBy: data.rejectedBy,
        rejectionReason: data.rejectionReason,
      },
    });
  }

  async findById(id: WorkflowTaskId): Promise<WorkflowTask | null> {
    const record = await this.prisma.workflowTask.findUnique({
      where: { id: id.value },
    });

    if (!record) {
      return null;
    }

    return this.mapToDomain(record);
  }

  async findByInstanceId(
    instanceId: string,
    options?: {
      status?: WorkflowTaskStatus;
      taskType?: TaskType;
      limit?: number;
      offset?: number;
    }
  ): Promise<WorkflowTask[]> {
    const where: Prisma.WorkflowTaskWhereInput = {
      instanceId,
      ...(options?.status && { status: options.status }),
      ...(options?.taskType && { taskType: options.taskType }),
    };

    const records = await this.prisma.workflowTask.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: options?.limit,
      skip: options?.offset,
    });

    return records.map((r) => this.mapToDomain(r));
  }

  async findByAssigneeId(
    assigneeId: string,
    options?: {
      status?: WorkflowTaskStatus;
      taskType?: TaskType;
      isOverdue?: boolean;
      limit?: number;
      offset?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<{ tasks: WorkflowTask[]; total: number }> {
    const where: Prisma.WorkflowTaskWhereInput = {
      assigneeId,
      ...(options?.status && { status: options.status }),
      ...(options?.taskType && { taskType: options.taskType }),
      ...(options?.isOverdue && {
        dueDate: { lt: new Date() },
        status: { notIn: ['completed', 'rejected', 'cancelled'] },
      }),
    };

    const [records, total] = await Promise.all([
      this.prisma.workflowTask.findMany({
        where,
        orderBy: {
          [options?.sortBy || 'createdAt']:
            options?.sortOrder || 'desc',
        },
        take: options?.limit || 20,
        skip: options?.offset || 0,
      }),
      this.prisma.workflowTask.count({ where }),
    ]);

    return {
      tasks: records.map((r) => this.mapToDomain(r)),
      total,
    };
  }

  async findByStatus(
    status: WorkflowTaskStatus,
    options?: {
      organizationId?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<WorkflowTask[]> {
    const where: Prisma.WorkflowTaskWhereInput = {
      status,
      ...(options?.organizationId && {
        instance: {
          workflow: { organizationId: options.organizationId },
        },
      }),
    };

    const records = await this.prisma.workflowTask.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit,
      skip: options?.offset,
    });

    return records.map((r) => this.mapToDomain(r));
  }

  async findAll(options?: {
    instanceId?: string;
    assigneeId?: string;
    status?: WorkflowTaskStatus;
    taskType?: TaskType;
    priority?: Priority;
    isOverdue?: boolean;
    organizationId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ tasks: WorkflowTask[]; total: number }> {
    const where: Prisma.WorkflowTaskWhereInput = {
      ...(options?.instanceId && { instanceId: options.instanceId }),
      ...(options?.assigneeId && { assigneeId: options.assigneeId }),
      ...(options?.status && { status: options.status }),
      ...(options?.taskType && { taskType: options.taskType }),
      ...(options?.priority && { priority: options.priority }),
      ...(options?.isOverdue && {
        dueDate: { lt: new Date() },
        status: { notIn: ['completed', 'rejected', 'cancelled'] },
      }),
      ...(options?.organizationId && {
        instance: {
          workflow: { organizationId: options.organizationId },
        },
      }),
      ...(options?.startDate || options?.endDate
        ? {
            createdAt: {
              ...(options?.startDate && { gte: options.startDate }),
              ...(options?.endDate && { lte: options.endDate }),
            },
          }
        : {}),
    };

    const [records, total] = await Promise.all([
      this.prisma.workflowTask.findMany({
        where,
        orderBy: {
          [options?.sortBy || 'createdAt']:
            options?.sortOrder || 'desc',
        },
        take: options?.limit || 20,
        skip: options?.offset || 0,
      }),
      this.prisma.workflowTask.count({ where }),
    ]);

    return {
      tasks: records.map((r) => this.mapToDomain(r)),
      total,
    };
  }

  async delete(id: WorkflowTaskId): Promise<void> {
    await this.prisma.workflowTask.delete({
      where: { id: id.value },
    });
  }

  async countByStatus(
    status?: WorkflowTaskStatus,
    assigneeId?: string
  ): Promise<number> {
    const where: Prisma.WorkflowTaskWhereInput = {
      ...(status && { status }),
      ...(assigneeId && { assigneeId }),
    };

    return await this.prisma.workflowTask.count({ where });
  }

  async countByInstance(
    instanceId: string,
    status?: WorkflowTaskStatus
  ): Promise<number> {
    const where: Prisma.WorkflowTaskWhereInput = {
      instanceId,
      ...(status && { status }),
    };

    return await this.prisma.workflowTask.count({ where });
  }

  async findActive(
    assigneeId?: string,
    limit?: number
  ): Promise<WorkflowTask[]> {
    const where: Prisma.WorkflowTaskWhereInput = {
      status: { in: ['pending', 'in_progress'] as any[] },
      ...(assigneeId && { assigneeId }),
    };

    const records = await this.prisma.workflowTask.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return records.map((r) => this.mapToDomain(r));
  }

  async findOverdue(
    assigneeId?: string,
    limit?: number
  ): Promise<WorkflowTask[]> {
    const now = new Date();

    const where: Prisma.WorkflowTaskWhereInput = {
      dueDate: { lt: now },
      status: { notIn: ['completed', 'rejected', 'cancelled'] as any[] },
      ...(assigneeId && { assigneeId }),
    };

    const records = await this.prisma.workflowTask.findMany({
      where,
      orderBy: { dueDate: 'asc' },
      take: limit,
    });

    return records.map((r) => this.mapToDomain(r));
  }

  async findExceedingSLA(limit?: number): Promise<WorkflowTask[]> {
    const now = new Date();

    const records = await this.prisma.workflowTask.findMany({
      where: {
        status: { in: ['pending', 'in_progress'] as any[] },
        slaDeadline: { lt: now },
      },
      orderBy: { slaDeadline: 'asc' },
      take: limit,
    });

    return records.map((r) => this.mapToDomain(r));
  }

  async updateStatus(
    id: WorkflowTaskId,
    status: WorkflowTaskStatus
  ): Promise<void> {
    await this.prisma.workflowTask.update({
      where: { id: id.value },
      data: { status },
    });
  }

  async assignTo(
    id: WorkflowTaskId,
    assigneeId: string,
    assignedBy: string
  ): Promise<void> {
    await this.prisma.workflowTask.update({
      where: { id: id.value },
      data: {
        assigneeId,
        assignedBy,
        assignedAt: new Date(),
      },
    });
  }

  async exists(id: WorkflowTaskId): Promise<boolean> {
    const count = await this.prisma.workflowTask.count({
      where: { id: id.value },
    });
    return count > 0;
  }

  async saveMany(tasks: WorkflowTask[]): Promise<void> {
    const data = tasks.map((t) => t.toPersistence());

    await this.prisma.workflowTask.createMany({
      data: data as any[],
      skipDuplicates: true,
    });
  }

  /**
   * Map Prisma record to domain entity
   */
  private mapToDomain(record: any): WorkflowTask {
    return WorkflowTask.reconstitute(
      WorkflowTaskId.fromValue(record.id),
      {
        instanceId: record.instanceId,
        stepId: record.stepId,
        name: record.name,
        description: record.description ?? undefined,
        taskType: record.taskType as TaskType,
        status: record.status as WorkflowTaskStatus,
        priority: record.priority as Priority,
        assigneeId: record.assigneeId ?? undefined,
        assignedBy: record.assignedBy ?? undefined,
        assignmentType: record.assignmentType as any,
        formData: record.formData,
        attachments: record.attachments,
        comments: record.comments,
        createdAt: record.createdAt,
        assignedAt: record.assignedAt ?? undefined,
        startedAt: record.startedAt ?? undefined,
        completedAt: record.completedAt ?? undefined,
        dueDate: record.dueDate ?? undefined,
        slaHours: record.slaHours ?? undefined,
        slaDeadline: record.slaDeadline ?? undefined,
        result: record.result ?? undefined,
        completedBy: record.completedBy ?? undefined,
        rejectedBy: record.rejectedBy ?? undefined,
        rejectionReason: record.rejectionReason ?? undefined,
      }
    );
  }
}
