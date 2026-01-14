import { injectable, inject } from 'inversify';
import { NextRequest, NextResponse } from 'next/server';
import { ListTemplatesQuery } from '../../application/queries/list-templates-query';
import { CreateIntegrationFromTemplateCommand } from '../../application/commands/create-integration-from-template-command';
import { ListTemplatesHandler } from '../../application/handlers/list-templates-handler';
import { CreateIntegrationFromTemplateHandler } from '../../application/handlers/create-integration-from-template-handler';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * Integration Templates API Controller
 */
@injectable()
export class IntegrationTemplatesApiController {
  constructor(
    @inject(TYPES.ListTemplatesHandler) private listTemplatesHandler: ListTemplatesHandler,
    @inject(TYPES.CreateIntegrationFromTemplateHandler) private createFromTemplateHandler: CreateIntegrationFromTemplateHandler
  ) {}

  /**
   * GET /api/integrations/templates
   */
  async getTemplates(request: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url);

      const query = new ListTemplatesQuery({
        provider: searchParams.get('provider') || undefined,
        category: searchParams.get('category') || undefined,
        organizationId: searchParams.get('organizationId') || undefined,
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '20'),
      });

      const result = await this.listTemplatesHandler.handle(query);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error?.message },
          { status: 400 }
        );
      }

      return NextResponse.json(result.value);
    } catch (error) {
      console.error('Error in IntegrationTemplatesApiController.getTemplates:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * POST /api/integrations/templates
   */
  async createFromTemplate(request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();
      const userId = request.headers.get('x-user-id') || undefined;

      const command = new CreateIntegrationFromTemplateCommand({
        templateId: body.templateId,
        name: body.name,
        customConfig: body.customConfig,
        organizationId: body.organizationId,
      }, userId);

      const result = await this.createFromTemplateHandler.handle(command);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error?.message },
          { status: 400 }
        );
      }

      return NextResponse.json(
        result.value.toObject(),
        { status: 201 }
      );
    } catch (error) {
      console.error('Error in IntegrationTemplatesApiController.createFromTemplate:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
}
