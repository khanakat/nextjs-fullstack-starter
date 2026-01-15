import { injectable, inject } from 'inversify';
import { NextRequest, NextResponse } from 'next/server';
import { TYPES } from '@/shared/infrastructure/di/types';
import { logger } from '@/lib/logger';
import { ApiError, errorResponse } from '@/lib/api-utils';
import {
  ListApiKeysQuery,
  GetSecurityEventsQuery,
  GetSecurityMetricsQuery,
  GetPermissionAnalyticsQuery,
  GetViolationsQuery,
  AuditUserPermissionsQuery,
  GetComplianceReportQuery,
} from '../../application/queries';

import {
  CreateApiKeyCommand,
  CreateSecurityEventCommand,
  ResolveViolationCommand,
  LogPermissionCheckCommand,
  CreateViolationCommand,
  UpdateSecurityEventCommand,
} from '../../application/commands';
import {
  ListApiKeysHandler,
  CreateApiKeyHandler,
  ListSecurityEventsHandler,
  GetSecurityMetricsHandler,
  GetPermissionAnalyticsHandler,
  GetViolationsHandler,
  AuditUserPermissionsHandler,
  GetComplianceReportHandler,
  ResolveViolationHandler,
  LogPermissionCheckHandler,
  CreateViolationHandler,
  UpdateSecurityEventHandler,
} from '../../application/handlers';

/**
 * Security API Controller
 * Handles all security-related HTTP requests
 */
@injectable()
export class SecurityApiController {
  constructor(
    @inject(TYPES.ListApiKeysHandler) private listApiKeysHandler: ListApiKeysHandler,
    @inject(TYPES.CreateApiKeyHandler) private createApiKeyHandler: CreateApiKeyHandler,
    @inject(TYPES.GetPermissionAnalyticsHandler) private getPermissionAnalyticsHandler: GetPermissionAnalyticsHandler,
    @inject(TYPES.GetViolationsHandler) private getViolationsHandler: GetViolationsHandler,
    @inject(TYPES.AuditUserPermissionsHandler) private auditUserPermissionsHandler: AuditUserPermissionsHandler,
    @inject(TYPES.GetComplianceReportHandler) private getComplianceReportHandler: GetComplianceReportHandler,
    @inject(TYPES.ResolveViolationHandler) private resolveViolationHandler: ResolveViolationHandler,
    @inject(TYPES.LogPermissionCheckHandler) private logPermissionCheckHandler: LogPermissionCheckHandler,
    @inject(TYPES.CreateViolationHandler) private createViolationHandler: CreateViolationHandler,
    @inject(TYPES.ListSecurityEventsHandler) private listSecurityEventsHandler: ListSecurityEventsHandler,
    @inject(TYPES.UpdateSecurityEventHandler) private updateSecurityEventHandler: UpdateSecurityEventHandler,
    @inject(TYPES.GetSecurityMetricsHandler) private getSecurityMetricsHandler: GetSecurityMetricsHandler,
  ) {}

