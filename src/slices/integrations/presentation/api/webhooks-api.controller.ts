import { injectable, inject } from 'inversify';
import { NextRequest, NextResponse } from 'next/server';
import { ListWebhooksQuery } from '../../application/queries/list-webhooks-query';
import { GetWebhookQuery } from '../../application/queries/get-webhook-query';
import { GetWebhookStatsQuery } from '../../application/queries/get-webhook-stats-query';
import { GetWebhookDeliveriesQuery } from '../../application/queries/get-webhook-deliveries-query';
import { CreateWebhookCommand } from '../../application/commands/create-webhook-command';
import { UpdateWebhookCommand } from '../../application/commands/update-webhook-command';
import { DeleteWebhookCommand } from '../../application/commands/delete-webhook-command';
import { TestWebhookCommand } from '../../application/commands/test-webhook-command';
import { ProcessWebhookCommand } from '../../application/commands/process-webhook-command';
import { ListWebhooksHandler } from '../../application/handlers/list-webhooks-handler';
import { CreateWebhookHandler } from '../../application/handlers/create-webhook-handler';
import { UpdateWebhookHandler } from '../../application/handlers/update-webhook-handler';
import { DeleteWebhookHandler } from '../../application/handlers/delete-webhook-handler';
import { GetWebhookHandler } from '../../application/handlers/get-webhook-handler';
import { GetWebhookStatsHandler } from '../../application/handlers/get-webhook-stats-handler';
import { GetWebhookDeliveriesHandler } from '../../application/handlers/get-webhook-deliveries-handler';
import { TestWebhookHandler } from '../../application/handlers/test-webhook-handler';
import { ProcessWebhookHandler } from '../../application/handlers/process-webhook-handler';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * Webhooks API Controller
 */
@injectable()
export class WebhooksApiController {
  constructor(
    @inject(TYPES.ListWebhooksHandler) private listWebhooksHandler: ListWebhooksHandler,
    @inject(TYPES.CreateWebhookHandler) private createWebhookHandler: CreateWebhookHandler,
    @inject(TYPES.UpdateWebhookHandler) private updateWebhookHandler: UpdateWebhookHandler,
    @inject(TYPES.DeleteWebhookHandler) private deleteWebhookHandler: DeleteWebhookHandler,
    @inject(TYPES.GetWebhookHandler) private getWebhookHandler: GetWebhookHandler,
    @inject(TYPES.GetWebhookStatsHandler) private getStatsHandler: GetWebhookStatsHandler,
    @inject(TYPES.GetWebhookDeliveriesHandler) private getDeliveriesHandler: GetWebhookDeliveriesHandler,
    @inject(TYPES.TestWebhookHandler) private testWebhookHandler: TestWebhookHandler,
    @inject(TYPES.ProcessWebhookHandler) private processWebhookHandler: ProcessWebhookHandler
  ) {}

  /**
   * GET /api/integrations/webhooks - List webhooks
   */
  async listWebhooks(request: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url);
      const userId = request.headers.get('x-user-id') || undefined;

