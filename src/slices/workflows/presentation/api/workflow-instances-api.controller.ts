import { injectable, inject } from 'inversify';
import { NextRequest, NextResponse } from 'next/server';
import { CreateWorkflowInstanceCommand } from '../../application/commands/create-instance-command';
import { UpdateWorkflowInstanceCommand } from '../../application/commands/update-instance-command';
import { GetWorkflowInstanceQuery } from '../../application/queries/get-instance-query';
import { ListWorkflowInstancesQuery } from '../../application/queries/list-instances-query';
import { CreateWorkflowInstanceHandler } from '../../application/handlers/create-instance-handler';
import { UpdateWorkflowInstanceHandler } from '../../application/handlers/update-instance-handler';
import { PerformWorkflowActionHandler } from '../../application/handlers/perform-action-handler';
import { GetWorkflowInstanceHandler } from '../../application/handlers/get-instance-handler';
import { ListWorkflowInstancesHandler } from '../../application/handlers/list-instances-handler';
import { TYPES } from '@/shared/infrastructure/di/types';
import { WorkflowInstanceStatus } from '../../domain/entities/workflow-instance';

/**
 * Workflow Instances API Controller
 * Handles HTTP requests for workflow instance management
 */
@injectable()
export class WorkflowInstancesApiController {
  constructor(
    @inject(TYPES.CreateWorkflowInstanceHandler) private createInstanceHandler: CreateWorkflowInstanceHandler,
    @inject(TYPES.UpdateWorkflowInstanceHandler) private updateInstanceHandler: UpdateWorkflowInstanceHandler,
    @inject(TYPES.PerformWorkflowActionHandler) private performActionHandler: PerformWorkflowActionHandler,
    @inject(TYPES.GetWorkflowInstanceHandler) private getInstanceHandler: GetWorkflowInstanceHandler,
    @inject(TYPES.ListWorkflowInstancesHandler) private listInstancesHandler: ListWorkflowInstancesHandler
  ) {}

  /**
   * GET /api/workflows/instances
   * Get workflow instances with filtering and pagination
   */
  async getInstances(request: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url);

      const query = new ListWorkflowInstancesQuery({
        workflowId: searchParams.get('workflowId') || undefined,
        status: (searchParams.get('status') as WorkflowInstanceStatus) || undefined,
        organizationId: searchParams.get('organizationId') || undefined,
        triggeredBy: searchParams.get('triggeredBy') || undefined,
        limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
        offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
        sortBy: searchParams.get('sortBy') || 'startedAt',
        sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
      });

      const result = await this.listInstancesHandler.handle(query);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error?.message || 'Failed to fetch instances' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        instances: result.value.instances.map((i) => i.toObject()),
        total: result.value.total,
      });
    } catch (error) {
      console.error('Error in WorkflowInstancesApiController.getInstances:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * GET /api/workflows/instances/[id]
   * Get workflow instance by ID
   */
  async getInstance(instanceId: string): Promise<NextResponse> {
    try {
      const query = new GetWorkflowInstanceQuery({
        instanceId,
      });

      const result = await this.getInstanceHandler.handle(query);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error?.message || 'Instance not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        result.value.toObject(),
        { status: 200 }
      );
    } catch (error) {
      console.error('Error in WorkflowInstancesApiController.getInstance:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * POST /api/workflows/instances
   * Create a new workflow instance
   */
  async createInstance(request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();
      const userId = request.headers.get('x-user-id') || undefined;

      const command = new CreateWorkflowInstanceCommand({
        workflowId: body.workflowId,
        triggeredBy: userId,
        triggerType: body.triggerType,
        triggerData: body.triggerData ? JSON.stringify(body.triggerData) : undefined,
        data: body.data ? JSON.stringify(body.data) : undefined,
        variables: body.variables ? JSON.stringify(body.variables) : undefined,
        priority: body.priority,
        slaDeadline: body.slaDeadline ? new Date(body.slaDeadline) : undefined,
      }, userId);

      const result = await this.createInstanceHandler.handle(command);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error?.message || 'Failed to create instance' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        result.value.toObject(),
        { status: 201 }
      );
    } catch (error) {
      console.error('Error in WorkflowInstancesApiController.createInstance:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * PUT /api/workflows/instances/[id]
   * Update workflow instance
   */
  async updateInstance(instanceId: string, request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();
      const userId = request.headers.get('x-user-id') || undefined;

      const command = new UpdateWorkflowInstanceCommand({
        instanceId,
        data: body.data ? JSON.stringify(body.data) : undefined,
        variables: body.variables ? JSON.stringify(body.variables) : undefined,
        context: body.context ? JSON.stringify(body.context) : undefined,
        currentStepId: body.currentStepId,
      }, userId);

      const result = await this.updateInstanceHandler.handle(command);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error?.message || 'Failed to update instance' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        result.value.toObject(),
        { status: 200 }
      );
    } catch (error) {
      console.error('Error in WorkflowInstancesApiController.updateInstance:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * POST /api/workflows/instances/[id]/action
   * Perform workflow action (pause, resume, cancel, complete, fail)
   */
  async performAction(instanceId: string, request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();
      const userId = request.headers.get('x-user-id') || undefined;

      const command = new UpdateWorkflowInstanceCommand({
        instanceId,
        data: body.data ? JSON.stringify(body.data) : undefined,
        variables: body.variables ? JSON.stringify(body.variables) : undefined,
        currentStepId: body.action, // Use action field to specify the action
      }, userId);

      const result = await this.performActionHandler.handle(command);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error?.message || 'Failed to perform action' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        result.value.toObject(),
        { status: 200 }
      );
    } catch (error) {
      console.error('Error in WorkflowInstancesApiController.performAction:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
}
