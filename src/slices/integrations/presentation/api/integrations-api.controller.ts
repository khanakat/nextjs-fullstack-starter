import { injectable, inject } from 'inversify';
import { NextRequest, NextResponse } from 'next/server';
import { CreateIntegrationCommand } from '../../application/commands/create-integration-command';
import { UpdateIntegrationCommand } from '../../application/commands/update-integration-command';
import { DeleteIntegrationCommand } from '../../application/commands/delete-integration-command';
import { SyncIntegrationCommand } from '../../application/commands/sync-integration-command';
import { ConnectIntegrationCommand } from '../../application/commands/connect-integration-command';
import { DisconnectIntegrationCommand } from '../../application/commands/disconnect-integration-command';
import { HandleOAuthCallbackCommand } from '../../application/commands/handle-oauth-callback-command';
import { TestIntegrationCommand } from '../../application/commands/test-integration-command';
import { GetIntegrationQuery } from '../../application/queries/get-integration-query';
import { GetIntegrationsQuery } from '../../application/queries/get-integrations-query';
import { GetConnectionStatusQuery } from '../../application/queries/get-connection-status-query';
import { GetTestHistoryQuery } from '../../application/queries/get-test-history-query';
import { CreateIntegrationHandler } from '../../application/handlers/create-integration-handler';
import { UpdateIntegrationHandler } from '../../application/handlers/update-integration-handler';
import { DeleteIntegrationHandler } from '../../application/handlers/delete-integration-handler';
import { SyncIntegrationHandler } from '../../application/handlers/sync-integration-handler';
import { ConnectIntegrationHandler } from '../../application/handlers/connect-integration-handler';
import { DisconnectIntegrationHandler } from '../../application/handlers/disconnect-integration-handler';
import { HandleOAuthCallbackHandler } from '../../application/handlers/handle-oauth-callback-handler';
import { TestIntegrationHandler } from '../../application/handlers/test-integration-handler';
import { GetIntegrationHandler } from '../../application/handlers/get-integration-handler';
import { GetIntegrationsHandler } from '../../application/handlers/get-integrations-handler';
import { GetConnectionStatusHandler } from '../../application/handlers/get-connection-status-handler';
import { GetTestHistoryHandler } from '../../application/handlers/get-test-history-handler';
import { IntegrationStatus } from '../../domain/entities/integration';
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
    @inject(TYPES.SyncIntegrationHandler) private syncIntegrationHandler: SyncIntegrationHandler,
    @inject(TYPES.GetIntegrationHandler) private getIntegrationHandler: GetIntegrationHandler,
    @inject(TYPES.GetIntegrationsHandler) private getIntegrationsHandler: GetIntegrationsHandler,
    @inject(TYPES.ConnectIntegrationHandler) private connectIntegrationHandler: ConnectIntegrationHandler,
    @inject(TYPES.DisconnectIntegrationHandler) private disconnectIntegrationHandler: DisconnectIntegrationHandler,
    @inject(TYPES.HandleOAuthCallbackHandler) private handleOAuthCallbackHandler: HandleOAuthCallbackHandler,
    @inject(TYPES.GetConnectionStatusHandler) private getConnectionStatusHandler: GetConnectionStatusHandler,
    @inject(TYPES.TestIntegrationHandler) private testIntegrationHandler: TestIntegrationHandler,
    @inject(TYPES.GetTestHistoryHandler) private getTestHistoryHandler: GetTestHistoryHandler
  ) {}

  /**
   * GET /api/integrations
   * Get integrations with filtering and pagination
   */
  async getIntegrations(request: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url);
      const statusParam = searchParams.get('status');

      const query = new GetIntegrationsQuery({
        organizationId: searchParams.get('organizationId') || undefined,
        type: searchParams.get('type') || undefined,
        status: statusParam as IntegrationStatus | undefined,
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
        config: body.config ? JSON.stringify(body.config) : '{}',
        organizationId: body.organizationId,
        status: body.status as IntegrationStatus | undefined,
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
        type: body.type,
        provider: body.provider,
        config: body.config ? JSON.stringify(body.config) : undefined,
        status: body.status as IntegrationStatus | undefined,
        lastSyncAt: body.lastSyncAt,
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

  /**
   * POST /api/integrations/[id]/sync
   * Trigger integration synchronization
   */
  async syncIntegration(integrationId: string, request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();
      const userId = request.headers.get('x-user-id') || undefined;

      const command = new SyncIntegrationCommand({
        integrationId,
        organizationId: body.organizationId,
        connectionId: body.connectionId,
        syncType: body.syncType || 'incremental',
        options: body.options,
      }, userId);

      const result = await this.syncIntegrationHandler.handle(command);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error?.message },
          { status: 400 }
        );
      }

      return NextResponse.json(result.value);
    } catch (error) {
      console.error('Error in IntegrationsApiController.syncIntegration:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * POST /api/integrations/[id]/connect
   * Initiate connection for integration (OAuth or direct credentials)
   */
  async connectIntegration(integrationId: string, request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();
      const userId = request.headers.get('x-user-id') || undefined;

      const command = new ConnectIntegrationCommand({
        integrationId,
        connectionType: body.connectionType,
        credentials: body.credentials,
        config: body.config,
        redirectUrl: body.redirectUrl,
      }, userId);

      const result = await this.connectIntegrationHandler.handle(command);

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
      console.error('Error in IntegrationsApiController.connectIntegration:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * GET /api/integrations/[id]/connect
   * Get connection status for integration
   */
  async getConnectionStatus(integrationId: string, request: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url);
      const organizationId = searchParams.get('organizationId') || '';

      const query = new GetConnectionStatusQuery({
        integrationId,
        organizationId,
      });

      const result = await this.getConnectionStatusHandler.handle(query);

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
      console.error('Error in IntegrationsApiController.getConnectionStatus:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * POST /api/integrations/[id]/disconnect
   * Disconnect an integration connection
   */
  async disconnectIntegration(integrationId: string, request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();
      const userId = request.headers.get('x-user-id') || undefined;

      const command = new DisconnectIntegrationCommand({
        integrationId,
        connectionId: body.connectionId,
      }, userId);

      const result = await this.disconnectIntegrationHandler.handle(command);

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
      console.error('Error in IntegrationsApiController.disconnectIntegration:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * GET /api/integrations/oauth/callback
   * Handle OAuth callback from external provider
   */
  async handleOAuthCallback(request: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url);
      const code = searchParams.get('code') || '';
      const state = searchParams.get('state') || '';
      const error = searchParams.get('error') || undefined;
      const errorDescription = searchParams.get('error_description') || undefined;
      const integrationId = searchParams.get('integration_id') || '';

      const userId = request.headers.get('x-user-id') || undefined;

      const command = new HandleOAuthCallbackCommand({
        integrationId,
        code,
        state,
        organizationId: '', // Will be fetched from user context in handler
        error,
        errorDescription,
      }, userId);

      const result = await this.handleOAuthCallbackHandler.handle(command);

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
      console.error('Error in IntegrationsApiController.handleOAuthCallback:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * POST /api/integrations/[id]/test
   * Test integration connection
   */
  async testIntegration(integrationId: string, request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();
      const userId = request.headers.get('x-user-id') || undefined;

      const command = new TestIntegrationCommand({
        integrationId,
        connectionId: body.connectionId,
        testCapabilities: body.testCapabilities,
      }, userId);

      const result = await this.testIntegrationHandler.handle(command);

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
      console.error('Error in IntegrationsApiController.testIntegration:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * GET /api/integrations/[id]/test
   * Get test history for integration
   */
  async getTestHistory(integrationId: string, request: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url);
      const connectionId = searchParams.get('connectionId') || undefined;
      const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

      const query = new GetTestHistoryQuery({
        integrationId,
        connectionId,
        limit,
      });

      const result = await this.getTestHistoryHandler.handle(query);

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
      console.error('Error in IntegrationsApiController.getTestHistory:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
}
