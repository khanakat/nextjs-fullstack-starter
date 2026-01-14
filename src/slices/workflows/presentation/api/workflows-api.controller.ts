import { injectable, inject } from 'inversify';
import { NextRequest, NextResponse } from 'next/server';
import { CreateWorkflowCommand } from '../../application/commands/create-workflow-command';
import { UpdateWorkflowCommand } from '../../application/commands/update-workflow-command';
import { DeleteWorkflowCommand } from '../../application/commands/delete-workflow-command';
import { GetWorkflowQuery } from '../../application/queries/get-workflow-query';
import { GetWorkflowsQuery } from '../../application/queries/get-workflows-query';
import { CreateWorkflowHandler } from '../../application/handlers/create-workflow-handler';
import { UpdateWorkflowHandler } from '../../application/handlers/update-workflow-handler';
import { DeleteWorkflowHandler } from '../../application/handlers/delete-workflow-handler';
import { GetWorkflowHandler } from '../../application/handlers/get-workflow-handler';
import { GetWorkflowsHandler } from '../../application/handlers/get-workflows-handler';
import { TYPES } from '@/shared/infrastructure/di/types';
import { Result } from '@/shared/application/base/result';
import { WorkflowStatus } from '../../domain/entities/workflow';

/**
 * Workflows API Controller
 * Handles HTTP requests for workflow management
 */
@injectable()
export class WorkflowsApiController {
  constructor(
    @inject(TYPES.CreateWorkflowHandler) private createWorkflowHandler: CreateWorkflowHandler,
    @inject(TYPES.UpdateWorkflowHandler) private updateWorkflowHandler: UpdateWorkflowHandler,
    @inject(TYPES.DeleteWorkflowHandler) private deleteWorkflowHandler: DeleteWorkflowHandler,
    @inject(TYPES.GetWorkflowHandler) private getWorkflowHandler: GetWorkflowHandler,
    @inject(TYPES.GetWorkflowsHandler) private getWorkflowsHandler: GetWorkflowsHandler
  ) {}

  /**
   * GET /api/workflows
   * Get workflows with filtering and pagination
   */
  async getWorkflows(request: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url);

      const query = new GetWorkflowsQuery({
        organizationId: searchParams.get('organizationId') || undefined,
        status: (searchParams.get('status') as WorkflowStatus) || undefined,
        isTemplate: searchParams.get('isTemplate') === 'true' ? true : undefined,
        isPublic: searchParams.get('isPublic') === 'true' ? true : undefined,
        limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
        offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
      });

      const result = await this.getWorkflowsHandler.handle(query);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { data: result.value },
        { status: 200 }
      );
    } catch (error) {
      console.error('Error in WorkflowsApiController.getWorkflows:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * GET /api/workflows/[id]
   * Get workflow by ID
   */
  async getWorkflow(workflowId: string): Promise<NextResponse> {
    try {
      const query = new GetWorkflowQuery({
        workflowId,
      });

      const result = await this.getWorkflowHandler.handle(query);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { data: result.value },
        { status: 200 }
      );
    } catch (error) {
      console.error('Error in WorkflowsApiController.getWorkflow:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * POST /api/workflows
   * Create a new workflow
   */
  async createWorkflow(request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();
      const userId = request.headers.get('x-user-id') || '';

      const command = new CreateWorkflowCommand({
        name: body.name,
        description: body.description || '',
        organizationId: body.organizationId,
        definition: body.definition || '{}',
        settings: body.settings || '{}',
        variables: body.variables || '{}',
        createdBy: userId,
        isTemplate: body.isTemplate,
        isPublic: body.isPublic,
        status: body.status,
      });

      const result = await this.createWorkflowHandler.handle(command);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { data: result.value },
        { status: 201 }
      );
    } catch (error) {
      console.error('Error in WorkflowsApiController.createWorkflow:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * PUT /api/workflows/[id]
   * Update a workflow
   */
  async updateWorkflow(workflowId: string, request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();
      const userId = request.headers.get('x-user-id') || '';

      const command = new UpdateWorkflowCommand({
        workflowId,
        name: body.name,
        description: body.description,
        definition: body.definition,
        settings: body.settings,
        variables: body.variables,
        isTemplate: body.isTemplate,
        isPublic: body.isPublic,
        status: body.status,
        userId,
      });

      const result = await this.updateWorkflowHandler.handle(command);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { data: result.value },
        { status: 200 }
      );
    } catch (error) {
      console.error('Error in WorkflowsApiController.updateWorkflow:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * DELETE /api/workflows/[id]
   * Delete a workflow
   */
  async deleteWorkflow(workflowId: string): Promise<NextResponse> {
    try {
      const command = new DeleteWorkflowCommand({
        workflowId,
      });

      const result = await this.deleteWorkflowHandler.handle(command);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { data: { success: true } },
        { status: 200 }
      );
    } catch (error) {
      console.error('Error in WorkflowsApiController.deleteWorkflow:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
}