  /**
   * GET /api/security/api-keys
   * List API keys for an organization
   */
  async listApiKeys(request: NextRequest): Promise<NextResponse> {
    try {
      const organizationId = request.headers.get('x-organization-id');
      if (!organizationId) {
        return NextResponse.json(
          { error: 'Organization ID required' },
          { status: 400 },
        );
      }

      const query = new ListApiKeysQuery({ organizationId });
      const result = await this.listApiKeysHandler.handle(query);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error?.message || 'Failed to list API keys' },
          { status: 400 },
        );
      }

      return NextResponse.json({ apiKeys: result.value });
    } catch (error) {
      logger.apiError('Error processing security request', 'security', error, {
        endpoint: '/api/security/api-keys',
      });

      if (error instanceof ApiError) {
        return errorResponse(error);
      }

      return errorResponse('Failed to process security request', 500);
    }
  }

  /**
   * POST /api/security/api-keys
   * Create a new API key
   */
  async createApiKey(request: NextRequest): Promise<NextResponse> {
    try {
      const organizationId = request.headers.get('x-organization-id');
      if (!organizationId) {
        return NextResponse.json(
          { error: 'Organization ID required' },
          { status: 400 },
        );
      }

      const userId = request.headers.get('x-user-id');
      if (!userId) {
        return NextResponse.json(
          { error: 'User ID required' },
          { status: 401 },
        );
      }

      const body = await request.json();
      const { name, permissions, expiresAt, rateLimit } = body;

      if (!name || !permissions || !Array.isArray(permissions)) {
        return NextResponse.json(
          { error: 'Name and permissions are required' },
          { status: 400 },
        );
      }

      const command = new CreateApiKeyCommand({
        name,
        organizationId,
        permissions,
        expiresAt,
        rateLimit,
        userId,
      });

      const result = await this.createApiKeyHandler.handle(command);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error?.message || 'Failed to create API key' },
          { status: 400 },
        );
      }

      return NextResponse.json(result.value, { status: 201 });
    } catch (error) {
      logger.apiError('Error processing security request', 'security', error, {
        endpoint: '/api/security/api-keys',
      });

      if (error instanceof ApiError) {
        return errorResponse(error);
      }

      return errorResponse('Failed to process security request', 500);
    }
  }

  /**
   * GET /api/security/audit
   * Get security audit data (analytics, violations, user audit, compliance)
   */
  async getAuditData(request: NextRequest): Promise<NextResponse> {
    try {
      const url = new URL(request.url);
      const type = url.searchParams.get('type') || 'analytics';

      switch (type) {
        case 'analytics': {
          const startDate = url.searchParams.get('startDate');
          const endDate = url.searchParams.get('endDate');
          const organizationId = url.searchParams.get('organizationId');

          const query = new GetPermissionAnalyticsQuery({
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            organizationId: organizationId || undefined,
          });

          const result = await this.getPermissionAnalyticsHandler.handle(query);

          if (result.isFailure) {
            return NextResponse.json(
              { error: result.error?.message || 'Failed to get analytics' },
              { status: 400 },
            );
          }

          return NextResponse.json(result.value);
        }

        case 'violations': {
          const limit = parseInt(url.searchParams.get('limit') || '50');
          const organizationId = url.searchParams.get('organizationId');

          const query = new GetViolationsQuery({
            limit,
            organizationId: organizationId || undefined,
          });

          const result = await this.getViolationsHandler.handle(query);

          if (result.isFailure) {
            return NextResponse.json(
              { error: result.error?.message || 'Failed to get violations' },
              { status: 400 },
            );
          }

          return NextResponse.json(result.value);
        }

        case 'user-audit': {
          const userId = url.searchParams.get('userId');
          if (!userId) {
            return NextResponse.json(
              { error: 'User ID is required for user audit' },
              { status: 400 },
            );
          }

          const query = new AuditUserPermissionsQuery({ userId });
          const result = await this.auditUserPermissionsHandler.handle(query);

          if (result.isFailure) {
            return NextResponse.json(
              { error: result.error?.message || 'Failed to audit user' },
              { status: 400 },
            );
          }

          return NextResponse.json(result.value);
        }

        case 'compliance': {
          const organizationId = url.searchParams.get('organizationId');

          const query = new GetComplianceReportQuery({
            organizationId: organizationId || undefined,
          });

          const result = await this.getComplianceReportHandler.handle(query);

          if (result.isFailure) {
            return NextResponse.json(
              { error: result.error?.message || 'Failed to get compliance report' },
              { status: 400 },
            );
          }

          return NextResponse.json(result.value);
        }

        default:
          return NextResponse.json(
            { error: 'Invalid audit type' },
            { status: 400 },
          );
      }
    } catch (error) {
      console.error('Error fetching audit data:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 },
      );
    }
  }

  /**
   * POST /api/security/audit
   * Manage audit data (resolve violations, log permission checks, create violations)
   */
  async manageAuditData(request: NextRequest): Promise<NextResponse> {
    try {
      const userId = request.headers.get('x-user-id');
      if (!userId) {
        return NextResponse.json(
          { error: 'User ID required' },
          { status: 401 },
        );
      }

      const body = await request.json();
      const { action, data } = body;

      switch (action) {
        case 'resolve_violation': {
          const { violationId, resolution } = data;

          if (!violationId) {
            return NextResponse.json(
              { error: 'Violation ID is required' },
              { status: 400 },
            );
          }

          const command = new ResolveViolationCommand({
            violationId,
            userId,
            resolution: resolution || 'Resolved by admin',
          });

          const result = await this.resolveViolationHandler.handle(command);

          if (result.isFailure) {
            return NextResponse.json(
              { error: result.error?.message || 'Failed to resolve violation' },
              { status: 400 },
            );
          }

          return NextResponse.json(result.value);
        }

        case 'log_permission_check': {
          const {
            targetUserId,
            targetUserEmail,
            targetUserRole,
            resource,
            action: permissionAction,
            granted,
            context,
          } = data;

          const command = new LogPermissionCheckCommand({
            targetUserId,
            targetUserEmail,
            targetUserRole,
            resource,
            action: permissionAction,
            granted,
            context,
          });

          const result = await this.logPermissionCheckHandler.handle(command);

          if (result.isFailure) {
            return NextResponse.json(
              { error: result.error?.message || 'Failed to log permission check' },
              { status: 400 },
            );
          }

          return NextResponse.json(result.value);
        }

        case 'create_violation': {
          const command = new CreateViolationCommand({ violation: data });
          const result = await this.createViolationHandler.handle(command);

          if (result.isFailure) {
            return NextResponse.json(
              { error: result.error?.message || 'Failed to create violation' },
              { status: 400 },
            );
          }

          return NextResponse.json(result.value);
        }

        default:
          return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
      }
    } catch (error) {
      console.error('Error processing audit request:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 },
      );
    }
  }

  /**
   * GET /api/security/events
   * List security events
   */
  async listSecurityEvents(request: NextRequest): Promise<NextResponse> {
    try {
      const url = new URL(request.url);
      const organizationId = url.searchParams.get('organizationId');
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      if (!organizationId) {
        return NextResponse.json(
          { error: 'Organization ID is required' },
          { status: 400 },
        );
      }

      const query = new GetSecurityEventsQuery({
        organizationId,
        page: Math.floor(offset / limit) + 1,
        limit,
      });

      const result = await this.listSecurityEventsHandler.handle(query);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error?.message || 'Failed to list events' },
          { status: 400 },
        );
      }

      return NextResponse.json(result.value);
    } catch (error) {
      logger.apiError('Error processing security request', 'security', error, {
        endpoint: '/api/security/events',
      });

      if (error instanceof ApiError) {
        return errorResponse(error);
      }

      return errorResponse('Failed to process security request', 500);
    }
  }

  /**
   * PATCH /api/security/events
   * Update security event (resolve/unresolve)
   */
  async updateSecurityEvent(request: NextRequest): Promise<NextResponse> {
    try {
      const userId = request.headers.get('x-user-id');
      if (!userId) {
        return NextResponse.json(
          { error: 'User ID required' },
          { status: 401 },
        );
      }

      const body = await request.json();
      const { eventId, resolved } = body;

      if (!eventId || typeof resolved !== 'boolean') {
        return NextResponse.json(
          { error: 'Invalid request body' },
          { status: 400 },
        );
      }

      const command = new UpdateSecurityEventCommand({
        eventId,
        resolved,
        userId,
      });

      const result = await this.updateSecurityEventHandler.handle(command);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error?.message || 'Failed to update event' },
          { status: 400 },
        );
      }

      return NextResponse.json(result.value);
    } catch (error) {
      logger.apiError('Error processing security request', 'security', error, {
        endpoint: '/api/security/events',
      });

      if (error instanceof ApiError) {
        return errorResponse(error);
      }

      return errorResponse('Failed to process security request', 500);
    }
  }

  /**
   * GET /api/security/metrics
   * Get security metrics
   */
  async getSecurityMetrics(request: NextRequest): Promise<NextResponse> {
    try {
      const url = new URL(request.url);
      const organizationId = url.searchParams.get('organizationId');
      const range = url.searchParams.get('range') || '24h';

      if (!organizationId) {
        return NextResponse.json(
          { error: 'Organization ID is required' },
          { status: 400 },
        );
      }

      // Calculate time range
      const now = new Date();
      let startTime: Date;

      switch (range) {
        case '1h':
          startTime = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '24h':
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      const query = new GetSecurityMetricsQuery({
        organizationId,
        range: range as '1h' | '24h' | '7d' | '30d',
        startDate: startTime,
        endDate: now,
      });

      const result = await this.getSecurityMetricsHandler.handle(query);

      if (result.isFailure) {
        return NextResponse.json(
          { error: result.error?.message || 'Failed to get metrics' },
          { status: 400 },
        );
      }

      return NextResponse.json(result.value);
    } catch (error) {
      logger.apiError('Error processing security request', 'security', error, {
        endpoint: '/api/security/metrics',
      });

      if (error instanceof ApiError) {
        return errorResponse(error);
      }

      return errorResponse('Failed to process security request', 500);
    }
  }
}
