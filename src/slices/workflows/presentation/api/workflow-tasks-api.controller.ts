import { injectable, inject } from 'inversify';
import { NextRequest, NextResponse } from 'next/server';
import { GetWorkflowTaskQuery } from '../../application/queries/get-task-query';
import { ListWorkflowTasksQuery } from '../../application/queries/list-tasks-query';
import { UpdateWorkflowTaskCommand } from '../../application/commands/update-task-command';
import { CompleteWorkflowTaskCommand } from '../../application/commands/complete-task-command';
import { GetWorkflowTaskHandler } from '../../application/handlers/get-task-handler';
import { ListWorkflowTasksHandler } from '../../application/handlers/list-tasks-handler';
import { UpdateWorkflowTaskHandler } from '../../application/handlers/update-task-handler';
import { CompleteWorkflowTaskHandler } from '../../application/handlers/complete-task-handler';
import { TYPES } from '@/shared/infrastructure/di/types';
import { WorkflowTaskStatus, TaskType } from '../../domain/entities/workflow-task';

/**
 * Workflow Tasks API Controller
 * Handles HTTP requests for workflow task management
 */
@injectable()
export class WorkflowTasksApiController {
  constructor(
    @inject(TYPES.GetWorkflowTaskHandler) private getTaskHandler: GetWorkflowTaskHandler,
    @inject(TYPES.ListWorkflowTasksHandler) private listTasksHandler: ListWorkflowTasksHandler,
    @inject(TYPES.UpdateWorkflowTaskHandler) private updateTaskHandler: UpdateWorkflowTaskHandler,
    @inject(TYPES.CompleteWorkflowTaskHandler) private completeTaskHandler: CompleteWorkflowTaskHandler
  ) {}

  /**
   * GET /api/workflows/tasks
   * Get workflow tasks with filtering and pagination
   */
  async getTasks(request: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url);

      const query = new ListWorkflowTasksQuery({
        instanceId: searchParams.get('instanceId') || undefined,
        assigneeId: searchParams.get('assigneeId') || undefined,
        status: (searchParams.get('status') as WorkflowTaskStatus) || undefined,
        taskType: (searchParams.get('taskType') as TaskType) || undefined,
        isOverdue: searchParams.get('isOverdue') === 'true' ? true : undefined,
        limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
        offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
        sortBy: searchParams.get('sortBy') || 'createdAt',
        sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
      });

      const result = await this.listTasksHandler.handle(query);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error?.message || 'Failed to fetch tasks' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        tasks: result.value.tasks.map((t) => t.toObject()),
        total: result.value.total,
      });
    } catch (error) {
      console.error('Error in WorkflowTasksApiController.getTasks:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * GET /api/workflows/tasks/[id]
   * Get workflow task by ID
   */
  async getTask(taskId: string): Promise<NextResponse> {
    try {
      const query = new GetWorkflowTaskQuery({
        taskId,
      });

      const result = await this.getTaskHandler.handle(query);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error?.message || 'Task not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        result.value.toObject(),
        { status: 200 }
      );
    } catch (error) {
      console.error('Error in WorkflowTasksApiController.getTask:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * PUT /api/workflows/tasks/[id]
   * Update workflow task
   */
  async updateTask(taskId: string, request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();
      const userId = request.headers.get('x-user-id') || undefined;

      const command = new UpdateWorkflowTaskCommand({
        taskId,
        formData: body.formData,
      }, userId);

      const result = await this.updateTaskHandler.handle(command);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error?.message || 'Failed to update task' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        result.value.toObject(),
        { status: 200 }
      );
    } catch (error) {
      console.error('Error in WorkflowTasksApiController.updateTask:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * POST /api/workflows/tasks/[id]/complete
   * Complete workflow task
   */
  async completeTask(taskId: string, request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();
      const userId = request.headers.get('x-user-id') || undefined;

      const command = new CompleteWorkflowTaskCommand({
        taskId,
        result: body.result,
      }, userId);

      const result = await this.completeTaskHandler.handle(command);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error?.message || 'Failed to complete task' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        result.value.toObject(),
        { status: 200 }
      );
    } catch (error) {
      console.error('Error in WorkflowTasksApiController.completeTask:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
}
