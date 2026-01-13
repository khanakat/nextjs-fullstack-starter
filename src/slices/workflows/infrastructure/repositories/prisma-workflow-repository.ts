import { injectable, inject } from 'inversify';
import { IWorkflowRepository } from '../../../workflows/domain/repositories/workflow-repository';
import { Workflow, WorkflowStatus } from '../../../workflows/domain/entities/workflow';
import { WorkflowId } from '../../../workflows/domain/value-objects/workflow-id';
import { PrismaClient } from '@prisma/client';

/**
 * Prisma Workflow Repository
 * Implements workflow data access using Prisma ORM
 */
@injectable()
export class PrismaWorkflowRepository implements IWorkflowRepository {
  constructor(private prisma: PrismaClient) {}

  async save(workflow: Workflow): Promise<void> {
    const data = workflow.toPersistence();

    await this.prisma.workflow.create({
      data: {
        name: data.name,
        description: data.description,
        version: data.version,
        status: data.status,
        definition: data.definition,
        settings: data.settings,
        variables: data.variables,
        organizationId: data.organizationId,
        isTemplate: data.isTemplate,
        isPublic: data.isPublic,
        createdBy: data.createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async findById(id: WorkflowId): Promise<Workflow | null> {
    const record = await this.prisma.workflow.findUnique({
      where: { id: id.value },
    });

    if (!record) {
      return null;
    }

    return Workflow.reconstitute(
      WorkflowId.fromValue(record.id),
      {
        name: record.name,
        description: record.description ?? undefined,
        version: record.version,
        status: record.status as WorkflowStatus,
        definition: record.definition,
        settings: record.settings,
        variables: record.variables,
        organizationId: record.organizationId ?? undefined,
        isTemplate: record.isTemplate,
        isPublic: record.isPublic,
      }
    );
  }

  async findAll(): Promise<Workflow[]> {
    const records = await this.prisma.workflow.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) =>
      Workflow.reconstitute(
        WorkflowId.fromValue(record.id),
        {
          name: record.name,
          description: record.description ?? undefined,
          version: record.version,
          status: record.status as WorkflowStatus,
          definition: record.definition,
          settings: record.settings,
          variables: record.variables,
          organizationId: record.organizationId ?? undefined,
          isTemplate: record.isTemplate,
          isPublic: record.isPublic,
        }
      )
    );
  }

  async findByOrganizationId(organizationId: string): Promise<Workflow[]> {
    const records = await this.prisma.workflow.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) =>
      Workflow.reconstitute(
        WorkflowId.fromValue(record.id),
        {
          name: record.name,
          description: record.description ?? undefined,
          version: record.version,
          status: record.status as WorkflowStatus,
          definition: record.definition,
          settings: record.settings,
          variables: record.variables,
          organizationId: record.organizationId ?? undefined,
          isTemplate: record.isTemplate,
          isPublic: record.isPublic,
        }
      )
    );
  }

  async findByStatus(status: WorkflowStatus): Promise<Workflow[]> {
    const records = await this.prisma.workflow.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) =>
      Workflow.reconstitute(
        WorkflowId.fromValue(record.id),
        {
          name: record.name,
          description: record.description ?? undefined,
          version: record.version,
          status: record.status as WorkflowStatus,
          definition: record.definition,
          settings: record.settings,
          variables: record.variables,
          organizationId: record.organizationId ?? undefined,
          isTemplate: record.isTemplate,
          isPublic: record.isPublic,
        }
      )
    );
  }

  async findPublic(): Promise<Workflow[]> {
    const records = await this.prisma.workflow.findMany({
      where: {
        isPublic: true,
        status: WorkflowStatus.ACTIVE,
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) =>
      Workflow.reconstitute(
        WorkflowId.fromValue(record.id),
        {
          name: record.name,
          description: record.description ?? undefined,
          version: record.version,
          status: record.status as WorkflowStatus,
          definition: record.definition,
          settings: record.settings,
          variables: record.variables,
          organizationId: record.organizationId ?? undefined,
          isTemplate: record.isTemplate,
          isPublic: record.isPublic,
        }
      )
    );
  }

  async findTemplates(): Promise<Workflow[]> {
    const records = await this.prisma.workflow.findMany({
      where: {
        isTemplate: true,
        isPublic: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) =>
      Workflow.reconstitute(
        WorkflowId.fromValue(record.id),
        {
          name: record.name,
          description: record.description ?? undefined,
          version: record.version,
          status: record.status as WorkflowStatus,
          definition: record.definition,
          settings: record.settings,
          variables: record.variables,
          organizationId: record.organizationId ?? undefined,
          isTemplate: record.isTemplate,
          isPublic: record.isPublic,
        }
      )
    );
  }

  async update(workflow: Workflow): Promise<void> {
    const data = workflow.toPersistence();

    await this.prisma.workflow.update({
      where: { id: workflow.id.toString() },
      data: {
        name: data.name,
        description: data.description,
        version: data.version,
        status: data.status,
        definition: data.definition,
        settings: data.settings,
        variables: data.variables,
        organizationId: data.organizationId,
        isTemplate: data.isTemplate,
        isPublic: data.isPublic,
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: WorkflowId): Promise<void> {
    await this.prisma.workflow.delete({
      where: { id: id.value },
    });
  }

  async countByOrganization(organizationId: string): Promise<number> {
    return await this.prisma.workflow.count({
      where: { organizationId },
    });
  }

  async countByStatus(status: WorkflowStatus): Promise<number> {
    return await this.prisma.workflow.count({
      where: { status },
    });
  }
}