      const query = new ListWebhooksQuery({
        organizationId: searchParams.get('organizationId') || '',
        integrationId: searchParams.get('integrationId') || undefined,
        status: searchParams.get('status') || undefined,
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '20'),
      });

      const result = await this.listWebhooksHandler.handle(query);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error?.message },
          { status: 400 }
        );
      }

      return NextResponse.json({
        webhooks: result.value.webhooks.map((w) => w.toObject()),
        pagination: result.value.pagination,
      });
    } catch (error) {
      console.error('Error in WebhooksApiController.listWebhooks:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * POST /api/integrations/webhooks - Create webhook
   */
  async createWebhook(request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();
      const userId = request.headers.get('x-user-id') || undefined;

      const command = new CreateWebhookCommand({
        integrationId: body.integrationId,
        name: body.name,
        url: body.url,
        method: body.method || 'POST',
        events: body.events,
        filters: body.filters,
        headers: body.headers,
        retryPolicy: body.retryPolicy,
        timeout: body.timeout,
        organizationId: body.organizationId,
      }, userId);

      const result = await this.createWebhookHandler.handle(command);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error?.message },
          { status: 400 }
        );
      }

      return NextResponse.json({
        ...result.value.webhook.toObject(),
        secret: result.value.secret,
      }, { status: 201 });
    } catch (error) {
      console.error('Error in WebhooksApiController.createWebhook:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * GET /api/integrations/webhooks/[id] - Get webhook by ID
   */
  async getWebhook(webhookId: string, request: NextRequest): Promise<NextResponse> {
    try {
      const organizationId = request.headers.get('x-organization-id') || '';

      const query = new GetWebhookQuery({
        webhookId,
        organizationId,
      });

      const result = await this.getWebhookHandler.handle(query);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error?.message },
          { status: 404 }
        );
      }

      return NextResponse.json(result.value.toObject());
    } catch (error) {
      console.error('Error in WebhooksApiController.getWebhook:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * PUT /api/integrations/webhooks/[id] - Update webhook
   */
  async updateWebhook(webhookId: string, request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();
      const userId = request.headers.get('x-user-id') || undefined;

      const command = new UpdateWebhookCommand({
        webhookId,
        url: body.url,
        events: body.events,
        isEnabled: body.isEnabled,
      }, userId);

      const result = await this.updateWebhookHandler.handle(command);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error?.message },
          { status: 400 }
        );
      }

      return NextResponse.json(result.value.toObject());
    } catch (error) {
      console.error('Error in WebhooksApiController.updateWebhook:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * DELETE /api/integrations/webhooks/[id] - Delete webhook
   */
  async deleteWebhook(webhookId: string, request: NextRequest): Promise<NextResponse> {
    try {
      const userId = request.headers.get('x-user-id') || undefined;

      const command = new DeleteWebhookCommand({
        webhookId,
      }, userId);

      const result = await this.deleteWebhookHandler.handle(command);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error?.message },
          { status: 400 }
        );
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error in WebhooksApiController.deleteWebhook:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * POST /api/integrations/webhooks/[id]/test
   */
  async testWebhook(webhookId: string, request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();
      const userId = request.headers.get('x-user-id') || undefined;

      const command = new TestWebhookCommand({
        webhookId,
        event: body.event,
        organizationId: body.organizationId,
      }, userId);

      const result = await this.testWebhookHandler.handle(command);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error?.message },
          { status: 400 }
        );
      }

      return NextResponse.json(result.value);
    } catch (error) {
      console.error('Error in WebhooksApiController.testWebhook:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * GET /api/integrations/webhooks/[id]/stats
   */
  async getWebhookStats(webhookId: string, request: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url);

      const query = new GetWebhookStatsQuery({
        webhookId,
        organizationId: searchParams.get('organizationId') || '',
        startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
        endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
        period: (searchParams.get('period') as '1h' | '24h' | '7d' | '30d') || undefined,
      });

      const result = await this.getStatsHandler.handle(query);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error?.message },
          { status: 400 }
        );
      }

      return NextResponse.json(result.value);
    } catch (error) {
      console.error('Error in WebhooksApiController.getWebhookStats:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * POST /api/integrations/webhooks/[id]/process - Process incoming webhook
   */
  async processWebhook(webhookId: string, request: NextRequest): Promise<NextResponse> {
    try {
      const payload = await request.json();
      const headers: Record<string, string> = {};

      request.headers.forEach((value, key) => {
        headers[key] = value;
      });

      const organizationId = request.headers.get('x-organization-id') || '';

      const command = new ProcessWebhookCommand({
        webhookId,
        payload,
        headers,
        organizationId,
      });

      const result = await this.processWebhookHandler.handle(command);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error?.message },
          { status: 400 }
        );
      }

      return NextResponse.json(result.value);
    } catch (error) {
      console.error('Error in WebhooksApiController.processWebhook:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * GET /api/integrations/webhooks/[id]/process - Get webhook processing status
   */
  async getWebhookDeliveries(webhookId: string, request: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url);
      const organizationId = request.headers.get('x-organization-id') || '';

      const query = new GetWebhookDeliveriesQuery({
        webhookId,
        organizationId,
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '20'),
        status: searchParams.get('status') || undefined,
        event: searchParams.get('event') || undefined,
      });

      const result = await this.getDeliveriesHandler.handle(query);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error?.message },
          { status: 400 }
        );
      }

      return NextResponse.json({
        deliveries: result.value.deliveries.map((d) => d.toObject()),
        pagination: result.value.pagination,
      });
    } catch (error) {
      console.error('Error in WebhooksApiController.getWebhookDeliveries:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
}
