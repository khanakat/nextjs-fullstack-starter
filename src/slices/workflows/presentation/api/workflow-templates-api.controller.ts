import { injectable, inject } from 'inversify';
import { NextRequest, NextResponse } from 'next/server';
import { CreateWorkflowTemplateCommand } from '../../application/commands/create-template-command';
import { UpdateWorkflowTemplateCommand } from '../../application/commands/update-template-command';
import { DeleteWorkflowTemplateCommand } from '../../application/commands/delete-template-command';
import { GetWorkflowTemplateQuery } from '../../application/queries/get-template-query';
import { ListWorkflowTemplatesQuery } from '../../application/queries/list-templates-query';
import { CreateWorkflowTemplateHandler } from '../../application/handlers/create-template-handler';
import { GetWorkflowTemplateHandler } from '../../application/handlers/get-template-handler';
import { ListWorkflowTemplatesHandler } from '../../application/handlers/list-templates-handler';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * Workflow Templates API Controller
 * Handles HTTP requests for workflow template management
 */
@injectable()
export class WorkflowTemplatesApiController {
  constructor(
    @inject(TYPES.CreateWorkflowTemplateHandler) private createTemplateHandler: CreateWorkflowTemplateHandler,
    @inject(TYPES.GetWorkflowTemplateHandler) private getTemplateHandler: GetWorkflowTemplateHandler,
    @inject(TYPES.ListWorkflowTemplatesHandler) private listTemplatesHandler: ListWorkflowTemplatesHandler
  ) {}

  /**
   * GET /api/workflows/templates
   * Get workflow templates with filtering and pagination
   */
  async getTemplates(request: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url);

      const query = new ListWorkflowTemplatesQuery({
        organizationId: searchParams.get('organizationId') || undefined,
        category: searchParams.get('category') || undefined,
        isBuiltIn: searchParams.get('isBuiltIn') === 'true' ? true : undefined,
        isPublic: searchParams.get('isPublic') === 'true' ? true : undefined,
        search: searchParams.get('search') || undefined,
        tags: searchParams.get('tags')?.split(',') || undefined,
        limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
        offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
        sortBy: searchParams.get('sortBy') || undefined,
        sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
      });

      const result = await this.listTemplatesHandler.handle(query);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error?.message || 'Failed to fetch templates' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        templates: result.value.templates.map((t) => t.toObject()),
        total: result.value.total,
      });
    } catch (error) {
      console.error('Error in WorkflowTemplatesApiController.getTemplates:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * GET /api/workflows/templates/[id]
   * Get workflow template by ID
   */
  async getTemplate(templateId: string): Promise<NextResponse> {
    try {
      const query = new GetWorkflowTemplateQuery({
        templateId,
      });

      const result = await this.getTemplateHandler.handle(query);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error?.message || 'Template not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        result.value.toObject(),
        { status: 200 }
      );
    } catch (error) {
      console.error('Error in WorkflowTemplatesApiController.getTemplate:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * POST /api/workflows/templates
   * Create a new workflow template
   */
  async createTemplate(request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();
      const userId = request.headers.get('x-user-id') || undefined;

      const command = new CreateWorkflowTemplateCommand({
        workflowId: body.workflowId,
        name: body.name,
        description: body.description,
        category: body.category,
        template: body.template || {},
        variables: body.variables || {},
        settings: body.settings || {},
        isBuiltIn: body.isBuiltIn,
        isPublic: body.isPublic,
        tags: body.tags || [],
        organizationId: body.organizationId,
        createdBy: userId,
      }, userId);

      const result = await this.createTemplateHandler.handle(command);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error?.message || 'Failed to create template' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        result.value.toObject(),
        { status: 201 }
      );
    } catch (error) {
      console.error('Error in WorkflowTemplatesApiController.createTemplate:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
}
