import { injectable, inject } from 'inversify';
import { NextRequest, NextResponse } from 'next/server';
import { CreateIntegrationCommand } from '../../application/commands/create-integration-command';
import { UpdateIntegrationCommand } from '../../application/commands/update-integration-command';
import { DeleteIntegrationCommand } from '../../application/commands/delete-integration-command';
import { GetIntegrationQuery } from '../../application/queries/get-integration-query';
import { GetIntegrationsQuery } from '../../application/queries/get-integrations-query';
import { CreateIntegrationHandler } from '../../application/handlers/create-integration-handler';
import { UpdateIntegrationHandler } from '../../application/handlers/update-integration-handler';
import { DeleteIntegrationHandler } from '../../application/handlers/delete-integration-handler';
import { GetIntegrationHandler } from '../../application/handlers/get-integration-handler';
import { GetIntegrationsHandler } from '../../application/handlers/get-integrations-handler';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * Integrations API Controller
 * Handles HTTP requests for integration management
 */
@injectable()
export class IntegrationsApiController {
  constructor(
    @inject(TYPES.CreateIntegrationHandler) private createIntegrationHandler: CreateIntegrationHandler,
    @inject(TYPES.UpdateIntegrationHandler) private updateIntegrationHandler: UpdateIntegrationHandler,
    @inject(TYPES.DeleteIntegrationHandler) private deleteIntegrationHandler: DeleteIntegrationHandler,
    @inject(TYPES.GetIntegrationHandler) private getIntegrationHandler: GetIntegrationHandler,
    @inject(TYPES.GetIntegrationsHandler) private getIntegrationsHandler: GetIntegrationsHandler
  ) {}

  /**
   * GET /api/integrations
   * Get integrations with filtering and pagination
   */
  async getIntegrations(request: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url);

      const query = new GetIntegrationsQuery({
        organizationId: searchParams.get('organizationId') || undefined,
        type: searchParams.get('type') || undefined,
        status: searchParams.get('status') || undefined,
        provider: searchParams.get('provider') || undefined,
        limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
        offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
      });

      const result = await this.getIntegrationsHandler.handle(query);

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
      console.error('Error in IntegrationsApiController.getIntegrations:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * GET /api/integrations/[id]
   * Get integration by ID
   */
  async getIntegration(integrationId: string): Promise<NextResponse> {
    try {
      const query = new GetIntegrationQuery({ integrationId });
      const result = await this.getIntegrationHandler.handle(query);

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
      console.error('Error in IntegrationsApiController.getIntegration:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * POST /api/integrations
   * Create a new integration
   */
  async createIntegration(request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();

      const command = new CreateIntegrationCommand({
        name: body.name,
        provider: body.provider,
        type: body.type,
        category: body.category,
        config: body.config ? JSON.stringify(body.config) : '{}',
        settings: body.settings ? JSON.stringify(body.settings) : '{}',
        description: body.description || '',
        organizationId: body.organizationId,
        createdBy: body.userId,
      });

      const result = await this.createIntegrationHandler.handle(command);

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
      console.error('Error in IntegrationsApiController.createIntegration:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * PUT /api/integrations/[id]
   * Update an integration
   */
  async updateIntegration(integrationId: string, request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();

      const command = new UpdateIntegrationCommand({
        integrationId,
        name: body.name,
        config: body.config ? JSON.stringify(body.config) : undefined,
        settings: body.settings ? JSON.stringify(body.settings) : undefined,
        description: body.description,
        isEnabled: body.isEnabled,
      });

      const result = await this.updateIntegrationHandler.handle(command);

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
      console.error('Error in IntegrationsApiController.updateIntegration:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * DELETE /api/integrations/[id]
   * Delete an integration
   */
  async deleteIntegration(integrationId: string): Promise<NextResponse> {
    try {
      const command = new DeleteIntegrationCommand({ integrationId });
      const result = await this.deleteIntegrationHandler.handle(command);

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
      console.error('Error in IntegrationsApiController.deleteIntegration:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
}
